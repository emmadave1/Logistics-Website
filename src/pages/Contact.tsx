import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, MessageCircle, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Layout from '@/components/layout/Layout';

const offices = [
  {
    title: 'Headquarters',
    address: '123 Logistics Way, New York, NY 10001',
    country: 'United States',
  },
  {
    title: 'European Hub',
    address: '45 Shipping Lane, London, UK EC1A 1BB',
    country: 'United Kingdom',
  },
  {
    title: 'Asia Pacific',
    address: '78 Cargo Street, Singapore 049318',
    country: 'Singapore',
  },
];

const channels = [
  { icon: MessageCircle, title: 'Live Chat', description: 'Chat with our support bot or a live agent from any page.', response: 'Instant reply' },
  { icon: Mail, title: 'Email Support', description: 'Detailed queries, documentation and claims requests.', response: 'Within 2 hours' },
  { icon: Phone, title: 'Phone Line', description: 'Speak to a logistics coordinator about active shipments.', response: 'Mon-Sat, 8am-8pm' },
  { icon: LifeBuoy, title: 'Support Tickets', description: 'Raise a tracked ticket from our Help Center.', response: 'Resolved in 24h' },
];

const departments = [
  { name: 'Shipment Tracking', scope: 'Status updates, delays and delivery windows', email: 'tracking@movemate.com', hours: '24/7' },
  { name: 'Billing & Invoices', scope: 'Quotes, invoices and payment queries', email: 'billing@movemate.com', hours: 'Mon-Fri, 9am-6pm' },
  { name: 'Claims & Insurance', scope: 'Damaged, delayed or lost shipment claims', email: 'claims@movemate.com', hours: 'Mon-Fri, 9am-5pm' },
  { name: 'Business Partnerships', scope: 'Corporate accounts and bulk shipping rates', email: 'partners@movemate.com', hours: 'Mon-Fri, 9am-6pm' },
];

export default function Contact() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    toast({
      title: t('contact.form.success'),
      description: t('contact.form.successDesc'),
    });
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitted(false);
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
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-4">
            {t('contact.title')}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('contact.subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                {isSubmitted ? (
                  <div className="text-center py-8">
                    <div className="h-16 w-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-8 w-8 text-success" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{t('contact.form.success')}</h3>
                    <p className="text-muted-foreground mb-6">{t('contact.form.successDesc')}</p>
                    <Button onClick={resetForm}>Send Another Message</Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>{t('contact.form.name')} *</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                          placeholder={t('contact.form.namePlaceholder')}
                        />
                      </div>
                      <div>
                        <Label>{t('contact.form.email')} *</Label>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                          placeholder={t('contact.form.emailPlaceholder')}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label>{t('contact.form.subject')}</Label>
                      <Input
                        value={formData.subject}
                        onChange={(e) => setFormData(p => ({ ...p, subject: e.target.value }))}
                        placeholder={t('contact.form.subjectPlaceholder')}
                      />
                    </div>
                    
                    <div>
                      <Label>{t('contact.form.message')} *</Label>
                      <Textarea
                        value={formData.message}
                        onChange={(e) => setFormData(p => ({ ...p, message: e.target.value }))}
                        placeholder={t('contact.form.messagePlaceholder')}
                        rows={5}
                      />
                    </div>
                    
                    <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                      {isSubmitting ? 'Sending...' : t('contact.form.submit')}
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-6"
          >
            {/* Quick Contact */}
            <Card>
              <CardHeader>
                <CardTitle>{t('contact.info.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{t('contact.info.email')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{t('contact.info.phone')}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Working Hours</p>
                    <p className="font-medium">{t('contact.info.hours')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Office Locations */}
            <Card>
              <CardHeader>
                <CardTitle>{t('contact.offices.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {offices.map((office) => (
                  <div key={office.title} className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{office.title}</p>
                      <p className="text-sm text-muted-foreground">{office.address}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Support Channels */}
        <section className="mt-16">
          <h2 className="text-2xl font-display font-bold text-center mb-8">Support Channels</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {channels.map((channel) => (
              <Card key={channel.title} className="h-full">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <channel.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{channel.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{channel.description}</p>
                  <p className="text-xs font-medium text-primary">{channel.response}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Department Directory */}
        <section className="mt-16">
          <h2 className="text-2xl font-display font-bold text-center mb-8">Department Directory</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {departments.map((dept) => (
              <div
                key={dept.name}
                className="flex items-start justify-between gap-4 p-5 rounded-lg border border-border bg-card"
              >
                <div>
                  <p className="font-medium">{dept.name}</p>
                  <p className="text-sm text-muted-foreground">{dept.scope}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{dept.email}</p>
                  <p className="text-xs text-muted-foreground">{dept.hours}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </Layout>
  );
}
