import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion } from 'framer-motion';
import { MapPin, Truck, Flag, Navigation, Loader2, RefreshCw } from 'lucide-react';
import { Shipment, ShipmentStatus } from '@/types/shipment';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { buildArc, geocodePlace, interpolate, GeoPoint, clearGeocodeCache } from '@/services/geocode';


const progressByStatus: Record<ShipmentStatus, number> = {
  pending: 0.02,
  processing: 0.15,
  in_transit: 0.5,
  out_for_delivery: 0.82,
  delivered: 1,
};

function divIcon(html: string, size = 34) {
  return L.divIcon({
    html,
    className: 'movemate-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const pinIcon = (color: string) =>
  divIcon(
    `<span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:9999px;background:${color};box-shadow:0 0 0 6px ${color}33,0 2px 6px rgba(0,0,0,.35)"><span style="width:8px;height:8px;border-radius:9999px;background:#fff"></span></span>`,
    26
  );

const truckIcon = divIcon(
  `<span style="display:flex;align-items:center;justify-content:center;width:38px;height:38px;border-radius:9999px;background:hsl(var(--primary));box-shadow:0 0 0 10px hsl(var(--primary)/.18),0 4px 12px rgba(0,0,0,.35)">
     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
   </span>`,
  38
);

interface ShipmentMapProps {
  shipment: Shipment;
  locationUpdates?: { id: string; description: string; createdAt: string }[];
}

export function ShipmentMap({ shipment, locationUpdates = [] }: ShipmentMapProps) {
  const progress = progressByStatus[shipment.status] ?? 0;
  const isDelivered = shipment.status === 'delivered';

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    travelled?: L.Polyline;
    vehicle?: L.Marker;
    currentDot?: L.CircleMarker;
  }>({});

  const [origin, setOrigin] = useState<GeoPoint | null>(null);
  const [destination, setDestination] = useState<GeoPoint | null>(null);
  const [current, setCurrent] = useState<GeoPoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const pickup = `${shipment.pickupCity}, ${shipment.pickupCountry}`;
  const delivery = `${shipment.deliveryCity}, ${shipment.deliveryCountry}`;
  const currentPlace = `${shipment.currentLocation.city}, ${shipment.currentLocation.country}`;

  const hasRouteError = !loading && (!origin || !destination);

  const handleRetry = () => {
    [pickup, delivery, currentPlace].forEach((place) => clearGeocodeCache(place));
    setLoading(true);
    setRetryCount((c) => c + 1);
  };

  // Geocode the shipment's real cities
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const o = await geocodePlace(pickup);
      const d = await geocodePlace(delivery);
      const c = await geocodePlace(currentPlace);
      if (cancelled) return;
      setOrigin(o);
      setDestination(d);
      setCurrent(c);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [pickup, delivery, currentPlace, retryCount]);


  const arc = useMemo(
    () => (origin && destination ? buildArc(origin, destination, 160) : []),
    [origin, destination]
  );

  // Initialise the real map once we have coordinates
  useEffect(() => {
    if (!containerRef.current || !origin || !destination || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const latlngs = arc.map((p) => [p.lat, p.lng]) as [number, number][];

    L.polyline(latlngs, {
      color: '#64748b',
      weight: 3,
      opacity: 0.55,
      dashArray: '8 10',
    }).addTo(map);

    layersRef.current.travelled = L.polyline([], {
      color: '#2563eb',
      weight: 5,
      opacity: 0.95,
      lineCap: 'round',
    }).addTo(map);

    L.marker([origin.lat, origin.lng], { icon: pinIcon('#2563eb') })
      .bindPopup(`<b>Origin</b><br/>${pickup}`)
      .addTo(map);

    L.marker([destination.lat, destination.lng], {
      icon: pinIcon(isDelivered ? '#16a34a' : '#64748b'),
    })
      .bindPopup(`<b>Destination</b><br/>${delivery}`)
      .addTo(map);

    layersRef.current.vehicle = L.marker([origin.lat, origin.lng], {
      icon: truckIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    map.fitBounds(L.latLngBounds(latlngs), { padding: [50, 50] });
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      layersRef.current = {};
    };
    // Only re-create when the route coordinates actually change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  // Last reported location marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !current) return;
    layersRef.current.currentDot?.remove();
    layersRef.current.currentDot = L.circleMarker([current.lat, current.lng], {
      radius: 7,
      color: '#0ea5e9',
      weight: 2,
      fillColor: '#0ea5e9',
      fillOpacity: 0.5,
    })
      .bindPopup(`<b>Last reported location</b><br/>${currentPlace}`)
      .addTo(map);
  }, [current?.lat, current?.lng, currentPlace, current]);

  // Keep travelled path + vehicle in sync with the shipment status
  useEffect(() => {
    if (!origin || !destination || arc.length === 0) return;
    const count = Math.max(1, Math.round(progress * (arc.length - 1)));
    const travelled = arc.slice(0, count + 1).map((p) => [p.lat, p.lng]) as [number, number][];
    layersRef.current.travelled?.setLatLngs(travelled);
    const pos = interpolate(origin, destination, progress);
    layersRef.current.vehicle?.setLatLng([pos.lat, pos.lng]);
  }, [progress, arc, origin, destination]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          <div
            ref={containerRef}
            className="w-full h-[320px] sm:h-[420px] z-0 bg-muted"
            role="application"
            aria-label={`Route map for shipment ${shipment.trackingId}`}
          />

          {loading && (
            <div className="absolute inset-0 z-[500] flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading map…
              </div>
            </div>
          )}

          {hasRouteError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-background/90 p-6 text-center backdrop-blur-sm"
            >
              <div className="relative mb-4 h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="h-8 w-8 text-muted-foreground" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-px w-14 bg-muted-foreground/60 rotate-45 rounded-full" />
                </span>
              </div>
              <h3 className="text-lg font-semibold mb-1">Map couldn&apos;t load</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-5">
                We weren&apos;t able to plot this route right now. The tracking timeline below is still up to date.
              </p>
              <Button onClick={handleRetry} disabled={loading} className="gap-2">
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                {loading ? 'Retrying map…' : 'Retry loading map'}
              </Button>
            </motion.div>
          )}


          <div className="pointer-events-none absolute top-4 left-4 z-[400] flex items-center gap-2 rounded-full bg-card/90 backdrop-blur px-3 py-1.5 border border-border shadow-sm">
            <Navigation className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium">Live route</span>
          </div>
          <div className="pointer-events-none absolute top-4 right-4 z-[400] rounded-full bg-card/90 backdrop-blur px-3 py-1.5 border border-border shadow-sm">
            <span className="text-xs font-semibold text-primary">
              {Math.round(progress * 100)}% of route
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 p-6 border-t border-border">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Origin</p>
              <p className="text-sm font-medium">{pickup}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
              <Truck className="h-4 w-4 text-info" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Current location</p>
              <p className="text-sm font-medium">{currentPlace}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className={cn(
              'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
              isDelivered ? 'bg-success/10' : 'bg-muted'
            )}>
              <Flag className={cn('h-4 w-4', isDelivered ? 'text-success' : 'text-muted-foreground')} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Destination</p>
              <p className="text-sm font-medium">{delivery}</p>
            </div>
          </div>
        </div>

        {locationUpdates.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-6 pb-6"
          >
            <p className="text-sm font-semibold mb-3">Location updates</p>
            <div className="space-y-2">
              {locationUpdates.slice(0, 5).map((u) => (
                <div key={u.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm">{u.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(u.createdAt)}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Admin</Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export default ShipmentMap;
