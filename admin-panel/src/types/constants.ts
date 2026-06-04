export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
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

export const CURRENCY = 'INR';
