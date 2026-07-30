import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Package, Truck, MapPin, CheckCircle, Signal, Wifi, BatteryFull } from 'lucide-react';

interface PhoneMockupProps {
  children: ReactNode;
  className?: string;
}

export function PhoneMockup({ children, className }: PhoneMockupProps) {
  return (
    <div
      className={cn(
        'relative mx-auto w-[220px] rounded-[2.2rem] border-[7px] border-foreground/85 bg-foreground/85 shadow-2xl',
        className
      )}
    >
      {/* Notch */}
      <div className="absolute left-1/2 top-[7px] z-10 h-4 w-20 -translate-x-1/2 rounded-b-2xl bg-foreground/85" />
      <div className="relative h-[420px] overflow-hidden rounded-[1.7rem] bg-background">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 pt-2 text-[9px] font-medium text-muted-foreground">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <Signal className="h-2.5 w-2.5" />
            <Wifi className="h-2.5 w-2.5" />
            <BatteryFull className="h-3 w-3" />
          </span>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}

/* --- Screen 1: Book a shipment --- */
export function BookingScreen() {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold">New shipment</p>
      <div className="space-y-2">
        {['Pickup address', 'Delivery address', 'Package weight'].map((label, i) => (
          <div key={label} className="rounded-lg border border-border bg-card p-2">
            <p className="text-[8px] uppercase tracking-wide text-muted-foreground">{label}</p>
            <div
              className="mt-1 h-1.5 rounded-full bg-primary/25"
              style={{ width: `${80 - i * 18}%` }}
            />
          </div>
        ))}
      </div>
      <div className="rounded-lg bg-primary/10 p-2">
        <p className="text-[8px] text-muted-foreground">Estimated cost</p>
        <p className="text-sm font-bold text-primary">$42.60</p>
      </div>
      <div className="flex h-7 items-center justify-center rounded-lg bg-primary text-[10px] font-semibold text-primary-foreground">
        Book pickup
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-border p-2">
        <Package className="h-3.5 w-3.5 text-primary" />
        <p className="text-[8px] text-muted-foreground">Insured up to $5,000</p>
      </div>
    </div>
  );
}

/* --- Screen 2: Driver collection --- */
export function PickupScreen() {
  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold">Driver assigned</p>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
          DM
        </div>
        <div>
          <p className="text-[10px] font-semibold">Daniel M.</p>
          <p className="text-[8px] text-muted-foreground">Van • Arriving 14:20</p>
        </div>
      </div>
      <div className="relative h-24 overflow-hidden rounded-xl bg-muted">
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] [background-size:16px_16px]" />
        <Truck className="absolute left-6 top-10 h-4 w-4 text-primary" />
        <MapPin className="absolute right-7 top-5 h-4 w-4 text-destructive" />
      </div>
      <div className="space-y-1.5">
        {['Pickup scheduled', 'Driver en route'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={cn('h-1.5 w-1.5 rounded-full', i === 0 ? 'bg-success' : 'bg-primary')} />
            <p className="text-[9px] text-muted-foreground">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- Screen 3: Live tracking --- */
export function TrackingScreen() {
  const events = [
    { label: 'Picked up', time: 'Mon 14:24', done: true },
    { label: 'At sorting hub', time: 'Mon 21:02', done: true },
    { label: 'In transit', time: 'Tue 06:15', done: true },
    { label: 'Out for delivery', time: 'Tue 08:40', done: false },
  ];
  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-primary p-2.5 text-primary-foreground">
        <p className="text-[8px] opacity-80">Tracking ID</p>
        <p className="font-mono text-[11px] font-bold">MM-LX-48210</p>
        <p className="mt-1 text-[8px] opacity-90">Arrives Tue, 18 Aug · 16:30</p>
      </div>
      <div className="space-y-2.5 pl-1">
        {events.map((e) => (
          <div key={e.label} className="flex gap-2">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  'h-2 w-2 rounded-full',
                  e.done ? 'bg-primary' : 'bg-muted-foreground/40'
                )}
              />
              <span className="w-px flex-1 bg-border" />
            </div>
            <div className="-mt-1">
              <p className="text-[9px] font-medium">{e.label}</p>
              <p className="text-[8px] text-muted-foreground">{e.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* --- Screen 4: Delivered --- */
export function DeliveredScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-3 pt-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
        <CheckCircle className="h-7 w-7 text-success" />
      </div>
      <p className="text-[12px] font-semibold">Delivered</p>
      <p className="text-[9px] text-muted-foreground">
        Tue, 18 Aug 2026 · 16:12
        <br />
        Signed by R. Alvarez
      </p>
      <div className="w-full rounded-xl border border-border bg-card p-2 text-left">
        <p className="text-[8px] uppercase tracking-wide text-muted-foreground">Proof of delivery</p>
        <div className="mt-1.5 h-10 rounded-md bg-muted" />
      </div>
      <div className="flex h-7 w-full items-center justify-center rounded-lg border border-primary text-[9px] font-semibold text-primary">
        Download receipt (PDF)
      </div>
    </div>
  );
}
