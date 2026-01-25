/**
 * Generate a unique ID using timestamp + random values
 * Works in React Native/Expo without crypto dependencies
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomPart}`;
}
