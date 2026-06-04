export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000,
  MAX_REQUESTS: 100,
  AUTH_WINDOW_MS: 15 * 60 * 1000,
  AUTH_MAX_REQUESTS: 5,
};

export const JWT = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  RESET_TOKEN_EXPIRY: '1h',
};

export const ACCOUNT_LOCK = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_DURATION_MINUTES: 30,
};

export const ORDER_STATUS_FLOW: Record<string, string[]> = {
  pending: ['accepted', 'on_hold', 'rejected', 'cancelled'],
  accepted: ['ready_for_distribution', 'cancelled'],
  on_hold: ['accepted', 'rejected'],
  ready_for_distribution: ['dispatched'],
  dispatched: ['delivered'],
  rejected: [],
  delivered: [],
  cancelled: [],
};

export const INVOICE_PREFIX = 'INV';

export const PAYMENT_TERMS = 'Due on receipt';

export const CURRENCY = 'INR';

export const WHATSAPP_NUMBER = '';
