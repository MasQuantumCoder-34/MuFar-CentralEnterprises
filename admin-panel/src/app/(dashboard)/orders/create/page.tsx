'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Package,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ImageIcon,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  User,
  FolderTree,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import type { IUser, ICategory, IProduct, IApiResponse } from '@/types';

interface CartItem {
  product: IProduct;
  quantity: number;
  size?: string;
}

function cartKey(productId: string, size?: string) {
  return `${productId}::${size || ''}`;
}

function getSizePrice(product: IProduct, size?: string) {
  if (size && product.sizes?.length) {
    const found = product.sizes.find(s => s.name === size);
    if (found) return { mrp: found.mrp ?? product.mrp, salesPrice: found.salesPrice ?? found.mrp ?? product.salesPrice ?? product.mrp };
  }
  return { mrp: product.mrp, salesPrice: product.salesPrice ?? product.mrp };
}

export default function CreateOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const preselectedClientId = searchParams.get('clientId');

  const [step, setStep] = useState<'client' | 'category' | 'products'>(preselectedClientId ? 'category' : 'client');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    staleTime: 60 * 1000,
    queryFn: () => {
      const params = new URLSearchParams({ role: 'client', limit: '100' });
      if (clientSearch) params.set('search', clientSearch);
      return api.get<IApiResponse<IUser[]>>(`/users?${params}`).then(r => r.data.data || []);
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    staleTime: 5 * 60 * 1000,
    queryFn: () => api.get<IApiResponse<ICategory[]>>('/categories').then(r => r.data.data || []),
  });

  const { data: products } = useQuery({
    queryKey: ['products', selectedCategoryId],
    staleTime: 60 * 1000,
    queryFn: () => api.get<IApiResponse<IProduct[]>>(`/products?category=${selectedCategoryId}`).then(r => r.data.data || []),
    enabled: !!selectedCategoryId,
  });

  const selectedClient = clients?.find(c => c._id === selectedClientId);
  const selectedCategory = categories?.find(c => c._id === selectedCategoryId);

  const addToCart = (product: IProduct, size?: string) => {
    if (product.sizes?.length && !size) {
      toast.error('Please select a size');
      return;
    }
    const key = cartKey(product._id, size);
    setCart(prev => {
      const existing = prev.find(item => cartKey(item.product._id, item.size) === key);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          toast.error('Cannot add more than available stock');
          return prev;
        }
        return prev.map(item =>
          cartKey(item.product._id, item.size) === key
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, size: size || undefined }];
    });
  };

  const updateCartQty = (key: string, qty: number) => {
    setCart(prev =>
      prev.map(item =>
        cartKey(item.product._id, item.size) === key
          ? { ...item, quantity: Math.max(1, Math.min(qty, item.product.stockQuantity)) }
          : item
      )
    );
  };

  const removeFromCart = (key: string) => {
    setCart(prev => prev.filter(item => cartKey(item.product._id, item.size) !== key));
  };

  const cartTotal = cart.reduce((sum, item) => {
    const { salesPrice } = getSizePrice(item.product, item.size);
    return sum + salesPrice * item.quantity;
  }, 0);
  const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/orders', {
        clientId: selectedClientId,
        items: cart.map(item => ({ product: item.product._id, quantity: item.quantity, size: item.size })),
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setCreatedOrder({ ...data, clientName: selectedClient?.storeName || selectedClient?.name });
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Failed to create order'),
  });

  const resetForm = () => {
    setCart([]);
    setSelectedCategoryId('');
    setSelectedClientId('');
    setStep('client');
    setShowSuccess(false);
    setCreatedOrder(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Order</h1>
          <p className="text-muted-foreground">Multi-step order creation</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <span className={step === 'client' ? 'text-primary font-semibold' : ''}>Select Client</span>
        <ArrowRight className="h-3 w-3" />
        <span className={step === 'category' ? 'text-primary font-semibold' : ''}>Select Category</span>
        <ArrowRight className="h-3 w-3" />
        <span className={step === 'products' ? 'text-primary font-semibold' : ''}>Select Products</span>
      </div>

      {step === 'client' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              Step 1: Select Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="grid gap-2 max-h-80 overflow-y-auto">
              {!clients ? (
                <LoadingSpinner />
              ) : clients.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">No clients found</p>
              ) : (
                clients.map((client) => (
                  <div
                    key={client._id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedClientId === client._id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setSelectedClientId(client._id)}
                  >
                    <div>
                      <p className="font-medium text-sm">{client.storeName || client.name}</p>
                      <p className="text-xs text-muted-foreground">{client.ownerName || client.mobile || client.email}</p>
                    </div>
                    {selectedClientId === client._id && (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))
              )}
            </div>
            <Button
              className="w-full"
              disabled={!selectedClientId}
              onClick={() => setStep('category')}
            >
              Next: Select Category
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 'category' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FolderTree className="h-5 w-5" />
              Step 2: Select Category
              {selectedClient && (
                <span className="text-sm font-normal text-muted-foreground ml-auto">
                  Client: {selectedClient.storeName || selectedClient.name}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!categories ? (
              <LoadingSpinner />
            ) : categories.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No categories available</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className={`border rounded-xl p-4 cursor-pointer transition-all text-center ${
                      selectedCategoryId === cat._id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'hover:border-primary/50 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedCategoryId(cat._id)}
                  >
                    <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden bg-muted flex items-center justify-center mb-2">
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} width={64} height={64} className="object-cover w-full h-full" />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <p className="font-medium text-sm">{cat.name}</p>
                    {cat.productCount !== undefined && (
                      <p className="text-xs text-muted-foreground">{cat.productCount} products</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep('client')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                className="flex-1"
                disabled={!selectedCategoryId}
                onClick={() => setStep('products')}
              >
                Next: Select Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'products' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Step 3: Select Products
                  {selectedCategory && (
                    <span className="text-sm font-normal text-muted-foreground ml-auto">
                      Category: {selectedCategory.name}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!products ? (
                  <LoadingSpinner />
                ) : products.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">No products in this category</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {products.map((product) => {
                      const selSize = selectedSizes[product._id] || '';
                      return (
                      <Card key={product._id} className="overflow-hidden">
                        <div className="h-32 bg-muted flex items-center justify-center overflow-hidden">
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.name} width={200} height={128} className="object-cover w-full h-full" />
                          ) : (
                            <Package className="h-10 w-10 text-muted-foreground" />
                          )}
                        </div>
                        <CardContent className="p-3 space-y-2">
                          <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-primary font-semibold">₹{getSizePrice(product, selSize || undefined).salesPrice.toLocaleString()}</span>
                              <span className="text-xs line-through text-muted-foreground">₹{getSizePrice(product, selSize || undefined).mrp.toLocaleString()}</span>
                            </div>
                            <span className={product.stockQuantity <= 5 ? 'text-destructive text-xs' : 'text-muted-foreground text-xs'}>
                              Stock: {product.stockQuantity}
                            </span>
                          </div>
                          {product.sizes?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {product.sizes.map((s: any) => {
                                const sName = typeof s === 'string' ? s : s.name;
                                return (
                                <button
                                  key={sName}
                                  type="button"
                                  onClick={() =>
                                    setSelectedSizes(prev => ({ ...prev, [product._id]: prev[product._id] === sName ? '' : sName }))
                                  }
                                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                    selSize === sName
                                      ? 'border-primary bg-primary text-primary-foreground'
                                      : 'border-input bg-background hover:bg-muted'
                                  }`}
                                >
                                  {sName}
                                </button>
                              )})}
                            </div>
                          )}
                          <Button
                            size="sm"
                            className="w-full"
                            onClick={() => addToCart(product, selSize || undefined)}
                            disabled={product.stockQuantity <= 0 || (product.sizes?.length > 0 && !selSize)}
                          >
                            {product.stockQuantity <= 0 ? 'Out of Stock' : product.sizes?.length > 0 && !selSize ? 'Select Size' : 'Add to Order'}
                          </Button>
                        </CardContent>
                      </Card>
                    )})}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" onClick={() => setStep('category')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="h-5 w-5" />
                  Order Cart
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {cart.map((item) => {
                        const key = cartKey(item.product._id, item.size);
                        return (
                        <div key={key} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg text-sm">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {item.product.name}
                              {item.size && <span className="text-muted-foreground ml-1">({item.size})</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">₹{getSizePrice(item.product, item.size).salesPrice.toLocaleString()} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateCartQty(key, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-6 text-center text-xs font-medium">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateCartQty(key, item.quantity + 1)}
                              disabled={item.quantity >= item.product.stockQuantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive"
                              onClick={() => removeFromCart(key)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )})}
                    </div>
                    <div className="border-t pt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Products</span>
                        <span>{cart.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Qty</span>
                        <span>{totalQty}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>₹{cartTotal.toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      disabled={cart.length === 0 || createOrderMutation.isPending}
                      onClick={() => createOrderMutation.mutate()}
                    >
                      {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Order Created Successfully
            </DialogTitle>
          </DialogHeader>
          {createdOrder && (
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Number</span>
                  <span className="font-medium">{createdOrder.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client</span>
                  <span className="font-medium">{createdOrder.clientName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-bold text-primary">₹{createdOrder.total?.toLocaleString()}</span>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetForm}
                >
                  Create Another Order
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => router.push(`/orders/${createdOrder._id}`)}
                >
                  View Order
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
