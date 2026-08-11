import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Search, 
  Package, 
  MapPin, 
  Clock, 
  CheckCircle, 
  Truck, 
  AlertCircle,
  Calendar,
  Phone,
  BellRing,
  History,
  ArrowRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { Shipment, ShipmentStatus } from '@/types/shipment';
import { trackShipment } from '@/services/api';
import { getRecentlyTracked, initializeDemoData, getShipmentByTrackingId } from '@/services/storage';
import { validateTrackingId } from '@/utils/validators';
import { getShipmentEvents, ShipmentEvent } from '@/services/notificationService';
import { ShipmentMap } from '@/components/tracking/ShipmentMap';
import { formatDate, formatDateTime, formatCountdown, formatWeight } from '@/utils/formatters';
import { cn } from '@/lib/utils';

const statusConfig: Record<ShipmentStatus, { icon: typeof Package; color: string; label: string }> = {
  pending: { icon: Package, color: 'text-warning', label: 'Pending' },
  processing: { icon: Package, color: 'text-warning', label: 'Processing' },
  in_transit: { icon: Truck, color: 'text-primary', label: 'In Transit' },
  out_for_delivery: { icon: Truck, color: 'text-info', label: 'Out for Delivery' },
  delivered: { icon: CheckCircle, color: 'text-success', label: 'Delivered' },
};

export default function TrackShipment() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [trackingId, setTrackingId] = useState(searchParams.get('id') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, isOverdue: false });
  const [notifications, setNotifications] = useState<
    { id: string; type: 'eta' | 'delivered' | 'status' | 'location'; title: string; description: string; at: string }[]
  >([]);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const lastSnapshot = useRef<{ eta: string; status: ShipmentStatus; location: string } | null>(null);

  useEffect(() => {
    initializeDemoData();
  }, []);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      handleSearch(id);
    }
  }, [searchParams]);

  useEffect(() => {
    if (shipment && shipment.status !== 'delivered') {
      const updateCountdown = () => {
        setCountdown(formatCountdown(shipment.estimatedDelivery));
      };
      updateCountdown();
      const interval = setInterval(updateCountdown, 60000);
      return () => clearInterval(interval);
    }
  }, [shipment]);

  // Watch for admin updates (ETA changes / delivery) on the tracked shipment
  useEffect(() => {
    if (!shipment) {
      lastSnapshot.current = null;
      return;
    }

    lastSnapshot.current = {
      eta: shipment.estimatedDelivery,
      status: shipment.status,
      location: `${shipment.currentLocation.city}, ${shipment.currentLocation.country}`,
    };
    const currentId = shipment.trackingId;
    setEvents(getShipmentEvents(currentId));

    const check = () => {
      const latest = getShipmentByTrackingId(currentId);
      const prev = lastSnapshot.current;
      if (!latest || !prev) return;

      const news: typeof notifications = [];

      if (latest.estimatedDelivery !== prev.eta) {
        news.push({
          id: `eta-${Date.now()}`,
          type: 'eta',
          title: 'Delivery date & time updated',
          description: `New estimated delivery: ${formatDateTime(latest.estimatedDelivery)}`,
          at: new Date().toISOString(),
        });
      }
  
      const latestLocation = `${latest.currentLocation.city}, ${latest.currentLocation.country}`;
      if (latestLocation !== prev.location) {
        news.push({
          id: `location-${Date.now()}`,
          type: 'location',
          title: 'Package location updated',
          description: `Your package is now at ${latestLocation}.`,
          at: new Date().toISOString(),
        });
      }

      if (latest.status !== prev.status) {
        news.push(
          latest.status === 'delivered'
            ? {
                id: `delivered-${Date.now()}`,
                type: 'delivered',
                title: 'Shipment delivered',
                description: `${latest.trackingId} was marked as delivered${
                  latest.deliveredAt ? ` on ${formatDateTime(latest.deliveredAt)}` : ''
                }.`,
                at: new Date().toISOString(),
              }
            : {
                id: `status-${Date.now()}`,
                type: 'status',
                title: 'Shipment status updated',
                description: `Status is now "${statusConfig[latest.status]?.label ?? latest.status}".`,
                at: new Date().toISOString(),
              }
        );
      }

      setEvents(getShipmentEvents(currentId));

      if (news.length > 0) {
        lastSnapshot.current = {
          eta: latest.estimatedDelivery,
          status: latest.status,
          location: latestLocation,
        };
        setShipment(latest);
        setNotifications((current) => [...news, ...current].slice(0, 5));
        news.forEach((n) =>
          toast({
            title: n.title,
            description: n.description,
          })
        );
      }
    };

    const interval = setInterval(check, 3000);
    window.addEventListener('storage', check);
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', check);
    };
  }, [shipment?.trackingId]);


  const handleSearch = async (id?: string) => {
    const searchId = id || trackingId;
    const validation = validateTrackingId(searchId);
    
    if (!validation.valid) {
      setError(validation.error || t('tracking.invalidFormat'));
      return;
    }

    setIsLoading(true);
    setError('');
    setShipment(null);
    setNotifications([]);
    setEvents([]);

    try {
      const result = await trackShipment(searchId.toUpperCase());
      
      if (result.success && result.data) {
        setShipment(result.data);
      } else {
        setError(t('tracking.notFound'));
      }
    } catch {
      toast({
        title: t('common.error'),
        description: t('errors.generic'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const recentlyTracked = getRecentlyTracked();

  return (
    <Layout>
      <div className="container-custom py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-4">
            {t('tracking.title')}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('tracking.subtitle')}
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto mb-12"
        >
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                placeholder={t('tracking.placeholder')}
                className="pl-12 h-12"
              />
            </div>
            <Button type="submit" size="lg" disabled={isLoading}>
              {isLoading ? t('tracking.searching') : t('tracking.button')}
            </Button>
          </div>
          {error && (
            <p className="text-destructive text-sm mt-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}
        </motion.form>

        {/* Loading State */}
        {isLoading && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-60 w-full rounded-xl" />
          </div>
        )}

        {/* Shipment Details */}
        {shipment && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            {/* Live update notifications */}
            {notifications.length > 0 && (
              <div className="space-y-3">
                {notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-4',
                      n.type === 'delivered'
                        ? 'border-success/40 bg-success/10'
                        : 'border-primary/40 bg-primary/10'
                    )}
                  >
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-background/60 flex items-center justify-center">
                      {n.type === 'delivered' ? (
                        <CheckCircle className="h-5 w-5 text-success" />
                      ) : (
                        <BellRing className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{n.title}</p>
                      <p className="text-sm text-muted-foreground">{n.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDateTime(n.at)}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={t('common.close')}
                      onClick={() => setNotifications((c) => c.filter((x) => x.id !== n.id))}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Live map */}
            <ShipmentMap
              shipment={shipment}
              locationUpdates={events
                .filter((e) => e.type === 'location')
                .map((e) => ({ id: e.id, description: e.description, createdAt: e.createdAt }))}
            />

            {/* Status Card */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Tracking ID</p>
                    <p className="text-2xl font-display font-bold">{shipment.trackingId}</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "text-sm py-1.5 px-4",
                      statusConfig[shipment.status].color
                    )}
                  >
                    {statusConfig[shipment.status].label}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('tracking.currentLocation')}</p>
                      <p className="font-medium">{shipment.currentLocation.city}, {shipment.currentLocation.country}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('tracking.estimatedDelivery')}</p>
                      <p className="font-medium">{formatDateTime(shipment.estimatedDelivery)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Weight</p>
                      <p className="font-medium">{formatWeight(shipment.packageWeight)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Countdown Timer */}
            {shipment.status !== 'delivered' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    {t('tracking.countdown.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {countdown.isOverdue ? (
                    <p className="text-warning font-medium">{t('tracking.countdown.arriving')}</p>
                  ) : (
                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-display font-bold text-primary">{countdown.days}</div>
                        <div className="text-sm text-muted-foreground">{t('tracking.countdown.days')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-display font-bold text-primary">{countdown.hours}</div>
                        <div className="text-sm text-muted-foreground">{t('tracking.countdown.hours')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-display font-bold text-primary">{countdown.minutes}</div>
                        <div className="text-sm text-muted-foreground">{t('tracking.countdown.minutes')}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>{t('tracking.timeline.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {shipment.timeline.map((item, index) => {
                    const StatusIcon = statusConfig[item.status]?.icon || Package;
                    return (
                      <div key={item.status} className="flex gap-4 pb-8 last:pb-0">
                        <div className="relative flex flex-col items-center">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center border-2",
                            item.completed 
                              ? "bg-primary border-primary text-primary-foreground" 
                              : "bg-muted border-border text-muted-foreground"
                          )}>
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          {index < shipment.timeline.length - 1 && (
                            <div className={cn(
                              "absolute top-10 w-0.5 h-full",
                              item.completed ? "bg-primary" : "bg-border"
                            )} />
                          )}
                        </div>
                        <div className="flex-1 pt-1">
                          <h4 className={cn(
                            "font-semibold",
                            item.completed ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {item.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          {item.timestamp && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDateTime(item.timestamp)} {item.location && `• ${item.location}`}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Notification history */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Update History
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Every delivery date, time and status change made by our operations team.
                </p>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No updates yet. You will see every change here as soon as it happens.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {events.map((event) => (
                      <li key={event.id} className="flex gap-3">
                        <div
                          className={cn(
                            'h-9 w-9 shrink-0 rounded-lg flex items-center justify-center',
                            event.type === 'delivered'
                              ? 'bg-success/10 text-success'
                              : event.type === 'eta'
                                ? 'bg-primary/10 text-primary'
                                : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {event.type === 'delivered' ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : event.type === 'eta' ? (
                            <Calendar className="h-5 w-5" />
                          ) : (
                            <Truck className="h-5 w-5" />
                          )}
                        </div>
                        <div className="flex-1 border-b border-border pb-4 last:border-0 last:pb-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-sm">{event.title}</p>
                            <span className="text-xs text-muted-foreground">
                              {formatDateTime(event.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                          {event.from && event.to && (
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                              <Badge variant="outline" className="font-normal">{event.from}</Badge>
                              <ArrowRight className="h-3 w-3 text-muted-foreground" />
                              <Badge variant="secondary" className="font-normal">{event.to}</Badge>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Sender/Receiver Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sender</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{shipment.senderName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" />
                    {shipment.senderPhone}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {shipment.pickupLocation}, {shipment.pickupCity}, {shipment.pickupCountry}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Receiver</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium">{shipment.receiverName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <Phone className="h-4 w-4" />
                    {shipment.receiverPhone}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {shipment.deliveryLocation}, {shipment.deliveryCity}, {shipment.deliveryCountry}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Recently Tracked */}
        {!shipment && !isLoading && recentlyTracked.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl mx-auto"
          >
            <h3 className="font-semibold mb-4">{t('tracking.recentlyTracked')}</h3>
            <div className="space-y-2">
              {recentlyTracked.map((item) => (
                <Link
                  key={item.trackingId}
                  to={`/track?id=${item.trackingId}`}
                  className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{item.trackingId}</p>
                    <p className="text-sm text-muted-foreground">
                      {statusConfig[item.status]?.label}
                    </p>
                  </div>
                  <Badge variant="secondary" className={statusConfig[item.status]?.color}>
                    {statusConfig[item.status]?.label}
                  </Badge>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
