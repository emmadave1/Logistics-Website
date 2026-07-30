export type ShipmentStatus = 'pending' | 'processing' | 'in_transit' | 'out_for_delivery' | 'delivered';

export interface ShipmentLocation {
  city: string;
  country: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface ShipmentTimeline {
  status: ShipmentStatus;
  title: string;
  description: string;
  timestamp: string;
  location?: string;
  completed: boolean;
}

export interface Shipment {
  id: string;
  trackingId: string;
  status: ShipmentStatus;
  
  // Sender Info
  senderName: string;
  senderPhone: string;
  pickupLocation: string;
  pickupCity: string;
  pickupCountry: string;
  
  // Receiver Info
  receiverName: string;
  receiverPhone: string;
  deliveryLocation: string;
  deliveryCity: string;
  deliveryCountry: string;
  
  // Package Info
  packageDescription: string;
  packageWeight: number;
  packageCategory: PackageCategory;
  
  // Dates
  createdAt: string;
  estimatedDelivery: string;
  deliveredAt?: string;
  
  // Current location
  currentLocation: ShipmentLocation;
  
  // Timeline
  timeline: ShipmentTimeline[];
}

export type PackageCategory = 
  | 'documents'
  | 'electronics'
  | 'clothing'
  | 'fragile'
  | 'food'
  | 'medical'
  | 'other';

export interface ShipmentFormData {
  // Sender
  senderName: string;
  senderPhone: string;
  pickupLocation: string;
  pickupCity: string;
  pickupCountry: string;
  
  // Receiver
  receiverName: string;
  receiverPhone: string;
  deliveryLocation: string;
  deliveryCity: string;
  deliveryCountry: string;
  
  // Package
  packageDescription: string;
  packageWeight: number;
  packageCategory: PackageCategory;
}

export interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'staff' | 'user';
  name: string;
}

export interface TrackedShipment {
  trackingId: string;
  status: ShipmentStatus;
  trackedAt: string;
}
