import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import productService from '../../services/productService';
import { Product } from '../../types';
import { COLORS, STORE_INFO } from '../../constants';
import QuantitySelector from '../../components/QuantitySelector';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useCartStore } from '../../store/cartStore';
import Toast from 'react-native-toast-message';
import type { HomeStackParamList } from '../../navigation/MainTabs';

type ProductDetailRouteProp = RouteProp<HomeStackParamList, 'ProductDetail'>;
const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const route = useRoute<ProductDetailRouteProp>();
  const { productId } = route.params;
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const data = await productService.getProductById(productId);
        setProduct(data);
      } catch { /* ignore */ }
      setIsLoading(false);
    })();
  }, [productId]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
    addItem({ productId: product.id, product, quantity });
    Toast.show({ type: 'success', text1: 'Added to cart', text2: `${product.name} x${quantity}` });
  };

  const handleShareWhatsApp = () => {
    if (!product) return;
    const text = `Check out this product from ${STORE_INFO.name}:\n\n${product.name}\nPrice: KES ${product.offerPrice || product.price}\nSKU: ${product.sku}\n\n${STORE_INFO.website}/products/${product.slug}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not open WhatsApp' });
    });
  };

  if (isLoading) return <LoadingSpinner />;
  if (!product) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <Ionicons name="alert-circle-outline" size={48} color={COLORS.textLight} />
        <Text className="text-gray-500 mt-2">Product not found</Text>
      </SafeAreaView>
    );
  }

  const hasOffer = !!product.offerPrice && product.offerPrice < product.price;
  const outOfStock = product.stock <= 0;
  const images = product.images?.length > 0 ? product.images : [];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        {images.length > 0 ? (
          <View>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const idx = Math.round(e.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(idx);
              }}
            >
              {images.map((img, idx) => (
                <Image
                  key={idx}
                  source={{ uri: img }}
                  className="w-screen h-80"
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            {images.length > 1 && (
              <View className="flex-row justify-center py-2">
                {images.map((_, idx) => (
                  <View
                    key={idx}
                    className={`w-2 h-2 rounded-full mx-1 ${
                      idx === currentImageIndex ? 'bg-primary-700' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </View>
            )}
          </View>
        ) : (
          <View className="w-screen h-80 bg-gray-100 justify-center items-center">
            <Ionicons name="image-outline" size={64} color={COLORS.textLight} />
          </View>
        )}

        <View className="px-4 pt-4">
          <Text className="text-2xl font-bold text-gray-800">{product.name}</Text>

          <View className="flex-row items-center mt-2">
            {product.brand && (
              <View className="bg-gray-100 rounded-full px-3 py-1 mr-2">
                <Text className="text-xs text-gray-600">{product.brand}</Text>
              </View>
            )}
            <View className="bg-gray-100 rounded-full px-3 py-1">
              <Text className="text-xs text-gray-600">{product.categoryName || 'General'}</Text>
            </View>
          </View>

          <Text className="text-xs text-gray-500 mt-2">SKU: {product.sku}</Text>

          <View className="flex-row items-center mt-4">
            <Text className="text-3xl font-bold text-primary-700">
              KES {hasOffer ? product.offerPrice : product.price}
            </Text>
            {hasOffer && (
              <Text className="text-lg text-gray-400 line-through ml-3">
                KES {product.price}
              </Text>
            )}
          </View>

          <View className="flex-row items-center mt-2">
            {outOfStock ? (
              <View className="bg-red-50 rounded-full px-3 py-1">
                <Text className="text-sm text-red-600 font-medium">Out of Stock</Text>
              </View>
            ) : product.stock <= 5 ? (
              <View className="bg-orange-50 rounded-full px-3 py-1">
                <Text className="text-sm text-orange-600 font-medium">Only {product.stock} left</Text>
              </View>
            ) : (
              <View className="bg-green-50 rounded-full px-3 py-1">
                <Text className="text-sm text-green-600 font-medium">In Stock ({product.stock})</Text>
              </View>
            )}
          </View>

          <View className="mt-6">
            <Text className="text-base font-semibold text-gray-800 mb-2">Description</Text>
            <Text className="text-sm text-gray-600 leading-6">{product.description}</Text>
          </View>

          <View className="mt-6">
            <Text className="text-base font-semibold text-gray-800 mb-2">Quantity</Text>
            <QuantitySelector quantity={quantity} onChange={setQuantity} max={Math.min(product.stock, 99)} min={1} />
          </View>

          <View className="flex-row mt-6 mb-8">
            <TouchableOpacity
              onPress={handleAddToCart}
              disabled={outOfStock}
              className={`flex-1 py-4 rounded-xl flex-row justify-center items-center ${
                outOfStock ? 'bg-gray-300' : 'bg-primary-700'
              }`}
            >
              <Ionicons name="cart" size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                {outOfStock ? 'Out of Stock' : 'Add to Cart'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShareWhatsApp}
              className="ml-3 bg-green-500 py-4 px-4 rounded-xl"
            >
              <Ionicons name="logo-whatsapp" size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
