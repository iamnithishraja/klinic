import { View, FlatList, ActivityIndicator, TouchableOpacity, Text, Modal, RefreshControl, StyleSheet, Platform } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const flatListRef = useRef<FlatList>(null);

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

  // Memoize the fetch function to prevent infinite loops
  const fetchProductsCallback = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchProductsCallback();
  }, [fetchProductsCallback]);

  useEffect(() => {
    // Optionally, you can add analytics or logging here
  }, [products, isLoading, error, pagination, filters]);

  const handleSearch = useCallback((query: string) => {
    setFilters({ search: query, page: 1 });
    fetchProducts({ search: query, page: 1 });
  }, [setFilters, fetchProducts]);
  
  const handleApplyFilters = useCallback(() => {
    fetchProducts();
    setShowFilters(false);
  }, [fetchProducts, setShowFilters]);
  
  const hasActiveFilters = useCallback(() => {
    return !!(
      filters.minPrice || 
      filters.maxPrice ||
      filters.search
    );
  }, [filters.minPrice, filters.maxPrice, filters.search]);

  const handleRefresh = useCallback(() => {
    refreshProducts();
  }, [refreshProducts]);

  const handleLoadMore = useCallback(() => {
    if (pagination.hasNextPage && !isLoading && !isLoadingMore) {
      loadMore();
    }
  }, [pagination.hasNextPage, isLoading, isLoadingMore, loadMore]);

  const renderFooter = useCallback(() => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoading}>
        <ActivityIndicator size="small" color="#1890ff" />
      </View>
    );
  }, [isLoadingMore]);

  const renderEmptyState = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyStateContainer}>
          <ActivityIndicator size="large" color="#1890ff" />
          <Text style={styles.emptyStateText}>Loading products...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <Text style={styles.errorTitle}>Error Loading Products</Text>
          <Text style={styles.errorMessage}>
            {error}
          </Text>
          <TouchableOpacity 
            style={styles.tryAgainButton}
            onPress={handleRefresh}
            activeOpacity={0.8}
          >
            <Text style={styles.tryAgainButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="medical-outline" size={48} color="#9ca3af" />
        <Text style={styles.emptyStateTitle}>No Products Found</Text>
        <Text style={styles.emptyStateSubtitle}>
          {hasActiveFilters() 
            ? "Try adjusting your filters or search terms"
            : "Products will appear here when they become available"
          }
        </Text>
      </View>
    );
  }, [isLoading, error, hasActiveFilters, handleRefresh]);

  const renderProduct = useCallback(({ item }: { item: Product }) => (
    <ProductCard product={item} />
  ), []);

  const keyExtractor = useCallback((item: Product) => item._id, []);

  // Scroll to top button logic
  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(offsetY > 300);
  };

  const handleScrollToTop = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header with Search and Filters */}
      <View style={styles.header}>
        <SearchBox 
          onSearch={handleSearch} 
          placeholder="Search medicines..." 
        />
        
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              hasActiveFilters() && styles.filterButtonActive
            ]}
            onPress={() => setShowFilters(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="filter-outline" size={18} color={hasActiveFilters() ? "#2563eb" : "#6b7280"} />
            <Text style={[
              styles.filterButtonText,
              hasActiveFilters() && styles.filterButtonTextActive
            ]}>
              Filters
            </Text>
            {hasActiveFilters() && (
              <View style={styles.activeDot} />
            )}
          </TouchableOpacity>
          
          <Text style={styles.productCount}>
            {products.length} product{products.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Product List */}
      <FlatList
        ref={flatListRef}
        data={products}
        renderItem={renderProduct}
        keyExtractor={keyExtractor}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={[
          styles.listContent,
          products.length === 0 && { flex: 1 }
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && !isLoadingMore}
            onRefresh={handleRefresh}
            colors={['#1890ff']}
            tintColor="#1890ff"
          />
        }
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <TouchableOpacity
          style={styles.scrollToTopButton}
          onPress={handleScrollToTop}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-up" size={22} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType={Platform.OS === 'ios' ? "slide" : "fade"}
        presentationStyle={Platform.OS === 'ios' ? "pageSheet" : "overFullScreen"}
        onRequestClose={() => setShowFilters(false)}
        transparent={Platform.OS !== 'ios'}
      >
        <View style={Platform.OS !== 'ios' ? styles.modalOverlay : undefined}>
          <View style={styles.modalContent}>
            <ProductFilters
              onApply={handleApplyFilters}
              onCancel={() => setShowFilters(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
    zIndex: 2,
  },
  searchBox: {
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 80,
  },
  filterButtonActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563eb',
  },
  filterButtonText: {
    color: '#6b7280',
    marginLeft: 6,
    fontSize: 15,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  activeDot: {
    backgroundColor: '#2563eb',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  productCount: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },
  columnWrapper: {
    paddingHorizontal: 12,
    justifyContent: 'space-between',
  },
  listContent: {
    paddingVertical: 18,
    paddingBottom: 40,
    minHeight: 200,
  },
  footerLoading: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    color: '#6b7280',
    marginTop: 18,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyStateTitle: {
    color: '#6b7280',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 18,
  },
  emptyStateSubtitle: {
    color: '#9ca3af',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 15,
    paddingHorizontal: 8,
  },
  errorTitle: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 18,
  },
  errorMessage: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 15,
    paddingHorizontal: 8,
  },
  tryAgainButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 18,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tryAgainButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  scrollToTopButton: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#2563eb',
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30,41,59,0.18)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 24,
    paddingTop: 8,
    minHeight: 320,
    maxHeight: '90%',
    ...Platform.select({
      android: {
        elevation: 12,
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      }
    }),
  },
});