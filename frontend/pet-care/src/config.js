// Set EXPO_PUBLIC_API_URL in .env (Android emulator: http://10.0.2.2:4000/api)
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
export const TOKEN_KEY = 'petcare_access_token';
export const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
export const MERCHANT_NAME = 'pet-care';