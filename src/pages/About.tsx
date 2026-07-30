import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Target, 
  Eye, 
  Heart, 
  Shield, 
  Lightbulb, 
  CheckCircle,
  Globe,
  Users,
  Truck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Layout from '@/components/layout/Layout';

const values = [
  {
    icon: Shield,
    title: 'Reliability',
    description: 'We deliver on our promises, every time.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'Constantly improving our services with cutting-edge technology.',
  },
  {
    icon: Heart,
    title: 'Integrity',
    description: 'Transparent operations and honest communication.',
  },
  {
    icon: Globe,
    title: 'Sustainability',
    description: 'Committed to eco-friendly logistics practices.',
  },
];

const milestones = [
  { year: '2014', title: 'Founded in New York', description: 'Started with three vans and a single regional route.' },
  { year: '2017', title: 'National Coverage', description: 'Expanded to 40 distribution hubs across the country.' },
  { year: '2020', title: 'Real-Time Tracking Platform', description: 'Launched our in-house GPS tracking and customer portal.' },
  { year: '2023', title: 'Global Network', description: 'Reached 150+ destination countries through partner carriers.' },
  { year: '2026', title: 'Green Fleet Programme', description: 'Electrified 35% of last-mile deliveries in major cities.' },
];

const leadership = [
  { name: 'Daniel Okafor', role: 'Chief Executive Officer', bio: '20 years in global freight forwarding and network design.' },
  { name: 'Priya Raman', role: 'Chief Operations Officer', bio: 'Leads hub operations, fleet management and delivery SLAs.' },
  { name: 'Marcus Lindqvist', role: 'Chief Technology Officer', bio: 'Built our tracking platform and route optimisation engine.' },
];

const certifications = [
  'ISO 9001:2015 Quality Management',
  'IATA Certified Air Cargo Agent',
  'C-TPAT Supply Chain Security',
  'GDP Compliant Pharma Handling',
];

const stats = [
  { value: '2020', label: 'Founded' },
  { value: '150+', label: 'Countries' },
  { value: '5000+', label: 'Daily Shipments' },
  { value: '500+', label: 'Team Members' },
];

export default function About() {
  const { t } = useTranslation();

  return (
    <Layout>
      <div className="container-custom py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-4">
            {t('about.title')}
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {t('about.subtitle')}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center p-6 bg-card rounded-xl border border-border">
              <div className="text-3xl lg:text-4xl font-display font-bold text-primary mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Story Section */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Card>
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-4">{t('about.story.title')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t('about.story.content')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{t('about.mission.title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('about.mission.content')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{t('about.vision.title')}</h3>
                    <p className="text-sm text-muted-foreground">{t('about.vision.content')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl font-display font-bold text-center mb-8">
            {t('about.values.title')}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full card-hover">
                  <CardContent className="p-6 text-center">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-center mb-10">Our Journey</h2>
          <div className="relative border-l border-border ml-3 space-y-8">
            {milestones.map((milestone) => (
              <div key={milestone.year} className="relative pl-8">
                <span className="absolute -left-[7px] top-1.5 h-3.5 w-3.5 rounded-full bg-primary border-2 border-background" />
                <p className="text-sm font-mono font-bold text-primary">{milestone.year}</p>
                <h3 className="font-semibold">{milestone.title}</h3>
                <p className="text-sm text-muted-foreground">{milestone.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Leadership */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-center mb-10">Leadership Team</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {leadership.map((person) => (
              <Card key={person.name} className="h-full card-hover">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-semibold">{person.name}</h3>
                  <p className="text-sm text-primary mb-2">{person.role}</p>
                  <p className="text-sm text-muted-foreground">{person.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-center mb-8">
            Certifications &amp; Compliance
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {certifications.map((cert) => (
              <div
                key={cert}
                className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card"
              >
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm font-medium">{cert}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Global Network */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-8 lg:p-12">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="h-24 w-24 rounded-full bg-primary-foreground/10 flex items-center justify-center flex-shrink-0">
                  <Truck className="h-12 w-12" />
                </div>
                <div className="text-center lg:text-left">
                  <h2 className="text-2xl font-display font-bold mb-4">
                    Global Delivery Network
                  </h2>
                  <p className="text-primary-foreground/80 max-w-2xl">
                    With operations spanning across 150+ countries and a dedicated team of logistics experts, 
                    we ensure your packages reach their destination safely and on time. Our state-of-the-art 
                    tracking system provides real-time visibility throughout the entire journey.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </Layout>
  );
}
