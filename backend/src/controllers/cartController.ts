import { Response, NextFunction } from 'express';
import Cart from '../models/Cart';
import Product from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { getSizePrice } from '../utils/helpers';

const getCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let cart = await Cart.findOne({ client: req.user?._id })
      .populate('items.product', 'name mrp images stockQuantity');

    if (!cart) {
      cart = await Cart.create({ client: req.user?._id, items: [] });
    }

    res.status(200).json({
      success: true,
      message: 'Cart retrieved',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

const addCartItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { product: productId, quantity = 1, size } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found', error: 'Not Found' });
      return;
    }

    if (!product.isActive) {
      res.status(400).json({ success: false, message: 'Product is not available', error: 'Bad Request' });
      return;
    }

    if (product.stockQuantity < quantity) {
      res.status(400).json({
        success: false,
        message: `Only ${product.stockQuantity} items available in stock`,
        error: 'Bad Request',
      });
      return;
    }

    let cart = await Cart.findOne({ client: req.user?._id });

    if (!cart) {
      cart = await Cart.create({
        client: req.user?._id,
        items: [],
      });
    }

    const { salesPrice: itemPrice } = getSizePrice(product, size);

    const existingItemIndex = cart.items.findIndex(
      (item) => (item.product as any).toString() === productId && (item as any).size === (size || undefined)
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
      if (cart.items[existingItemIndex].quantity > product.stockQuantity) {
        cart.items[existingItemIndex].quantity = product.stockQuantity;
      }
    } else {
      cart.items.push({
        product: product._id as any,
        productName: product.name,
        price: itemPrice,
        quantity,
        image: product.images.length > 0 ? product.images[0] : undefined,
        stockQuantity: product.stockQuantity,
        size: size || undefined,
      } as any);
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name mrp images stockQuantity');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      data: populatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { quantity } = req.body;
    const { productId } = req.params;

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found', error: 'Not Found' });
      return;
    }

    if (quantity > product.stockQuantity) {
      res.status(400).json({
        success: false,
        message: `Only ${product.stockQuantity} items available in stock`,
        error: 'Bad Request',
      });
      return;
    }

    const cart = await Cart.findOne({ client: req.user?._id });

    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found', error: 'Not Found' });
      return;
    }

    const itemIndex = cart.items.findIndex(
      (item) => (item.product as any).toString() === productId
    );

    if (itemIndex === -1) {
      res.status(404).json({ success: false, message: 'Item not found in cart', error: 'Not Found' });
      return;
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name mrp images stockQuantity');

    res.status(200).json({
      success: true,
      message: 'Cart item updated',
      data: populatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ client: req.user?._id });

    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found', error: 'Not Found' });
      return;
    }

    cart.items = cart.items.filter(
      (item) => (item.product as any).toString() !== productId
    );

    await cart.save();

    const populatedCart = await Cart.findById(cart._id)
      .populate('items.product', 'name mrp images stockQuantity');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      data: populatedCart,
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const cart = await Cart.findOne({ client: req.user?._id });

    if (!cart) {
      res.status(404).json({ success: false, message: 'Cart not found', error: 'Not Found' });
      return;
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

export { getCart, addCartItem, updateCartItem, removeCartItem, clearCart };
