import { Shipment, ShipmentFormData, TrackedShipment, AdminUser } from '@/types/shipment';

const STORAGE_KEYS = {
  SHIPMENTS: 'movemate_shipments',
  TRACKED: 'movemate_tracked',
  FORM_DRAFT: 'movemate_form_draft',
  ADMIN_SESSION: 'movemate_admin_session',
  THEME: 'movemate_theme',
  LANGUAGE: 'movemate_language',
};

// Shipments
export function getShipments(): Shipment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SHIPMENTS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveShipment(shipment: Shipment): void {
  const shipments = getShipments();
  shipments.push(shipment);
  localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
}

export function updateShipment(trackingId: string, updates: Partial<Shipment>): Shipment | null {
  const shipments = getShipments();
  const index = shipments.findIndex(s => s.trackingId === trackingId);
  
  if (index === -1) return null;
  
  shipments[index] = { ...shipments[index], ...updates };
  localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(shipments));
  return shipments[index];
}

export function getShipmentByTrackingId(trackingId: string): Shipment | null {
  const shipments = getShipments();
  return shipments.find(s => s.trackingId.toUpperCase() === trackingId.toUpperCase()) || null;
}

// Recently tracked
export function getRecentlyTracked(): TrackedShipment[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRACKED);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addRecentlyTracked(tracked: TrackedShipment): void {
  let recentlyTracked = getRecentlyTracked();
  
  // Remove if already exists
  recentlyTracked = recentlyTracked.filter(t => t.trackingId !== tracked.trackingId);
  
  // Add to beginning
  recentlyTracked.unshift(tracked);
  
  // Keep only last 5
  recentlyTracked = recentlyTracked.slice(0, 5);
  
  localStorage.setItem(STORAGE_KEYS.TRACKED, JSON.stringify(recentlyTracked));
}

export function removeRecentlyTracked(trackingId: string): void {
  const recentlyTracked = getRecentlyTracked().filter(t => t.trackingId !== trackingId);
  localStorage.setItem(STORAGE_KEYS.TRACKED, JSON.stringify(recentlyTracked));
}

// Form draft
export function getFormDraft(): Partial<ShipmentFormData> | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.FORM_DRAFT);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveFormDraft(data: Partial<ShipmentFormData>): void {
  localStorage.setItem(STORAGE_KEYS.FORM_DRAFT, JSON.stringify(data));
}

export function clearFormDraft(): void {
  localStorage.removeItem(STORAGE_KEYS.FORM_DRAFT);
}

// Admin session
export function getAdminSession(): AdminUser | null {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export function saveAdminSession(user: AdminUser): void {
  localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, JSON.stringify(user));
}

export function clearAdminSession(): void {
  localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
}

// Theme
export function getTheme(): 'light' | 'dark' {
  return (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light';
}

export function saveTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}

// Language
export function getLanguage(): string {
  return localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en';
}

export function saveLanguage(language: string): void {
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
}

// Initialize with demo data if empty
export function initializeDemoData(): void {
  const shipments = getShipments();
  if (shipments.length === 0) {
    const demoShipments: Shipment[] = [
      {
        id: '1',
        trackingId: 'MM-LX-92F8A',
        status: 'in_transit',
        senderName: 'John Smith',
        senderPhone: '+1 555-123-4567',
        pickupLocation: '123 Main Street',
        pickupCity: 'New York',
        pickupCountry: 'United States',
        receiverName: 'Jane Doe',
        receiverPhone: '+1 555-987-6543',
        deliveryLocation: '456 Oak Avenue',
        deliveryCity: 'Los Angeles',
        deliveryCountry: 'United States',
        packageDescription: 'Electronics - Laptop and accessories',
        packageWeight: 3.5,
        packageCategory: 'electronics',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        currentLocation: {
          city: 'Phoenix',
          country: 'United States',
          coordinates: { lat: 33.4484, lng: -112.0740 },
        },
        timeline: [
          {
            status: 'pending',
            title: 'Order Received',
            description: 'Your shipment request has been received',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'New York, US',
            completed: true,
          },
          {
            status: 'processing',
            title: 'Processing',
            description: 'Package is being prepared for shipment',
            timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'New York, US',
            completed: true,
          },
          {
            status: 'in_transit',
            title: 'In Transit',
            description: 'Package is on its way to the destination',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Phoenix, US',
            completed: true,
          },
          {
            status: 'out_for_delivery',
            title: 'Out for Delivery',
            description: 'Package is out for delivery',
            timestamp: '',
            completed: false,
          },
          {
            status: 'delivered',
            title: 'Delivered',
            description: 'Package has been delivered',
            timestamp: '',
            completed: false,
          },
        ],
      },
      {
        id: '2',
        trackingId: 'MM-LX-7B3C2',
        status: 'delivered',
        senderName: 'Alice Johnson',
        senderPhone: '+44 20 7946 0958',
        pickupLocation: '10 Downing Street',
        pickupCity: 'London',
        pickupCountry: 'United Kingdom',
        receiverName: 'Bob Williams',
        receiverPhone: '+33 1 42 68 53 00',
        deliveryLocation: '1 Rue de Rivoli',
        deliveryCity: 'Paris',
        deliveryCountry: 'France',
        packageDescription: 'Documents - Legal papers',
        packageWeight: 0.5,
        packageCategory: 'documents',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        estimatedDelivery: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        deliveredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        currentLocation: {
          city: 'Paris',
          country: 'France',
          coordinates: { lat: 48.8566, lng: 2.3522 },
        },
        timeline: [
          {
            status: 'pending',
            title: 'Order Received',
            description: 'Your shipment request has been received',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'London, UK',
            completed: true,
          },
          {
            status: 'processing',
            title: 'Processing',
            description: 'Package is being prepared for shipment',
            timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'London, UK',
            completed: true,
          },
          {
            status: 'in_transit',
            title: 'In Transit',
            description: 'Package is on its way to the destination',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Channel Tunnel',
            completed: true,
          },
          {
            status: 'out_for_delivery',
            title: 'Out for Delivery',
            description: 'Package is out for delivery',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Paris, FR',
            completed: true,
          },
          {
            status: 'delivered',
            title: 'Delivered',
            description: 'Package has been delivered',
            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Paris, FR',
            completed: true,
          },
        ],
      },
    ];
    
    localStorage.setItem(STORAGE_KEYS.SHIPMENTS, JSON.stringify(demoShipments));
  }
}
