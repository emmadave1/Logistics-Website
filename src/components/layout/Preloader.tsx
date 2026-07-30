import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Package, Truck } from 'lucide-react';

export default function Preloader() {
  // Shows on every page load / refresh
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
    }, 1900);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="preloader"
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
        >
          {/* Ambient glow */}
          <motion.div
            className="absolute h-72 w-72 rounded-full bg-primary/20 blur-3xl"
            animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Orbiting package around a truck */}
          <div className="relative flex h-32 w-32 items-center justify-center">
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
              animate={{ rotate: 360 }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute inset-0"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            >
              <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary p-2 text-primary-foreground shadow-lg">
                <Package className="h-4 w-4" />
              </span>
            </motion.div>
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="rounded-2xl bg-card p-4 shadow-xl border border-border"
            >
              <Truck className="h-8 w-8 text-primary" />
            </motion.div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 font-display text-lg font-semibold gradient-text"
          >
            Preparing your shipments
          </motion.p>

          {/* Progress bar */}
          <div className="mt-4 h-1 w-48 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full w-full origin-left bg-primary"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.8, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
