import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useProductStore } from '@/store/productStore';
import { Product } from '@/types/medicineTypes';
import { Colors } from '@/constants/Colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 2 columns with padding

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, getCartItem } = useProductStore();
  const [isAdding, setIsAdding] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));

  const cartItem = getCartItem(product._id);
  const isInCart = !!cartItem;

  const handleAddToCart = async () => {
    if (isAdding) return; // Prevent multiple clicks
    
    setIsAdding(true);
    console.log('ProductCard - Adding to cart:', product.name);
    
    // Animate the button
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Add to cart
    addToCart(product, 1);
    
    // Reset state after animation
    setTimeout(() => {
      setIsAdding(false);
    }, 300);
  };

  return (
    <View style={styles.card}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <IconSymbol name="pills" size={32} color={Colors.light.icon} weight="light" />
          </View>
        )}
        
        {/* Available Quantity Badge */}
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>
            {product.availableQuantity} left
          </Text>
        </View>

        {/* Add to Cart Button Overlay */}
        <Animated.View style={[styles.addButtonContainer, { transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity 
            style={[
              styles.addButtonOverlay,
              isInCart && styles.addButtonInCart,
              isAdding && styles.addButtonAdding
            ]} 
            onPress={handleAddToCart}
            disabled={isAdding}
          >
            {isInCart ? (
              <View style={styles.buttonContent}>
                <IconSymbol name="check" size={14} color="#FFFFFF" weight="medium" />
                <Text style={styles.buttonText}>Added</Text>
              </View>
            ) : isAdding ? (
              <View style={styles.buttonContent}>
                <View style={styles.loadingSpinner} />
                <Text style={styles.buttonText}>Adding...</Text>
              </View>
            ) : (
              <View style={styles.buttonContent}>
                <IconSymbol name="plus" size={14} color="#FFFFFF" weight="medium" />
                <Text style={styles.buttonText}>Add Cart</Text>
              </View>
            )}
          </TouchableOpacity>
          
          {/* Cart quantity indicator */}
          {isInCart && cartItem && (
            <View style={styles.cartQuantityBadge}>
              <Text style={styles.cartQuantityText}>{cartItem.quantity}</Text>
            </View>
          )}
        </Animated.View>
      </View>

      {/* Product Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {product.description}
        </Text>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>₹{product.price}</Text>
          <Text style={styles.priceLabel}>per unit</Text>
        </View>
        
        {/* In Cart Indicator */}
        {isInCart && (
          <View style={styles.inCartIndicator}>
            <Text style={styles.inCartText}>In Cart ({cartItem?.quantity})</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: cardWidth,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  placeholderImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backdropFilter: 'blur(10px)',
  },
  quantityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addButtonContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  addButtonOverlay: {
    backgroundColor: Colors.light.tint,
    minWidth: 80,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: Colors.light.tint,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonInCart: {
    backgroundColor: '#10B981', // Green color for items in cart
  },
  addButtonAdding: {
    backgroundColor: '#6B7280', // Gray color while adding
  },
  cartQuantityBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  cartQuantityText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  loadingSpinner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
    animationName: 'spin',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 4,
  },
  infoContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 18,
    fontWeight: '400',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.tint,
    letterSpacing: -0.3,
  },
  priceLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  inCartIndicator: {
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  inCartText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
  },
}); 