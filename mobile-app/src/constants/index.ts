// Use 10.0.2.2 for Android emulator (maps to host localhost)
// Change to your actual server IP for physical devices
export const API_BASE_URL = 'http://10.0.2.2:5000/api';

export const COLORS = {
  primary: '#2e7d32',
  primaryLight: '#4caf50',
  primaryDark: '#1b5e20',
  secondary: '#ff9800',
  secondaryLight: '#ffb74d',
  accent: '#2196f3',
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#212121',
  textSecondary: '#757575',
  textLight: '#bdbdbd',
  border: '#e0e0e0',
  error: '#d32f2f',
  success: '#388e3c',
  warning: '#f57c00',
  info: '#1976d2',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
};

export const FONTS = {
  regular: { fontFamily: 'System', fontWeight: '400' as const },
  medium: { fontFamily: 'System', fontWeight: '500' as const },
  semiBold: { fontFamily: 'System', fontWeight: '600' as const },
  bold: { fontFamily: 'System', fontWeight: '700' as const },
};

export const STATUS_COLORS: Record<string, string> = {
  pending: '#f57c00',
  accepted: '#1976d2',
  on_hold: '#fbc02d',
  rejected: '#d32f2f',
  ready: '#7b1fa2',
  dispatched: '#3f51b5',
  delivered: '#388e3c',
  cancelled: '#9e9e9e',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  on_hold: 'On Hold',
  rejected: 'Rejected',
  ready: 'Ready',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const STORE_INFO = {
  name: 'Mufar Commerce',
  tagline: 'Your Trusted Business Partner',
  phone: '+254700000000',
  email: 'info@mufarcommerce.com',
  website: 'https://mufarcommerce.com',
};
