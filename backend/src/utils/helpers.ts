import { IUser } from '@mufar-commerce/shared';

const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const paginateQuery = (query: any, page: number = 1, limit: number = 10) => {
  const skip = (page - 1) * limit;
  return query.skip(skip).limit(limit);
};

const sanitizeUser = (user: any): Partial<IUser> => {
  if (!user) return {};
  const sanitized = user.toObject ? user.toObject() : { ...user };
  delete sanitized.password;
  delete sanitized.refreshToken;
  delete sanitized.__v;
  return sanitized as Partial<IUser>;
};

const getSizePrice = (product: any, sizeName?: string) => {
  const sizes = product.sizes || [];
  if (sizeName && sizes.length > 0) {
    const found = sizes.find((s: any) => s.name === sizeName);
    if (found) {
      return { mrp: found.mrp ?? product.mrp, salesPrice: found.salesPrice ?? found.mrp ?? product.salesPrice ?? product.mrp };
    }
  }
  return { mrp: product.mrp, salesPrice: product.salesPrice ?? product.mrp };
};

export { formatCurrency, paginateQuery, sanitizeUser, getSizePrice };
