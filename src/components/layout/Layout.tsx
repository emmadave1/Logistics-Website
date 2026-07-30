import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import Preloader from './Preloader';
import ChatWidget from '@/components/support/ChatWidget';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Preloader />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ChatWidget />
    </div>
  );
}

