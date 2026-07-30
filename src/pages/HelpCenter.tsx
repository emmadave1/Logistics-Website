import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Search, 
  HelpCircle, 
  MessageSquare, 
  Ticket, 
  Package, 
  MapPin, 
  CreditCard, 
  Shield,
  ChevronDown,
  Send,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';
import { faqCategories, generateTicketId, saveTicket, getTickets, initializeDemoTickets } from '@/services/supportService';
import { SupportTicket, TicketStatus } from '@/types/support';
import { cn } from '@/lib/utils';

const categoryIcons: Record<string, typeof Package> = {
  'Package': Package,
  'MapPin': MapPin,
  'CreditCard': CreditCard,
  'Shield': Shield,
};

const statusConfig: Record<TicketStatus, { color: string; icon: typeof Clock }> = {
  open: { color: 'text-warning', icon: AlertCircle },
  in_progress: { color: 'text-primary', icon: Clock },
  resolved: { color: 'text-success', icon: CheckCircle },
};

export default function HelpCenter() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('faq');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  
  // Ticket form
  const [ticketForm, setTicketForm] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    initializeDemoTickets();
    setTickets(getTickets());
  }, []);

  // Filter FAQ based on search
  const filteredFaq = faqCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.items.length > 0);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketForm.name || !ticketForm.email || !ticketForm.subject || !ticketForm.message) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newTicket: SupportTicket = {
      id: Date.now().toString(),
      ticketId: generateTicketId(),
      ...ticketForm,
      status: 'open',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: [],
    };
    
    saveTicket(newTicket);
    setSubmittedTicket(newTicket);
    setTickets(getTickets());
    setIsSubmitting(false);
    
    toast({
      title: 'Ticket Submitted!',
      description: `Your ticket ID is ${newTicket.ticketId}`,
    });
  };

  const resetTicketForm = () => {
    setTicketForm({ name: '', email: '', subject: '', category: '', message: '' });
    setSubmittedTicket(null);
  };

  return (
    <Layout>
      <div className="container-custom py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-4">
            Help Center
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Find answers to common questions or reach out to our support team
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for help..."
              className="pl-12 h-12"
            />
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="faq" className="gap-2">
              <HelpCircle className="h-4 w-4" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="ticket" className="gap-2">
              <Ticket className="h-4 w-4" />
              Submit Ticket
            </TabsTrigger>
            <TabsTrigger value="my-tickets" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              My Tickets
            </TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {filteredFaq.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No results found for "{searchQuery}"</p>
                    <Button variant="link" onClick={() => setSearchQuery('')}>
                      Clear search
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredFaq.map((category) => {
                  const Icon = categoryIcons[category.icon] || HelpCircle;
                  return (
                    <Card key={category.id}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          {category.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                          {category.items.map((item) => (
                            <AccordionItem key={item.id} value={item.id}>
                              <AccordionTrigger className="text-left">
                                {item.question}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground">
                                {item.answer}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </motion.div>
          </TabsContent>

          {/* Submit Ticket Tab */}
          <TabsContent value="ticket">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {submittedTicket ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Ticket Submitted!</h3>
                    <p className="text-muted-foreground mb-4">
                      Your ticket has been submitted successfully. Our team will respond within 24 hours.
                    </p>
                    <div className="bg-muted p-4 rounded-lg inline-block mb-6">
                      <p className="text-sm text-muted-foreground">Ticket ID</p>
                      <p className="text-2xl font-display font-bold text-primary">{submittedTicket.ticketId}</p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <Button variant="outline" onClick={resetTicketForm}>
                        Submit Another
                      </Button>
                      <Button onClick={() => setActiveTab('my-tickets')}>
                        View My Tickets
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Submit a Support Ticket</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleTicketSubmit} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Your Name *</Label>
                          <Input
                            value={ticketForm.name}
                            onChange={(e) => setTicketForm(p => ({ ...p, name: e.target.value }))}
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <Label>Email Address *</Label>
                          <Input
                            type="email"
                            value={ticketForm.email}
                            onChange={(e) => setTicketForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                      
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <Label>Subject *</Label>
                          <Input
                            value={ticketForm.subject}
                            onChange={(e) => setTicketForm(p => ({ ...p, subject: e.target.value }))}
                            placeholder="Brief description of your issue"
                          />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Select
                            value={ticketForm.category}
                            onValueChange={(v) => setTicketForm(p => ({ ...p, category: v }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover">
                              <SelectItem value="tracking">Tracking Issues</SelectItem>
                              <SelectItem value="delivery">Delivery Problems</SelectItem>
                              <SelectItem value="billing">Billing & Payments</SelectItem>
                              <SelectItem value="claims">Claims & Refunds</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Message *</Label>
                        <Textarea
                          value={ticketForm.message}
                          onChange={(e) => setTicketForm(p => ({ ...p, message: e.target.value }))}
                          placeholder="Describe your issue in detail..."
                          rows={5}
                        />
                      </div>
                      
                      <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                        {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>

          {/* My Tickets Tab */}
          <TabsContent value="my-tickets">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {tickets.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">You have not submitted any tickets yet.</p>
                    <Button onClick={() => setActiveTab('ticket')}>
                      Submit Your First Ticket
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => {
                    const StatusIcon = statusConfig[ticket.status].icon;
                    return (
                      <Card key={ticket.id}>
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{ticket.ticketId}</Badge>
                                <Badge 
                                  variant="secondary"
                                  className={cn("gap-1", statusConfig[ticket.status].color)}
                                >
                                  <StatusIcon className="h-3 w-3" />
                                  {ticket.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              <h4 className="font-semibold">{ticket.subject}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">{ticket.message}</p>
                          
                          {ticket.responses.length > 0 && (
                            <div className="border-t border-border pt-4 mt-4 space-y-3">
                              {ticket.responses.map((response) => (
                                <div 
                                  key={response.id}
                                  className={cn(
                                    "p-3 rounded-lg text-sm",
                                    response.isAgent ? "bg-primary/5 ml-4" : "bg-muted mr-4"
                                  )}
                                >
                                  <p className="font-medium mb-1">
                                    {response.isAgent ? response.agentName : 'You'}
                                  </p>
                                  <p className="text-muted-foreground">{response.message}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
