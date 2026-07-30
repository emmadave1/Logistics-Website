import { format, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy HH:mm');
}

export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatCountdown(targetDate: string | Date): {
  days: number;
  hours: number;
  minutes: number;
  isOverdue: boolean;
} {
  const now = new Date();
  const target = new Date(targetDate);
  const isOverdue = now > target;
  
  if (isOverdue) {
    return { days: 0, hours: 0, minutes: 0, isOverdue: true };
  }
  
  const days = differenceInDays(target, now);
  const hours = differenceInHours(target, now) % 24;
  const minutes = differenceInMinutes(target, now) % 60;
  
  return { days, hours, minutes, isOverdue: false };
}

export function formatWeight(weight: number): string {
  if (weight < 1) {
    return `${(weight * 1000).toFixed(0)}g`;
  }
  return `${weight.toFixed(1)}kg`;
}

export function formatPhoneNumber(phone: string): string {
  // Basic formatting - can be extended for different regions
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatStatus(status: string): string {
  return status
    .split('_')
    .map(word => capitalizeFirst(word))
    .join(' ');
}
