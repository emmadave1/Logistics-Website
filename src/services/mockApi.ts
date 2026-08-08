import { Shipment, ShipmentFormData, ShipmentStatus, AdminUser } from '@/types/shipment';
import { generateTrackingId } from '@/utils/generateTrackingId';
import * as storage from './storage';
import { addShipmentEvent } from './notificationService';
import { formatDateTime } from '@/utils/formatters';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Random delay between 500-1500ms
const randomDelay = () => delay(500 + Math.random() * 1000);

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Track shipment
export async function trackShipment(trackingId: string): Promise<ApiResponse<Shipment>> {
  await randomDelay();
  
  const shipment = storage.getShipmentByTrackingId(trackingId);
  
  if (!shipment) {
    return {
      success: false,
      error: 'Shipment not found',
    };
  }
  
  // Add to recently tracked
  storage.addRecentlyTracked({
    trackingId: shipment.trackingId,
    status: shipment.status,
    trackedAt: new Date().toISOString(),
  });
  
  return {
    success: true,
    data: shipment,
  };
}

// Create shipment
export async function createShipment(formData: ShipmentFormData): Promise<ApiResponse<Shipment>> {
  await randomDelay();
  
  const trackingId = generateTrackingId();
  const now = new Date();
  
  // Estimate delivery based on international vs domestic
  const isInternational = formData.pickupCountry !== formData.deliveryCountry;
  const deliveryDays = isInternational ? 7 : 3;
  const estimatedDelivery = new Date(now.getTime() + deliveryDays * 24 * 60 * 60 * 1000);
  
  const shipment: Shipment = {
    id: Date.now().toString(),
    trackingId,
    status: 'pending',
    ...formData,
    createdAt: now.toISOString(),
    estimatedDelivery: estimatedDelivery.toISOString(),
    currentLocation: {
      city: formData.pickupCity,
      country: formData.pickupCountry,
      coordinates: { lat: 40.7128, lng: -74.0060 }, // Default NYC
    },
    timeline: [
      {
        status: 'pending',
        title: 'Order Received',
        description: 'Your shipment request has been received and is being processed',
        timestamp: now.toISOString(),
        location: `${formData.pickupCity}, ${formData.pickupCountry}`,
        completed: true,
      },
      {
        status: 'processing',
        title: 'Processing',
        description: 'Package is being prepared for shipment',
        timestamp: '',
        completed: false,
      },
      {
        status: 'in_transit',
        title: 'In Transit',
        description: 'Package is on its way to the destination',
        timestamp: '',
        completed: false,
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
        description: 'Package has been delivered successfully',
        timestamp: '',
        completed: false,
      },
    ],
  };
  
  storage.saveShipment(shipment);
  storage.clearFormDraft();
  
  return {
    success: true,
    data: shipment,
  };
}

// Update shipment status (admin)
export async function updateShipmentStatus(
  trackingId: string,
  status: ShipmentStatus,
  location?: string
): Promise<ApiResponse<Shipment>> {
  await randomDelay();
  
  const shipment = storage.getShipmentByTrackingId(trackingId);
  if (!shipment) {
    return { success: false, error: 'Shipment not found' };
  }
  
  const now = new Date().toISOString();
  const statusOrder: ShipmentStatus[] = ['pending', 'processing', 'in_transit', 'out_for_delivery', 'delivered'];
  const newStatusIndex = statusOrder.indexOf(status);
  
  // Update timeline
  const updatedTimeline = shipment.timeline.map((item, index) => {
    if (index <= newStatusIndex) {
      return {
        ...item,
        completed: true,
        timestamp: item.timestamp || now,
        location: location || item.location,
      };
    }
    return { ...item, completed: false, timestamp: '' };
  });
  
  const updates: Partial<Shipment> = {
    status,
    timeline: updatedTimeline,
  };
  
  if (status === 'delivered') {
    updates.deliveredAt = now;
  }
  
  if (location) {
    const [city, country] = location.split(',').map(part => part.trim());
    updates.currentLocation = {
      ...shipment.currentLocation,
      city: city || shipment.currentLocation.city,
      country: country || shipment.currentLocation.country,
    };
  }
  
  const updated = storage.updateShipment(trackingId, updates);

  const statusLabels: Record<ShipmentStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
  };

  if (updated && shipment.status !== status) {
    addShipmentEvent({
      trackingId,
      type: status === 'delivered' ? 'delivered' : 'status',
      title: status === 'delivered' ? 'Shipment delivered' : 'Shipment status updated',
      description:
        status === 'delivered'
          ? `Marked as delivered on ${formatDateTime(now)}.`
          : `Status changed from "${statusLabels[shipment.status]}" to "${statusLabels[status]}".`,
      from: statusLabels[shipment.status],
      to: statusLabels[status],
    });
  }

  if (updated && location) {
    const previousLocation = `${shipment.currentLocation.city}, ${shipment.currentLocation.country}`;
    const nextLocation = `${updated.currentLocation.city}, ${updated.currentLocation.country}`;
    if (previousLocation !== nextLocation) {
      addShipmentEvent({
        trackingId,
        type: 'location',
        title: 'Package location updated',
        description: `Package is now at ${nextLocation}.`,
        from: previousLocation,
        to: nextLocation,
      });
    }
  }

  return {
    success: true,
    data: updated!,
  };
}

// Update shipment ETA (admin)
export async function updateShipmentEta(
  trackingId: string,
  newEta: string
): Promise<ApiResponse<Shipment>> {
  await randomDelay();
  
  const previous = storage.getShipmentByTrackingId(trackingId);
  const updated = storage.updateShipment(trackingId, { estimatedDelivery: newEta });
  
  if (!updated) {
    return { success: false, error: 'Shipment not found' };
  }

  if (previous && previous.estimatedDelivery !== newEta) {
    addShipmentEvent({
      trackingId,
      type: 'eta',
      title: 'Delivery date & time updated',
      description: `Estimated delivery moved from ${formatDateTime(previous.estimatedDelivery)} to ${formatDateTime(newEta)}.`,
      from: formatDateTime(previous.estimatedDelivery),
      to: formatDateTime(newEta),
    });
  }
  
  return { success: true, data: updated };
}

// Update current package location (admin)
export async function updateShipmentLocation(
  trackingId: string,
  city: string,
  country: string,
  note?: string
): Promise<ApiResponse<Shipment>> {
  await randomDelay();

  const shipment = storage.getShipmentByTrackingId(trackingId);
  if (!shipment) {
    return { success: false, error: 'Shipment not found' };
  }

  const previousLocation = `${shipment.currentLocation.city}, ${shipment.currentLocation.country}`;
  const nextLocation = `${city.trim()}, ${country.trim()}`;

  const updated = storage.updateShipment(trackingId, {
    currentLocation: {
      ...shipment.currentLocation,
      city: city.trim(),
      country: country.trim(),
    },
  });

  if (!updated) {
    return { success: false, error: 'Shipment not found' };
  }

  if (previousLocation !== nextLocation) {
    addShipmentEvent({
      trackingId,
      type: 'location',
      title: 'Package location updated',
      description: note?.trim()
        ? `Package is now at ${nextLocation}. ${note.trim()}`
        : `Package moved from ${previousLocation} to ${nextLocation}.`,
      from: previousLocation,
      to: nextLocation,
    });
  }

  return { success: true, data: updated };
}

// Admin login
export async function adminLogin(username: string, password: string): Promise<ApiResponse<AdminUser>> {
  await randomDelay();
  
  // Demo credentials
  const validCredentials: Record<string, { password: string; user: AdminUser }> = {
    admin: {
      password: 'admin123',
      user: {
        id: '1',
        username: 'admin',
        role: 'admin',
        name: 'System Administrator',
      },
    },
    staff: {
      password: 'staff123',
      user: {
        id: '2',
        username: 'staff',
        role: 'staff',
        name: 'Staff Member',
      },
    },
  };
  
  const credentials = validCredentials[username.toLowerCase()];
  
  if (!credentials || credentials.password !== password) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  storage.saveAdminSession(credentials.user);
  
  return { success: true, data: credentials.user };
}

// Admin logout
export async function adminLogout(): Promise<ApiResponse<null>> {
  await delay(300);
  storage.clearAdminSession();
  return { success: true };
}

// Get all shipments (admin)
export async function getAllShipments(): Promise<ApiResponse<Shipment[]>> {
  await randomDelay();
  const shipments = storage.getShipments();
  return { success: true, data: shipments };
}

// Get shipment analytics
export async function getAnalytics(): Promise<ApiResponse<{
  total: number;
  delivered: number;
  inTransit: number;
  pending: number;
  statusDistribution: { status: string; count: number }[];
}>> {
  await randomDelay();
  
  const shipments = storage.getShipments();
  
  const delivered = shipments.filter(s => s.status === 'delivered').length;
  const inTransit = shipments.filter(s => s.status === 'in_transit' || s.status === 'out_for_delivery').length;
  const pending = shipments.filter(s => s.status === 'pending' || s.status === 'processing').length;
  
  const statusCounts: Record<string, number> = {};
  shipments.forEach(s => {
    statusCounts[s.status] = (statusCounts[s.status] || 0) + 1;
  });
  
  const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }));
  
  return {
    success: true,
    data: {
      total: shipments.length,
      delivered,
      inTransit,
      pending,
      statusDistribution,
    },
  };
}
