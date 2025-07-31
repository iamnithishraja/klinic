import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Modal,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { productService, Product } from '@/services/productService';
import { FontAwesome } from '@expo/vector-icons';
import { EditProductModal } from './EditProductModal';
import apiClient from '@/api/client';

interface ProductDetailsModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ visible, product, onClose }) => {
  if (!product) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { height: '100%', width: '100%' }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <FontAwesome name="shopping-bag" size={18} color="#3B82F6" />
              <Text style={styles.modalTitle}>Product Details</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <FontAwesome name="times" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={true}>
            {/* Product Image */}
            <View style={styles.imageContainer}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
              ) : (
                <View style={styles.noImageContainer}>
                  <FontAwesome name="image" size={48} color="#9CA3AF" />
                  <Text style={styles.noImageText}>No Image</Text>
                </View>
              )}
            </View>

            {/* Product Info */}
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.productDescription}>{product.description}</Text>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Price</Text>
                  <Text style={styles.infoValue}>₹{product.price.toFixed(2)}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Available Quantity</Text>
                  <Text style={styles.infoValue}>{product.availableQuantity}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Created</Text>
                  <Text style={styles.infoValue}>{formatDate(product.createdAt)}</Text>
                </View>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Last Updated</Text>
                  <Text style={styles.infoValue}>{formatDate(product.updatedAt)}</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export const MyProductsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quantity' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchMyProducts();
  }, []);

  const fetchMyProducts = useCallback(async () => {
    try {
      console.log('MyProductsTab: Starting to fetch products...');
      setLoading(true);
      
      const response = await apiClient.get('/api/v1/products/my-products');
      console.log('MyProductsTab: API Response:', response.data);
      
      if (response.data.success && response.data.data) {
        const products = response.data.data.products || [];
        console.log('MyProductsTab: Products fetched successfully:', products);
        console.log('MyProductsTab: Number of products:', products.length);
        setProducts(products);
      } else {
        console.warn('MyProductsTab: No products found in response');
        console.warn('MyProductsTab: Response structure:', response.data);
        setProducts([]);
      }
    } catch (error: any) {
      console.error('MyProductsTab: Error fetching products:', error);
      console.error('MyProductsTab: Error response:', error.response?.data);
      console.error('MyProductsTab: Error status:', error.response?.status);
      console.error('MyProductsTab: Error message:', error.message);
      Alert.alert('Error', 'Failed to fetch your products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyProducts();
    setRefreshing(false);
  }, [fetchMyProducts]);

  const handleEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setShowEditModal(true);
  }, []);

  const handleDeleteProduct = useCallback((product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteProduct(product._id)
        }
      ]
    );
  }, []);

  const confirmDeleteProduct = useCallback(async (productId: string) => {
    try {
      setDeletingProduct(productId);
      await productService.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p._id !== productId));
      Alert.alert('Success', 'Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', 'Failed to delete product');
    } finally {
      setDeletingProduct(null);
    }
  }, []);

  const handleViewDetails = useCallback((product: Product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
  }, []);

  const filteredAndSortedProducts = useCallback(() => {
    let filtered = products;
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Sort products
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'quantity':
          aValue = a.availableQuantity;
          bValue = b.availableQuantity;
          break;
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  }, [products, searchQuery, sortBy, sortOrder]);

  const renderProductCard = useCallback(({ item: product }: { item: Product }) => (
    <View key={product._id} style={styles.productCard}>
      <TouchableOpacity
        style={styles.productContent}
        onPress={() => handleViewDetails(product)}
        activeOpacity={0.7}
      >
      <View style={styles.productImageContainer}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
        ) : (
          <View style={styles.noImageContainer}>
              <FontAwesome name="image" size={24} color="#9CA3AF" />
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {product.description}
        </Text>
        <View style={styles.productDetails}>
            <Text style={styles.productPrice}>₹{product.price.toFixed(2)}</Text>
            <View style={styles.quantityContainer}>
              <FontAwesome name="cube" size={12} color="#6B7280" />
          <Text style={styles.productQuantity}>
                {product.availableQuantity} left
          </Text>
        </View>
      </View>
        </View>
      </TouchableOpacity>

      <View style={styles.productActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEditProduct(product)}
        >
          <FontAwesome name="edit" size={16} color="#FFFFFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteProduct(product)}
          disabled={deletingProduct === product._id}
        >
          {deletingProduct === product._id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <FontAwesome name="trash" size={16} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  ), [handleViewDetails, handleEditProduct, handleDeleteProduct, deletingProduct]);

  const renderHeader = useCallback(() => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>My Products</Text>
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {products.length} product{products.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <FontAwesome name="search" size={16} color="#6B7280" />
          <Text style={styles.searchPlaceholder}>
            {searchQuery ? searchQuery : 'Search products...'}
          </Text>
        </View>
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <FontAwesome name="times" size={16} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'date' && styles.activeSortChip]}
            onPress={() => setSortBy('date')}
          >
            <Text style={[styles.sortChipText, sortBy === 'date' && styles.activeSortChipText]}>
              Date
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'name' && styles.activeSortChip]}
            onPress={() => setSortBy('name')}
          >
            <Text style={[styles.sortChipText, sortBy === 'name' && styles.activeSortChipText]}>
              Name
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'price' && styles.activeSortChip]}
            onPress={() => setSortBy('price')}
          >
            <Text style={[styles.sortChipText, sortBy === 'price' && styles.activeSortChipText]}>
              Price
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortChip, sortBy === 'quantity' && styles.activeSortChip]}
            onPress={() => setSortBy('quantity')}
          >
            <Text style={[styles.sortChipText, sortBy === 'quantity' && styles.activeSortChipText]}>
              Quantity
            </Text>
          </TouchableOpacity>
        </ScrollView>
        
        <TouchableOpacity
          style={styles.sortOrderButton}
          onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
        >
          <FontAwesome 
            name={sortOrder === 'asc' ? 'sort-up' : 'sort-down'} 
            size={16} 
            color={Colors.light.tint} 
          />
        </TouchableOpacity>
      </View>
    </View>
  ), [products.length, searchQuery, sortBy, sortOrder]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyContainer}>
      <FontAwesome name="shopping-cart" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No Products Found' : 'No Products Yet'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'Start by adding your first product in the "Add Product" tab'
        }
      </Text>
    </View>
  ), [searchQuery]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading your products...</Text>
      </View>
    );
  }

  const displayProducts = filteredAndSortedProducts();

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <FlatList
        data={displayProducts}
        renderItem={renderProductCard}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.productsList}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={() => 
          displayProducts.length > 0 ? (
            <View style={styles.listFooter}>
              <Text style={styles.footerText}>
                Showing {displayProducts.length} of {products.length} products
        </Text>
      </View>
          ) : null
        }
      />

      {/* Edit Product Modal */}
      <EditProductModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        onProductUpdated={() => {
          fetchMyProducts();
          setShowEditModal(false);
          setEditingProduct(null);
        }}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        visible={showDetailsModal}
        product={selectedProduct}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedProduct(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  header: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  statsContainer: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchPlaceholder: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  clearButton: {
    padding: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  activeSortChip: {
    backgroundColor: Colors.light.tint,
  },
  sortChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeSortChipText: {
    color: '#FFFFFF',
  },
  sortOrderButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  productsList: {
    padding: 16,
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  productContent: {
    flexDirection: 'row',
    padding: 16,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 16,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  productDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  productDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.tint,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productQuantity: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  productActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 48,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  listFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  modalBody: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  productImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  noImageContainer: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
  },
  productInfo: {
    gap: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    textAlign: 'center',
  },
  productDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
}); 