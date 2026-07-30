export function validateEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length >= 10 && cleaned.length <= 15;
}

export function validateRequired(value: string): boolean {
  return value.trim().length > 0;
}

export function validateMinLength(value: string, minLength: number): boolean {
  return value.trim().length >= minLength;
}

export function validateMaxLength(value: string, maxLength: number): boolean {
  return value.trim().length <= maxLength;
}

export function validateWeight(weight: number): boolean {
  return weight > 0 && weight <= 1000; // Max 1000kg
}

export function validateTrackingId(id: string): { valid: boolean; error?: string } {
  if (!id.trim()) {
    return { valid: false, error: 'Please enter a tracking ID' };
  }
  
  const pattern = /^MM-LX-[A-Z0-9]{5}$/i;
  if (!pattern.test(id.trim())) {
    return { valid: false, error: 'Invalid tracking ID format. Expected: MM-LX-XXXXX' };
  }
  
  return { valid: true };
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateShipmentForm(data: Record<string, unknown>): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Sender validation
  if (!validateRequired(data.senderName as string)) {
    errors.senderName = 'Sender name is required';
  }
  
  if (!validatePhone(data.senderPhone as string)) {
    errors.senderPhone = 'Valid phone number is required';
  }
  
  if (!validateRequired(data.pickupLocation as string)) {
    errors.pickupLocation = 'Pickup location is required';
  }
  
  if (!validateRequired(data.pickupCity as string)) {
    errors.pickupCity = 'Pickup city is required';
  }
  
  if (!validateRequired(data.pickupCountry as string)) {
    errors.pickupCountry = 'Pickup country is required';
  }
  
  // Receiver validation
  if (!validateRequired(data.receiverName as string)) {
    errors.receiverName = 'Receiver name is required';
  }
  
  if (!validatePhone(data.receiverPhone as string)) {
    errors.receiverPhone = 'Valid phone number is required';
  }
  
  if (!validateRequired(data.deliveryLocation as string)) {
    errors.deliveryLocation = 'Delivery location is required';
  }
  
  if (!validateRequired(data.deliveryCity as string)) {
    errors.deliveryCity = 'Delivery city is required';
  }
  
  if (!validateRequired(data.deliveryCountry as string)) {
    errors.deliveryCountry = 'Delivery country is required';
  }
  
  // Package validation
  if (!validateRequired(data.packageDescription as string)) {
    errors.packageDescription = 'Package description is required';
  }
  
  if (!validateWeight(data.packageWeight as number)) {
    errors.packageWeight = 'Weight must be between 0 and 1000 kg';
  }
  
  if (!validateRequired(data.packageCategory as string)) {
    errors.packageCategory = 'Package category is required';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
