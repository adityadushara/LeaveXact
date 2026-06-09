// JWT payload type definitions
export interface JWTPayload {
  user_id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Type guard to check if decoded JWT has required properties
export function isValidJWTPayload(payload: any): payload is JWTPayload {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.user_id === 'string' &&
    typeof payload.email === 'string' &&
    typeof payload.role === 'string'
  );
}