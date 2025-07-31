import { View } from 'react-native';
import ProductList from '@/components/ProductList';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FloatingActionButton } from '@/components/medicines/FloatingActionButton';
import { CartModal } from '@/components/medicines/CartModal';
import { PrescriptionUploadModal } from '@/components/medicines/PrescriptionUploadModal';
import { useState } from 'react';

export default function MedicinesScreen() {
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);

  const handleCartPress = () => {
    setCartModalVisible(true);
  };

  const handlePrescriptionPress = () => {
    setPrescriptionModalVisible(true);
  };

  const handleOrderSuccess = () => {
    // Refresh the product list or show success message
    console.log('Order created successfully');
  };

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="flex-1">
        <ProductList />
        
        {/* Floating Action Button */}
        <FloatingActionButton
          onCartPress={handleCartPress}
          onPrescriptionPress={handlePrescriptionPress}
        />

        {/* Cart Modal */}
        <CartModal
          visible={cartModalVisible}
          onClose={() => setCartModalVisible(false)}
          onBrowseItems={() => {
            setCartModalVisible(false);
            // The user is already on the medicines tab, so just close the modal
          }}
        />

        {/* Prescription Upload Modal */}
        <PrescriptionUploadModal
          visible={prescriptionModalVisible}
          onClose={() => setPrescriptionModalVisible(false)}
          onSuccess={handleOrderSuccess}
        />
      </SafeAreaView>
    </View>
  );
}

