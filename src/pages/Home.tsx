import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  Globe, 
  Shield, 
  Zap, 
  MapPin,
  Clock,
  CheckCircle,
  Star,
  ArrowRight,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { validateTrackingId } from '@/utils/validators';
import Layout from '@/components/layout/Layout';
import {
  PhoneMockup,
  BookingScreen,
  PickupScreen,
  TrackingScreen,
  DeliveredScreen,
} from '@/components/home/PhoneMockup';

const phoneScreens = [BookingScreen, PickupScreen, TrackingScreen, DeliveredScreen];

const stats = [
  { value: '5,000+', label: 'deliveries', icon: Package },
  { value: '150+', label: 'countries', icon: Globe },
  { value: '24/7', label: 'support', icon: Clock },
  { value: '99%', label: 'satisfaction', icon: Star },
];

const features = [
  {
    icon: MapPin,
    title: 'Real-Time Tracking',
    description: 'Track your shipments in real-time with our advanced GPS-enabled tracking system.',
  },
  {
    icon: Globe,
    title: 'Global Network',
    description: 'Delivering to over 150+ countries with our extensive logistics network.',
  },
  {
    icon: Shield,
    title: 'Secure Handling',
    description: 'Your packages are handled with utmost care and protected insurance coverage.',
  },
  {
    icon: Zap,
    title: 'Express Delivery',
    description: 'Same-day and next-day delivery options for urgent shipments.',
  },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'E-commerce Owner',
    content: 'Movemate has transformed our shipping operations. Fast, reliable, and their tracking is incredibly accurate.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Supply Chain Manager',
    content: 'The best logistics partner we have ever worked with. Their global network is impressive.',
    rating: 5,
  },
  {
    name: 'Emma Williams',
    role: 'Small Business Owner',
    content: 'Affordable rates without compromising on quality. Highly recommend for any business size.',
    rating: 5,
  },
];

const services = [
  {
    icon: Truck,
    title: 'Road Freight',
    description: 'Nationwide trucking with dedicated and shared load options.',
    points: ['Full & partial truckload', 'Temperature-controlled fleet', 'Live route optimisation'],
  },
  {
    icon: Globe,
    title: 'International Air & Sea',
    description: 'Cross-border shipping with full customs documentation support.',
    points: ['Air express & consolidated sea', 'Customs clearance handling', 'Duties & tax guidance'],
  },
  {
    icon: Package,
    title: 'Warehousing & Fulfilment',
    description: 'Store, pick, pack and ship from strategically placed hubs.',
    points: ['Inventory visibility', 'Pick & pack services', 'Returns management'],
  },
  {
    icon: Zap,
    title: 'Same-Day Courier',
    description: 'Urgent city deliveries collected within the hour.',
    points: ['Under 60-minute pickup', 'Direct point-to-point', 'Proof of delivery capture'],
  },
  {
    icon: Shield,
    title: 'Cargo Insurance',
    description: 'Comprehensive coverage on declared value for every shipment.',
    points: ['Full declared-value cover', 'Fast claims processing', 'Fragile goods protocols'],
  },
  {
    icon: MapPin,
    title: 'Supply Chain Consulting',
    description: 'Optimise routes, costs and delivery windows with our analysts.',
    points: ['Network design reviews', 'Cost-per-shipment analysis', 'Carrier performance reports'],
  },
];

const processSteps = [
  {
    icon: Package,
    title: 'Book a Shipment',
    description: 'Submit pickup, delivery and package details in under two minutes.',
  },
  {
    icon: Truck,
    title: 'We Collect',
    description: 'A vetted driver collects your package at the scheduled time slot.',
  },
  {
    icon: MapPin,
    title: 'Track in Real Time',
    description: 'Follow every scan, hub transfer and status change from your tracking ID.',
  },
  {
    icon: CheckCircle,
    title: 'Delivered & Confirmed',
    description: 'Receive delivery confirmation with the exact date and time recorded.',
  },
];

const commitments = [
  { value: '98.6%', label: 'On-Time Delivery', detail: 'Measured across all lanes last quarter' },
  { value: '<2h', label: 'Support Response', detail: 'Average first reply from our team' },
  { value: '150+', label: 'Countries Served', detail: 'Through partner and owned networks' },
  { value: '24/7', label: 'Live Tracking', detail: 'Continuous shipment status updates' },
];

const trustBadges = [
  { label: 'ISO 9001 Certified', icon: Shield },
  { label: 'Secure Logistics', icon: CheckCircle },
  { label: 'Fully Insured', icon: Shield },
  { label: 'Eco-Friendly', icon: Globe },
];

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trackingId, setTrackingId] = useState('');

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateTrackingId(trackingId);
    
    if (!validation.valid) {
      toast({
        title: 'Invalid Tracking ID',
        description: validation.error,
        variant: 'destructive',
      });
      return;
    }
    
    navigate(`/track?id=${trackingId.toUpperCase()}`);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-info/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-info/10 rounded-full blur-3xl" />
        
        <div className="container-custom relative py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6">
                {t('home.hero.title')}{' '}
                <span className="gradient-text">{t('home.hero.titleHighlight')}</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t('home.hero.subtitle')}
              </p>
            </motion.div>

            {/* Tracking Input */}
            <motion.form
              onSubmit={handleTrack}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                  placeholder={t('home.hero.trackPlaceholder')}
                  className="pl-12 h-14 text-lg"
                />
              </div>
              <Button type="submit" size="lg" className="h-14 px-8">
                {t('home.hero.trackButton')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link to="/request">
                <Button variant="outline" size="lg" className="gap-2">
                  <Truck className="h-5 w-5" />
                  {t('home.hero.requestButton')}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container-custom">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-3" />
                <div className="text-3xl lg:text-4xl font-display font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground capitalize">
                  {t(`home.stats.${stat.label}`)}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">
              {t('home.features.title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full card-hover">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-muted/40">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">Our Logistics Services</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              End-to-end freight, courier and warehousing solutions engineered for businesses of every size.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="h-full card-hover">
                  <CardContent className="p-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <service.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{service.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{service.description}</p>
                    <ul className="space-y-1.5">
                      {service.points.map((point) => (
                        <li key={point} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container-custom">
          <div className="text-center mb-14">
            <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
              Built for mobile
            </span>
            <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From booking to doorstep delivery in four transparent steps — exactly as your
              customers see it on their phone.
            </p>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, index) => {
              const Screen = phoneScreens[index];
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="relative">
                    <div className="absolute -inset-6 rounded-full bg-primary/10 blur-2xl" />
                    <PhoneMockup className="relative">
                      <Screen />
                    </PhoneMockup>
                    <span className="absolute -top-3 -left-2 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-lg">
                      {index + 1}
                    </span>
                  </div>
                  <div className="mt-6 max-w-[240px]">
                    <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <step.icon className="h-4 w-4 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Service Commitments */}
      <section className="py-16 bg-muted/40">
        <div className="container-custom grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {commitments.map((item) => (
            <div key={item.label} className="text-center p-6 bg-card rounded-xl border border-border">
              <p className="text-3xl font-display font-bold text-primary mb-1">{item.value}</p>
              <p className="font-medium mb-1">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-muted/50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">
              {t('home.testimonials.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('home.testimonials.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-16">
        <div className="container-custom">
          <h3 className="text-center text-lg font-semibold mb-8">{t('home.trust.title')}</h3>
          <div className="flex flex-wrap justify-center gap-6">
            {trustBadges.map((badge) => (
              <div
                key={badge.label}
                className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border"
              >
                <badge.icon className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container-custom text-center">
          <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">
            {t('home.cta.title')}
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            {t('home.cta.subtitle')}
          </p>
          <Link to="/request">
            <Button size="lg" variant="secondary" className="gap-2">
              {t('home.cta.button')}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </Layout>
  );
}
