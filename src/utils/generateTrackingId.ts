/**
 * Generates a unique tracking ID in format: MM-LX-XXXXX
 * MM = Movemate prefix
 * LX = LogisticExpress
 * XXXXX = Random alphanumeric string
 */
export function generateTrackingId(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  
  for (let i = 0; i < 5; i++) {
    randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return `MM-LX-${randomPart}`;
}

/**
 * Validates if a string matches the tracking ID format
 */
export function isValidTrackingIdFormat(id: string): boolean {
  const pattern = /^MM-LX-[A-Z0-9]{5}$/;
  return pattern.test(id.toUpperCase());
}

/**
 * Formats a tracking ID to uppercase with proper format
 */
export function formatTrackingId(id: string): string {
  return id.toUpperCase().trim();
}
