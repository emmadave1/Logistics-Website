import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Search,
  Edit,
  MapPin,
  Calendar,
  BarChart3,
  Users,
  MessageSquare,
  Ticket,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import Layout from '@/components/layout/Layout';
import { Shipment, ShipmentStatus, AdminUser } from '@/types/shipment';
import { SupportTicket, TicketStatus, ChatConversation } from '@/types/support';
import { adminLogin, adminLogout, getAllShipments, updateShipmentStatus, updateShipmentEta, updateShipmentLocation, getAnalytics } from '@/services/mockApi';
import { getAdminSession } from '@/services/storage';
import { getTickets, updateTicket, getAllChatConversations, addAgentMessage, setAgentHandled, markConversationReadByAgent, GENERAL_CHAT_KEY } from '@/services/supportService';
import { formatDateTime } from '@/utils/formatters';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

const statusConfig: Record<ShipmentStatus, { color: string; bg: string }> = {
  pending: { color: 'text-warning', bg: 'bg-warning/10' },
  processing: { color: 'text-warning', bg: 'bg-warning/10' },
  in_transit: { color: 'text-primary', bg: 'bg-primary/10' },
  out_for_delivery: { color: 'text-info', bg: 'bg-info/10' },
  delivered: { color: 'text-success', bg: 'bg-success/10' },
};

const ticketStatusConfig: Record<TicketStatus, { color: string; label: string }> = {
  open: { color: 'text-warning', label: 'Open' },
  in_progress: { color: 'text-primary', label: 'In Progress' },
  resolved: { color: 'text-success', label: 'Resolved' },
};

const CHART_COLORS = ['hsl(217, 91%, 50%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)'];

export default function Admin() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [analytics, setAnalytics] = useState<{
    total: number;
    delivered: number;
    inTransit: number;
    pending: number;
    statusDistribution: { status: string; count: number }[];
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  // Delivery date/time editing
  const [etaShipment, setEtaShipment] = useState<Shipment | null>(null);
  const [etaValue, setEtaValue] = useState('');
  const [isSavingEta, setIsSavingEta] = useState(false);

  const [locationShipment, setLocationShipment] = useState<Shipment | null>(null);
  const [pendingStatus, setPendingStatus] = useState<ShipmentStatus | null>(null);
  const [locationForm, setLocationForm] = useState({ city: '', country: '', note: '' });
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  // Live chat
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeChatKey, setActiveChatKey] = useState<string>(GENERAL_CHAT_KEY);
  const [agentMessage, setAgentMessage] = useState('');
  const conversation = conversations.find(
    (c) => (c.trackingId || GENERAL_CHAT_KEY).toUpperCase() === activeChatKey.toUpperCase()
  ) || null;

  useEffect(() => {
    const session = getAdminSession();
    if (session) {
      setUser(session);
      loadData();
    }
  }, []);

  // Poll the live chat conversation for new customer messages
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setConversations(getAllChatConversations());
    }, 1500);
    return () => clearInterval(interval);
  }, [user]);

  // Mark the customer's messages in the open conversation as read
  useEffect(() => {
    if (!conversation) return;
    if (conversation.messages.some((m) => m.isUser && !m.readAt)) {
      markConversationReadByAgent(activeChatKey);
      setConversations(getAllChatConversations());
    }
  }, [conversation, activeChatKey]);

  const loadData = async () => {
    const [shipmentsResult, analyticsResult] = await Promise.all([
      getAllShipments(),
      getAnalytics(),
    ]);
    
    if (shipmentsResult.success) setShipments(shipmentsResult.data || []);
    if (analyticsResult.success) setAnalytics(analyticsResult.data || null);
    setTickets(getTickets());
    setConversations(getAllChatConversations());
  };

  const toDateTimeLocal = (iso: string) => {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const openEtaDialog = (shipment: Shipment) => {
    setEtaShipment(shipment);
    setEtaValue(toDateTimeLocal(shipment.estimatedDelivery));
  };

  const handleEtaSave = async () => {
    if (!etaShipment || !etaValue) return;
    setIsSavingEta(true);
    const result = await updateShipmentEta(etaShipment.trackingId, new Date(etaValue).toISOString());
    setIsSavingEta(false);
    if (result.success) {
      setEtaShipment(null);
      loadData();
      toast({
        title: 'Delivery time updated',
        description: `${etaShipment.trackingId} now arrives ${formatDateTime(etaValue)}.`,
      });
    } else {
      toast({ title: 'Update failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleSendAgentMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentMessage.trim()) return;
    setAgentHandled(true, activeChatKey);
    addAgentMessage(agentMessage.trim(), user?.name || 'Support Agent', activeChatKey);
    setConversations(getAllChatConversations());
    setAgentMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    
    const result = await adminLogin(credentials.username, credentials.password);
    
    if (result.success && result.data) {
      setUser(result.data);
      loadData();
      toast({ title: 'Welcome!', description: `Logged in as ${result.data.name}` });
    } else {
      setLoginError(t('admin.login.error'));
    }
    
    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    await adminLogout();
    setUser(null);
    toast({ title: 'Logged out', description: 'You have been logged out.' });
  };

  const openLocationDialog = (shipment: Shipment, newStatus?: ShipmentStatus) => {
    setLocationShipment(shipment);
    setPendingStatus(newStatus ?? null);
    setLocationForm({
      city: shipment.currentLocation.city,
      country: shipment.currentLocation.country,
      note: '',
    });
  };

  const closeLocationDialog = () => {
    setLocationShipment(null);
    setPendingStatus(null);
  };

  const handleLocationSave = async () => {
    if (!locationShipment || !locationForm.city.trim() || !locationForm.country.trim()) return;
    setIsSavingLocation(true);

    const trackingId = locationShipment.trackingId;
    const locationLabel = `${locationForm.city.trim()}, ${locationForm.country.trim()}`;

    const result = pendingStatus
      ? await updateShipmentStatus(trackingId, pendingStatus, locationLabel)
      : await updateShipmentLocation(
          trackingId,
          locationForm.city,
          locationForm.country,
          locationForm.note
        );

    setIsSavingLocation(false);

    if (result.success) {
      closeLocationDialog();
      loadData();
      toast({
        title: pendingStatus ? 'Status & location updated' : 'Location updated',
        description: `${trackingId} is now at ${locationLabel}.`,
      });
    } else {
      toast({ title: 'Update failed', description: result.error, variant: 'destructive' });
    }
  };

  const handleTicketStatusUpdate = (ticketId: string, newStatus: TicketStatus) => {
    updateTicket(ticketId, { status: newStatus });
    setTickets(getTickets());
    toast({ title: 'Updated!', description: `Ticket ${ticketId} status updated.` });
  };

  const filteredShipments = shipments.filter(s =>
    s.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.receiverName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Login Screen
  if (!user) {
    return (
      <Layout>
        <div className="container-custom py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto"
          >
            <Card>
              <CardHeader className="text-center">
                <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>{t('admin.login.title')}</CardTitle>
                <p className="text-sm text-muted-foreground">{t('admin.login.subtitle')}</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label>{t('admin.login.username')}</Label>
                    <Input
                      value={credentials.username}
                      onChange={(e) => setCredentials(p => ({ ...p, username: e.target.value }))}
                      placeholder="admin"
                    />
                  </div>
                  <div>
                    <Label>{t('admin.login.password')}</Label>
                    <Input
                      type="password"
                      value={credentials.password}
                      onChange={(e) => setCredentials(p => ({ ...p, password: e.target.value }))}
                      placeholder="••••••••"
                    />
                  </div>
                  {loginError && (
                    <p className="text-destructive text-sm">{loginError}</p>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoggingIn}>
                    {isLoggingIn ? 'Logging in...' : t('admin.login.button')}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    {t('admin.login.hint')}
                  </p>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </Layout>
    );
  }

  // Dashboard
  return (
    <Layout>
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-display font-bold">{t('admin.title')}</h1>
            <p className="text-muted-foreground">
              Welcome, {user.name} ({user.role})
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" />
            {t('admin.logout')}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="shipments" className="gap-2">
              <Package className="h-4 w-4" />
              Shipments
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <Ticket className="h-4 w-4" />
              Tickets
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Live Chat
              {conversation && conversation.messages.some(m => m.isUser) && (
                <span className="h-2 w-2 rounded-full bg-success" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('admin.dashboard.totalShipments')}</p>
                      <p className="text-2xl font-bold">{analytics?.total || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('admin.dashboard.delivered')}</p>
                      <p className="text-2xl font-bold">{analytics?.delivered || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('admin.dashboard.inTransit')}</p>
                      <p className="text-2xl font-bold">{analytics?.inTransit || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-warning" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('admin.dashboard.pending')}</p>
                      <p className="text-2xl font-bold">{analytics?.pending || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.analytics.statusDistribution')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={analytics?.statusDistribution || []}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ status, count }) => `${status}: ${count}`}
                        >
                          {analytics?.statusDistribution.map((_, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.analytics.deliveryTrends')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics?.statusDistribution || []}>
                        <XAxis dataKey="status" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Shipments Tab */}
          <TabsContent value="shipments">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <CardTitle>{t('admin.shipments.title')}</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t('admin.shipments.search')}
                      className="pl-10"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredShipments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {t('admin.shipments.noResults')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {filteredShipments.map((shipment) => (
                      <div
                        key={shipment.id}
                        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 border border-border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold">{shipment.trackingId}</span>
                            <Badge 
                              variant="secondary"
                              className={cn(statusConfig[shipment.status].color, statusConfig[shipment.status].bg)}
                            >
                              {shipment.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {shipment.senderName} → {shipment.receiverName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {shipment.currentLocation.city}, {shipment.currentLocation.country}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                            <Calendar className="h-3.5 w-3.5" />
                            ETA: {formatDateTime(shipment.estimatedDelivery)}
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Select
                            value={shipment.status}
                            onValueChange={(v) => openLocationDialog(shipment, v as ShipmentStatus)}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="in_transit">In Transit</SelectItem>
                              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => openEtaDialog(shipment)}
                          >
                            <Edit className="h-4 w-4" />
                            Delivery date &amp; time
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => openLocationDialog(shipment)}
                          >
                            <MapPin className="h-4 w-4" />
                            Update location
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tickets Tab */}
          <TabsContent value="tickets">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No tickets found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-4 border border-border rounded-lg"
                      >
                        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{ticket.ticketId}</Badge>
                              <Badge 
                                variant="secondary"
                                className={ticketStatusConfig[ticket.status].color}
                              >
                                {ticketStatusConfig[ticket.status].label}
                              </Badge>
                            </div>
                            <h4 className="font-semibold">{ticket.subject}</h4>
                            <p className="text-sm text-muted-foreground">
                              {ticket.name} • {ticket.email}
                            </p>
                          </div>
                          
                          <Select
                            value={ticket.status}
                            onValueChange={(v) => handleTicketStatusUpdate(ticket.ticketId, v as TicketStatus)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <p className="text-sm text-muted-foreground">{ticket.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Chat Tab */}
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle>Live Customer Chat</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Reply directly to the visitor using the site chat widget.
                    </p>
                  </div>
                  {conversation && (
                    <Badge variant="secondary" className="w-fit">
                      Started {formatDateTime(conversation.startedAt)}
                    </Badge>
                  )}
                </div>
                {conversations.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-3">
                    {conversations.map((c) => {
                      const key = (c.trackingId || GENERAL_CHAT_KEY).toUpperCase();
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActiveChatKey(key)}
                          className={cn(
                            'text-xs rounded-full border px-3 py-1.5 transition-colors',
                            key === activeChatKey.toUpperCase()
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background hover:bg-muted border-border'
                          )}
                        >
                          {key === GENERAL_CHAT_KEY.toUpperCase() ? 'General visitor' : key}
                          <span className="opacity-70"> • {c.messages.length}</span>
                          {c.messages.filter((m) => m.isUser && !m.readAt).length > 0 && (
                            <span className="ml-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                              {c.messages.filter((m) => m.isUser && !m.readAt).length}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {!conversation ? (
                  <p className="text-center text-muted-foreground py-8">
                    No active conversation yet. It will appear here once a visitor opens the chat.
                  </p>
                ) : (
                  <>
                    <ScrollArea className="h-[380px] pr-4 mb-4 border border-border rounded-lg p-4">
                      <div className="space-y-3">
                        {conversation.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn('flex', msg.isUser ? 'justify-start' : 'justify-end')}
                          >
                            <div
                              className={cn(
                                'max-w-[75%] rounded-2xl px-4 py-2 text-sm',
                                msg.isUser
                                  ? 'bg-muted'
                                  : msg.isAgent
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground'
                              )}
                            >
                              <p className="text-[11px] font-semibold opacity-80 mb-0.5">
                                {msg.isUser ? 'Customer' : msg.isAgent ? msg.agentName || 'Agent' : 'Bot'}
                                {' • '}
                                {formatDateTime(msg.timestamp)}
                              </p>
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                              {!msg.isUser && msg.isAgent && (
                                <p className="mt-1 text-[10px] opacity-80 text-right">
                                  {msg.readAt ? `Read ${formatDateTime(msg.readAt)}` : 'Delivered'}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <form onSubmit={handleSendAgentMessage} className="space-y-3">
                      <Textarea
                        value={agentMessage}
                        onChange={(e) => setAgentMessage(e.target.value)}
                        placeholder="Write a reply to the customer..."
                        rows={3}
                      />
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-muted-foreground">
                          Replying takes over the conversation from the bot.
                        </p>
                        <Button type="submit" disabled={!agentMessage.trim()} className="gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Send reply
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Update package location (and optionally status) */}
        <Dialog open={!!locationShipment} onOpenChange={(open) => !open && closeLocationDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {pendingStatus ? 'Update status & location' : 'Update package location'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Shipment <span className="font-mono font-semibold">{locationShipment?.trackingId}</span>
                {pendingStatus && (
                  <> — new status <span className="font-semibold">{pendingStatus.replace('_', ' ')}</span></>
                )}
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="loc-city">City</Label>
                  <Input
                    id="loc-city"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm(p => ({ ...p, city: e.target.value }))}
                    placeholder="Phoenix"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-country">Country</Label>
                  <Input
                    id="loc-country"
                    value={locationForm.country}
                    onChange={(e) => setLocationForm(p => ({ ...p, country: e.target.value }))}
                    placeholder="United States"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="loc-note">Note for the customer (optional)</Label>
                <Textarea
                  id="loc-note"
                  rows={2}
                  value={locationForm.note}
                  onChange={(e) => setLocationForm(p => ({ ...p, note: e.target.value }))}
                  placeholder="Arrived at the Phoenix sorting hub."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={closeLocationDialog}>Cancel</Button>
                <Button
                  onClick={handleLocationSave}
                  disabled={!locationForm.city.trim() || !locationForm.country.trim() || isSavingLocation}
                >
                  {isSavingLocation ? 'Saving...' : 'Save update'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit delivery date & time */}
        <Dialog open={!!etaShipment} onOpenChange={(open) => !open && setEtaShipment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit delivery date &amp; time</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Shipment <span className="font-mono font-semibold">{etaShipment?.trackingId}</span>
              </p>
              <div className="space-y-2">
                <Label htmlFor="eta">Estimated delivery</Label>
                <Input
                  id="eta"
                  type="datetime-local"
                  value={etaValue}
                  onChange={(e) => setEtaValue(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEtaShipment(null)}>Cancel</Button>
                <Button onClick={handleEtaSave} disabled={!etaValue || isSavingEta}>
                  {isSavingEta ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
