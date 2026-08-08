export type ShipmentEventType = 'eta' | 'status' | 'delivered' | 'created' | 'location';
export interface ShipmentEvent {
  id: string;
  trackingId: string;
  type: ShipmentEventType;
  title: string;
  description: string;
  from?: string;
  to?: string;
  createdAt: string;
}

const STORAGE_KEY = 'movemate_shipment_events';
const MAX_EVENTS_PER_SHIPMENT = 50;

type EventStore = Record<string, ShipmentEvent[]>;

function readStore(): EventStore {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? (JSON.parse(data) as EventStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: EventStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

const key = (trackingId: string) => trackingId.toUpperCase();

export function getShipmentEvents(trackingId: string): ShipmentEvent[] {
  return readStore()[key(trackingId)] || [];
}

export function addShipmentEvent(
  event: Omit<ShipmentEvent, 'id' | 'createdAt'> & { createdAt?: string }
): ShipmentEvent {
  const store = readStore();
  const id = key(event.trackingId);
  const record: ShipmentEvent = {
    ...event,
    trackingId: id,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: event.createdAt || new Date().toISOString(),
  };
  store[id] = [record, ...(store[id] || [])].slice(0, MAX_EVENTS_PER_SHIPMENT);
  writeStore(store);
  return record;
}

export function clearShipmentEvents(trackingId: string): void {
  const store = readStore();
  delete store[key(trackingId)];
  writeStore(store);
}
