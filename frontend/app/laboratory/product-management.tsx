import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { AddProductTab } from '@/components/laboratory/AddProductTab';
import { OrderManagementTab } from '@/components/laboratory/OrderManagementTab';
import { MyProductsTab } from '@/components/laboratory/MyProductsTab';
import { Colors } from '@/constants/Colors';

type TabType = 'add-product' | 'my-products' | 'orders';

export default function ProductManagementScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('my-products');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'add-product':
        return <AddProductTab />;
      case 'my-products':
        return <MyProductsTab />;
      case 'orders':
        return <OrderManagementTab />;
      default:
        return <MyProductsTab />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.light.background} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={Colors.light.text} weight="medium" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Management</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my-products' && styles.activeTab]}
          onPress={() => setActiveTab('my-products')}
        >
          <Text style={[styles.tabText, activeTab === 'my-products' && styles.activeTabText]}>
            My Products
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'add-product' && styles.activeTab]}
          onPress={() => setActiveTab('add-product')}
        >
          <Text style={[styles.tabText, activeTab === 'add-product' && styles.activeTabText]}>
            Add Product
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
          onPress={() => setActiveTab('orders')}
        >
          <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
            Orders
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  placeholder: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.light.tint,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.icon,
  },
  activeTabText: {
    color: Colors.light.tint,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});