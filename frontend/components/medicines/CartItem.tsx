import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useCartStore } from '@/store/cartStore';
import { CartItem as CartItemType } from '@/types/medicineTypes';
import { Colors } from '@/constants/Colors';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, onQuantityChange, onRemove }) => {
  const { updateQuantity, removeFromCart } = useCartStore();

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(item.product._id);
    } else {
      updateQuantity(item.product._id, newQuantity);
    }
  };

  const handleRemove = () => {
    removeFromCart(item.product._id);
  };

  return (
    <View style={styles.container}>
      {/* Product Image */}
      <View style={styles.imageContainer}>
        {item.product.imageUrl ? (
          <Image source={{ uri: item.product.imageUrl }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <IconSymbol name="pills" size={24} color={Colors.light.icon} weight="light" />
          </View>
        )}
      </View>

      {/* Product Info - Middle Section */}
      <View style={styles.infoContainer}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.product.name}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.product.description}
        </Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>₹{item.product.price}</Text>
          <Text style={styles.totalPrice}>₹{item.product.price * item.quantity}</Text>
        </View>
      </View>

      {/* Right Section - Quantity Controls & Delete */}
      <View style={styles.rightSection}>
        {/* Quantity Controls */}
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.quantity - 1)}
            activeOpacity={0.7}
          >
            <IconSymbol name="minus" size={16} color="#6B7280" weight="medium" />
          </TouchableOpacity>
          
          <Text style={styles.quantityText}>{item.quantity}</Text>
          
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.quantity + 1)}
            activeOpacity={0.7}
          >
            <IconSymbol name="plus" size={16} color="#6B7280" weight="medium" />
          </TouchableOpacity>
        </View>

        {/* Remove Button */}
        <TouchableOpacity 
          style={styles.removeButton} 
          onPress={handleRemove}
          activeOpacity={0.7}
        >
          <IconSymbol name="trash" size={18} color="#EF4444" weight="medium" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  imageContainer: {
    marginRight: 16,
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoContainer: {
    flex: 1,
    marginRight: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 4,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
});

CartItem.displayName = 'CartItem';
export { CartItem }; 