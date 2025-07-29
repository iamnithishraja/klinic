import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Text,
} from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';

const { width, height } = Dimensions.get('window');

interface FloatingActionButtonProps {
  onCartPress: () => void;
  onPrescriptionPress: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onCartPress,
  onPrescriptionPress,
}) => {
  const { getCartItemCount } = useProductStore();
  const { isExpanded, toggleFAB } = useCartStore();
  const [localExpanded, setLocalExpanded] = useState(false);

  // Animation values
  const expandAnimation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const cartButtonAnimation = useRef(new Animated.Value(0)).current;
  const prescriptionButtonAnimation = useRef(new Animated.Value(0)).current;

  const cartItemCount = getCartItemCount();

  const toggleExpanded = () => {
    const toValue = localExpanded ? 0 : 1;
    setLocalExpanded(!localExpanded);
    toggleFAB(!localExpanded);

    // Main button rotation animation
    Animated.timing(rotateAnimation, {
      toValue: toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Backdrop fade animation
    Animated.timing(backdropOpacity, {
      toValue: toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Sub-buttons slide and scale animations
    const subButtonAnimations = [
      Animated.timing(cartButtonAnimation, {
        toValue: toValue,
        duration: 200,
        delay: toValue ? 50 : 0,
        useNativeDriver: true,
      }),
      Animated.timing(prescriptionButtonAnimation, {
        toValue: toValue,
        duration: 200,
        delay: toValue ? 100 : 0,
        useNativeDriver: true,
      }),
    ];

    Animated.parallel(subButtonAnimations).start();
  };

  const handleBackdropPress = () => {
    if (localExpanded) {
      toggleExpanded();
    }
  };

  const handleCartPress = () => {
    if (localExpanded) {
      toggleExpanded();
    }
    onCartPress();
  };

  const handlePrescriptionPress = () => {
    if (localExpanded) {
      toggleExpanded();
    }
    onPrescriptionPress();
  };

  // Interpolated values for animations
  const rotateInterpolate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const cartButtonTranslateY = cartButtonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -80],
  });

  const prescriptionButtonTranslateY = prescriptionButtonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -160],
  });

  const cartButtonScale = cartButtonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const prescriptionButtonScale = prescriptionButtonAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const cartButtonOpacity = cartButtonAnimation;
  const prescriptionButtonOpacity = prescriptionButtonAnimation;

  return (
    <>
      {/* Backdrop */}
      {localExpanded && (
        <TouchableWithoutFeedback onPress={handleBackdropPress}>
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: backdropOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Main FAB */}
      <View style={styles.container}>
        {/* Cart Orders Button */}
        <Animated.View
          style={[
            styles.subButton,
            styles.cartButton,
            {
              transform: [
                { translateY: cartButtonTranslateY },
                { scale: cartButtonScale },
              ],
              opacity: cartButtonOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.subButtonTouchable}
            onPress={handleCartPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <IconSymbol name="cart" size={20} color="#FFFFFF" weight="medium" />
              {cartItemCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Prescription Orders Button */}
        <Animated.View
          style={[
            styles.subButton,
            styles.prescriptionButton,
            {
              transform: [
                { translateY: prescriptionButtonTranslateY },
                { scale: prescriptionButtonScale },
              ],
              opacity: prescriptionButtonOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.subButtonTouchable}
            onPress={handlePrescriptionPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <IconSymbol name="document-text" size={20} color="#FFFFFF" weight="medium" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Main FAB Button */}
        <Animated.View
          style={[
            styles.mainButton,
            {
              transform: [{ rotate: rotateInterpolate }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.mainButtonTouchable}
            onPress={toggleExpanded}
            activeOpacity={0.8}
          >
            <IconSymbol name="cart" size={24} color="#FFFFFF" weight="medium" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  container: {
    position: 'absolute',
    bottom: 100,
    right: 8, // Further reduced from 12 to 8 to minimize left space
    zIndex: 1000,
    alignItems: 'flex-end',
  },
  mainButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    // backgroundColor: Colors.light.tint, // OLD
    backgroundColor: '#10B981', // Changed to green (emerald-500)
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981', // Changed to match new color
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  mainButtonTouchable: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    alignItems: 'center',
    marginBottom: 16,
    width: 50,
    height: 50,
  },
  subButtonTouchable: {
    width: 50, // Increased width for label
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    flexDirection: 'row', // Align icon and label horizontall
    paddingHorizontal: 10, // Add some padding
  },
  cartButton: {
    backgroundColor: '#3B82F6', // Blue color for cart
    borderRadius: 25,
  },
  prescriptionButton: {
    backgroundColor: '#EF4444', // Red color for prescription
    borderRadius: 25,
  },
  subButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginLeft: 5, // Space between icon and label
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#EF4444',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

