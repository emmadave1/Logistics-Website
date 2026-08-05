import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Package, Truck, MapPin, CheckCircle, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  PhoneMockup,
  BookingScreen,
  PickupScreen,
  TrackingScreen,
  DeliveredScreen,
} from '@/components/home/PhoneMockup';

const steps = [
  {
    icon: Package,
    label: 'Book',
    title: 'Book a Shipment',
    description: 'Submit pickup, delivery and package details in under two minutes.',
    highlights: ['Instant price estimate', 'Insurance up to $5,000', 'Saved address book'],
    Screen: BookingScreen,
  },
  {
    icon: Truck,
    label: 'Collect',
    title: 'We Collect',
    description: 'A vetted driver collects your package at the scheduled time slot.',
    highlights: ['Driver profile & ETA', 'Live map of the approach', 'Contactless handover'],
    Screen: PickupScreen,
  },
  {
    icon: MapPin,
    label: 'Track',
    title: 'Track in Real Time',
    description: 'Follow every scan, hub transfer and status change from your tracking ID.',
    highlights: ['Milestone timeline', 'Push & in-app alerts', 'Shareable tracking link'],
    Screen: TrackingScreen,
  },
  {
    icon: CheckCircle,
    label: 'Deliver',
    title: 'Delivered & Confirmed',
    description: 'Receive delivery confirmation with the exact date and time recorded.',
    highlights: ['Signature capture', 'Photo proof of delivery', 'Downloadable PDF receipt'],
    Screen: DeliveredScreen,
  },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const step = steps[active];
  const Screen = step.Screen;

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setActive((i) => (i + 1) % steps.length), 5000);
    return () => clearInterval(id);
  }, [playing]);

  const go = (i: number) => {
    setPlaying(false);
    setActive((i + steps.length) % steps.length);
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container-custom">
        <div className="text-center mb-12">
          <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-4">
            Interactive walkthrough
          </span>
          <h2 className="text-3xl lg:text-4xl font-display font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tap through each step to see exactly what your customers experience on their phone.
          </p>
        </div>

        {/* Step tabs / progress indicators */}
        <div className="mx-auto mb-10 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
          {steps.map((s, i) => {
            const isActive = i === active;
            const isDone = i < active;
            return (
              <button
                key={s.title}
                onClick={() => go(i)}
                aria-current={isActive}
                aria-label={`Step ${i + 1}: ${s.title}`}
                className={cn(
                  'group relative overflow-hidden rounded-xl border p-3 text-left transition-all',
                  isActive
                    ? 'border-primary bg-card shadow-md'
                    : 'border-border bg-card/60 hover:border-primary/50 hover:bg-card'
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
                      isActive || isDone
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isDone ? <CheckCircle className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className={cn('text-sm font-semibold', !isActive && 'text-muted-foreground')}>
                    {s.label}
                  </span>
                </div>
                <span className="absolute bottom-0 left-0 h-0.5 w-full bg-border">
                  <motion.span
                    className="block h-full bg-primary"
                    initial={false}
                    animate={{ width: isActive ? '100%' : isDone ? '100%' : '0%' }}
                    transition={{ duration: isActive && playing ? 5 : 0.35, ease: 'linear' }}
                    key={`${i}-${active}-${playing}`}
                  />
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          {/* Phone */}
          <div className="relative flex justify-center">
            <div className="absolute inset-0 m-auto h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.97 }}
                transition={{ duration: 0.35 }}
                className="relative"
              >
                <PhoneMockup>
                  <Screen />
                </PhoneMockup>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Details */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Step {active + 1} of {steps.length}
              </p>
              <h3 className="mt-1 text-2xl font-display font-bold">{step.title}</h3>
              <p className="mt-3 text-muted-foreground">{step.description}</p>
              <ul className="mt-5 space-y-2">
                {step.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex items-center gap-2">
                <Button variant="outline" size="icon" aria-label="Previous step" onClick={() => go(active - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" aria-label="Next step" onClick={() => go(active + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPlaying((p) => !p)}
                  aria-label={playing ? 'Pause autoplay' : 'Play autoplay'}
                >
                  {playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {playing ? 'Pause' : 'Autoplay'}
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;