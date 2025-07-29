import { View, FlatList, ActivityIndicator, TouchableOpacity, Text, Modal, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProductCard } from './medicines/ProductCard';
import SearchBox from './SearchBox';
import ProductFilters from './filters/ProductFilters';
import { Ionicons } from '@expo/vector-icons';
import { useProductStore } from '../store/productStore';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  availableQuantity: number;
  imageUrl?: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProductList() {
  const insets = useSafeAreaInsets();
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    products, 
    pagination,
    isLoading,
    isLoadingMore,
    error,
    fetchProducts,
    refreshProducts,
    loadMore,
    setFilters,
    filters
  } = useProductStore();

  useEffect(() => {
    console.log('ProductList - Component mounted, fetching products...');
    // Always fetch products on mount to ensure we have the latest data
    fetchProducts();
  }, []); // Remove fetchProducts from dependency array to prevent infinite loops

  useEffect(() => {
    console.log('ProductList - Products state changed:', {
      productsCount: products.length,
      isLoading,
      error,
      pagination,
      filters
    });
  }, [products, isLoading, error, pagination, filters]);

  const handleSearch = (query: string) => {
    console.log('ProductList - Search query:', query);
    setFilters({ search: query, page: 1 });
    fetchProducts({ search: query, page: 1 });
  };
  
  const handleApplyFilters = () => {
    console.log('ProductList - Applying filters');
    fetchProducts();
    setShowFilters(false);
  };
  
  const hasActiveFilters = () => {
    return !!(
      filters.minPrice || 
      filters.maxPrice ||
      filters.search
    );
  };

  const handleRefresh = () => {
    console.log('ProductList - Refreshing products');
    refreshProducts();
  };

  const handleLoadMore = () => {
    if (pagination.hasNextPage && !isLoading && !isLoadingMore) {
      console.log('ProductList - Loading more products');
      loadMore();
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" />
      </View>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <ActivityIndicator size="large" color="#1890ff" />
          <Text className="mt-4 text-lg font-semibold text-gray-600">Loading medicines...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text className="mt-4 text-lg font-semibold text-gray-600">Something went wrong</Text>
          <Text className="mt-2 text-gray-500 text-center px-8">
            {error}
          </Text>
          <TouchableOpacity 
            onPress={handleRefresh}
            className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (hasActiveFilters()) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <Ionicons name="search-outline" size={48} color="#ccc" />
          <Text className="mt-4 text-lg font-semibold text-gray-600">No medicines found</Text>
          <Text className="mt-2 text-gray-500 text-center px-8">
            Try adjusting your search or filters to find what you&apos;re looking for
          </Text>
          <TouchableOpacity 
            onPress={() => {
              setFilters({ page: 1, limit: 10 });
              fetchProducts({ page: 1, limit: 10 });
            }}
            className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Clear Filters</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="flex-1 justify-center items-center py-20">
        <Ionicons name="medical-outline" size={48} color="#ccc" />
        <Text className="mt-4 text-lg font-semibold text-gray-600">No medicines available</Text>
        <Text className="mt-2 text-gray-500 text-center px-8">
          Check back later for new medicines
        </Text>
      </View>
    );
  };

  console.log('ProductList - Rendering with:', {
    productsCount: products.length,
    isLoading,
    error,
    hasProducts: products.length > 0
  });

  return (
    <View 
      className="flex-1"
      style={{
        paddingBottom: insets.bottom + 16 // Increased padding for FAB and bottom nav
      }}
    >
      <View className="px-4 py-2 flex-row items-center justify-between">
        <View className="flex-1">
          <SearchBox 
            onSearch={handleSearch}
            placeholder="Search medicines..."
          />
        </View>
        <TouchableOpacity 
          onPress={() => setShowFilters(true)}
          className="ml-2 p-2 rounded-full bg-gray-100 flex-row items-center"
          style={hasActiveFilters() ? { backgroundColor: '#e6f7ff' } : {}}
        >
          <Ionicons 
            name="options-outline" 
            size={20} 
            color={hasActiveFilters() ? '#1890ff' : '#666'} 
          />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ProductCard product={item} />}
        numColumns={2}
        columnWrapperStyle={{ 
          justifyContent: 'space-between', 
          paddingHorizontal: 16,
          marginBottom: 12 // Increased margin between rows
        }}
        contentContainerStyle={{ 
          paddingTop: 8,
          paddingBottom: 80, // Further increased bottom padding
          flexGrow: 1
        }}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            colors={['#1890ff']}
            tintColor="#1890ff"
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <ProductFilters 
          onApply={handleApplyFilters}
          onCancel={() => setShowFilters(false)}
        />
      </Modal>
    </View>
  );
} 