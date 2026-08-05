import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Globe,
  ChevronDown,
  Truck,
  MapPin,
  Phone,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

const navLinks = [
  { key: 'home', path: '/', icon: Package },
  { key: 'track', path: '/track', icon: MapPin },
  { key: 'request', path: '/request', icon: Truck },
  { key: 'help', path: '/help', icon: HelpCircle },
  { key: 'about', path: '/about', icon: Package },
  { key: 'contact', path: '/contact', icon: Phone },
];

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full group-hover:bg-primary/30 transition-colors" />
              <Package className="h-8 w-8 text-primary relative" />
            </div>
            <span className="font-display font-bold text-xl hidden sm:block">
              <span className="text-primary">Movemate</span>
              <span className="text-muted-foreground"> LogisticExpress</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.key}
                to={link.path}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === link.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.key === 'home' ? t('common.home') : 
                 link.key === 'track' ? t('common.trackShipment') :
                 link.key === 'request' ? t('common.requestTracking') :
                 link.key === 'help' ? 'Help Center' :
                 link.key === 'about' ? t('common.about') :
                 t('common.contact')}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="hidden sm:inline">{currentLanguage.flag}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover">
                {languages.map((lang) => (
                  <DropdownMenuItem
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={cn(
                      "gap-2 cursor-pointer",
                      i18n.language === lang.code && "bg-primary/10"
                    )}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative"
            >
              <Sun className={cn(
                "h-4 w-4 transition-all",
                theme === 'dark' ? "rotate-90 scale-0" : "rotate-0 scale-100"
              )} />
              <Moon className={cn(
                "absolute h-4 w-4 transition-all",
                theme === 'dark' ? "rotate-0 scale-100" : "-rotate-90 scale-0"
              )} />
              <span className="sr-only">{t('nav.toggleTheme')}</span>
            </Button>

            {/* Admin Link */}
            {/* <Link to="/admin">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                {t('common.admin')}
              </Button>
            </Link> */}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-border bg-background"
          >
            <nav className="container-custom py-4 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.key}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === link.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <link.icon className="h-5 w-5" />
                  {link.key === 'home' ? t('common.home') : 
                   link.key === 'track' ? t('common.trackShipment') :
                   link.key === 'request' ? t('common.requestTracking') :
                   link.key === 'help' ? 'Help Center' :
                   link.key === 'about' ? t('common.about') :
                   t('common.contact')}
                </Link>
              ))}
              {/* <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                {t('common.admin')}
              </Link> */}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
