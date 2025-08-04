import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
  ScrollView,
  RefreshControl,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { orderService, Order, OrderFilters, OrderResponse } from '@/services/orderService';
import { Colors } from '@/constants/Colors';

interface OrdersTabProps {
  onRefresh?: () => void;
}

const { width } = Dimensions.get('window');

const OrdersTab: React.FC<OrdersTabProps> = ({ onRefresh }) => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // Memoized status configurations for better performance
  const statusConfig = useMemo(() => ({
    pending: {
      text: 'Pending',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      icon: 'clock-o' as const,
    },
    pending_assignment: {
      text: 'Pending Assignment',
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      icon: 'clock-o' as const,
    },
    confirmed: {
      text: 'Confirmed',
      color: '#3B82F6',
      bgColor: '#DBEAFE',
      icon: 'check-circle' as const,
    },
    out_for_delivery: {
      text: 'Out for Delivery',
      color: '#8B5CF6',
      bgColor: '#EDE9FE',
      icon: 'truck' as const,
    },
    delivered: {
      text: 'Delivered',
      color: '#10B981',
      bgColor: '#D1FAE5',
      icon: 'check-circle' as const,
    },
    cancelled: {
      text: 'Cancelled',
      color: '#EF4444',
      bgColor: '#FEE2E2',
      icon: 'times-circle' as const,
    },
  }), []);

  const fetchOrders = useCallback(async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const filters: OrderFilters = {
        page,
        limit: 8, // Reduced for better performance
      };

      const response: OrderResponse = await orderService.getMyOrders(filters);

      if (isRefresh || page === 1) {
        setOrders(response.orders);
      } else {
        setOrders(prev => [...prev, ...response.orders]);
      }

      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to fetch orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = useCallback(async () => {
    await fetchOrders(1, true);
    onRefresh?.();
  }, [fetchOrders, onRefresh]);

  const handleLoadMore = useCallback(() => {
    if (pagination.hasNextPage && !loading && !loadingMore) {
      fetchOrders(pagination.currentPage + 1);
    }
  }, [pagination.hasNextPage, loading, loadingMore, fetchOrders, pagination.currentPage]);

  const handleAddMoreProducts = useCallback(() => {
    router.push('/medicines');
  }, [router]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }, []);

  const formatPrice = useCallback((price: number) => {
    return `₹${price.toFixed(2)}`;
  }, []);

  const getStatusConfig = useCallback((status: string) => {
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  }, [statusConfig]);

  // --- UI/UX Improvements: Order Card ---
  const renderOrderItem = useCallback(({ item: order }: { item: Order }) => {
    const status = getStatusConfig(order.status);
    const orderId = order._id.slice(-6).toUpperCase();

    return (
      <TouchableOpacity
        activeOpacity={0.93}
        onPress={() => {
          setSelectedOrder(order);
          setShowOrderDetails(true);
        }}
        className="mx-4 mb-5"
        style={{
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View className="bg-white rounded-3xl p-5 border border-gray-100">
          {/* Order Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <FontAwesome name="shopping-bag" size={18} color="#3B82F6" />
              <Text className="text-base text-gray-700 ml-2 font-semibold tracking-wider">
                #{orderId}
              </Text>
            </View>
            <View
              className="px-3 py-1.5 rounded-full flex-row items-center"
              style={{
                backgroundColor: status.bgColor,
                minWidth: 90,
                justifyContent: 'center',
              }}
            >
              <FontAwesome name={status.icon} size={13} color={status.color} />
              <Text
                className="text-xs font-bold ml-2"
                style={{ color: status.color }}
              >
                {status.text}
              </Text>
            </View>
          </View>

          {/* Order Type & Date */}
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-medium text-gray-500">
              {order.prescription ? 'Prescription Order' : 'Product Order'}
            </Text>
            <View className="flex-row items-center">
              <FontAwesome name="calendar" size={13} color="#3B82F6" />
              <Text className="text-xs text-gray-400 ml-1 font-medium">
                {formatDate(order.createdAt)}
              </Text>
            </View>
          </View>

          {/* Products Section */}
          {order.products && order.products.length > 0 && (
            <View className="bg-gray-50 rounded-xl p-3 mb-2">
              <View className="flex-row items-center mb-1">
                <FontAwesome name="shopping-bag" size={13} color="#3B82F6" />
                <Text className="text-sm font-semibold text-gray-700 ml-2">
                  {order.products.length} product{order.products.length > 1 ? 's' : ''}
                </Text>
              </View>
              {order.products.slice(0, 2).map((item, index) => (
                <View
                  key={`${item.product._id}-${item.quantity}-${index}`}
                  className="flex-row justify-between items-center py-1"
                >
                  <Text className="text-sm text-gray-600 flex-1 font-medium" numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-xs text-gray-500 mr-2">
                      x{item.quantity}
                    </Text>
                    <Text className="text-sm font-bold text-gray-900">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
              {order.products.length > 2 && (
                <Text className="text-xs text-blue-500 mt-1 font-medium">
                  +{order.products.length - 2} more item{order.products.length - 2 > 1 ? 's' : ''}
                </Text>
              )}
            </View>
          )}

          {/* Prescription Section */}
          {order.prescription && (
            <View className="bg-blue-50 rounded-xl p-3 flex-row items-center mb-2">
              <FontAwesome name="file-text" size={15} color="#3B82F6" />
              <Text className="text-sm font-semibold text-blue-700 ml-2">
                Prescription Uploaded
              </Text>
            </View>
          )}

          {/* Order Summary */}
          <View className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-1">
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <FontAwesome
                  name={order.isPaid ? "check-circle" : "clock-o"}
                  size={14}
                  color={order.isPaid ? "#10B981" : "#F59E0B"}
                />
                <Text
                  className={`text-sm ml-2 font-semibold ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}
                >
                  {order.isPaid ? 'Paid' : 'Payment Pending'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-base font-bold text-gray-900 mr-2">
                  Total:
                </Text>
                <Text className="text-lg font-bold text-blue-600">
                  {formatPrice(order.totalPrice)}
                </Text>
              </View>
            </View>
          </View>

          {/* Order Actions */}
          <View className="flex-row justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <TouchableOpacity
              onPress={() => {
                setSelectedOrder(order);
                setShowOrderDetails(true);
              }}
              className="flex-1 bg-blue-600 py-3 rounded-xl mr-2 flex-row justify-center items-center"
              activeOpacity={0.85}
              style={{
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <FontAwesome name="eye" size={15} color="white" />
              <Text className="text-white font-semibold ml-2">View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAddMoreProducts}
              className="flex-1 bg-gray-100 py-3 rounded-xl ml-2 flex-row justify-center items-center"
              activeOpacity={0.85}
            >
              <FontAwesome name="plus" size={15} color="#3B82F6" />
              <Text className="text-gray-700 font-semibold ml-2">Add More</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [getStatusConfig, formatDate, formatPrice, router, handleAddMoreProducts]);

  // --- UI/UX Improvements: Empty State ---
  const renderEmptyState = useCallback(() => (
    <View className="flex-1 justify-center items-center py-20 px-8">
      <View
        className="rounded-full mb-6"
        style={{
          backgroundColor: '#E0E7FF',
          padding: 32,
          shadowColor: '#6366F1',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <FontAwesome name="shopping-cart" size={54} color="#6366F1" />
      </View>
      <Text className="text-2xl font-extrabold text-gray-900 mb-2 text-center">
        No Orders Yet
      </Text>
      <Text className="text-gray-600 text-center mb-8 leading-6">
        Start your health journey by exploring our wide range of medicines and health products.
      </Text>
      <TouchableOpacity
        onPress={handleAddMoreProducts}
        className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 rounded-2xl shadow-lg"
        activeOpacity={0.9}
        style={{
          shadowColor: '#6366F1',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 3,
        }}
      >
        <View className="flex-row items-center">
          <FontAwesome name="shopping-bag" size={20} color="white" />
          <Text className="text-white font-bold text-lg ml-3">Browse Products</Text>
        </View>
      </TouchableOpacity>
    </View>
  ), [handleAddMoreProducts]);

  // --- UI/UX Improvements: Load More Button ---
  const renderLoadMore = useCallback(() => {
    if (!pagination.hasNextPage) return null;

    return (
      <View className="py-6">
        <TouchableOpacity
          onPress={handleLoadMore}
          disabled={loadingMore}
          className="bg-gray-100 py-4 rounded-2xl items-center mx-4"
          activeOpacity={0.85}
        >
          {loadingMore ? (
            <View className="flex-row items-center">
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text className="text-gray-700 font-medium ml-2">Loading...</Text>
            </View>
          ) : (
            <View className="flex-row items-center">
              <FontAwesome name="chevron-down" size={18} color="#3B82F6" />
              <Text className="text-gray-700 font-semibold ml-2">Load More Orders</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  }, [pagination.hasNextPage, loadingMore, handleLoadMore]);

  // --- UI/UX Improvements: Loading State ---
  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <View
          className="rounded-full mb-4"
          style={{
            backgroundColor: '#E0E7FF',
            padding: 28,
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 3,
          }}
        >
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
        <Text className="text-gray-600 font-medium">Loading your orders...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32, minHeight: 300 }}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderLoadMore}
        getItemLayout={(data, index) => ({
          length: 320,
          offset: 320 * index,
          index,
        })}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={Platform.OS === 'android' ? ['#3B82F6'] : undefined}
          />
        }
      />

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <View
          className="absolute inset-0 z-50"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            className="w-full h-full"
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: 'hidden',
              maxHeight: '95%',
              width: '100%',
              shadowColor: '#6366F1',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.18,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <View className="flex-row items-center">
                <FontAwesome name="shopping-bag" size={20} color="#3B82F6" />
                <Text className="text-lg font-bold text-gray-900 ml-2">Order Details</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowOrderDetails(false)}
                className="p-2 bg-gray-200 rounded-full"
                activeOpacity={0.8}
              >
                <FontAwesome name="times" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
              style={{ flex: 1 }}
            >
              <OrderDetailsContent order={selectedOrder} />
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};

// --- UI/UX Improvements: Order Details Content ---
const OrderDetailsContent: React.FC<{ order: Order }> = ({ order }) => {
  const router = useRouter();

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        text: 'Pending',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        icon: 'clock-o' as const,
      },
      pending_assignment: {
        text: 'Pending Assignment',
        color: '#F59E0B',
        bgColor: '#FEF3C7',
        icon: 'clock-o' as const,
      },
      confirmed: {
        text: 'Confirmed',
        color: '#3B82F6',
        bgColor: '#DBEAFE',
        icon: 'check-circle' as const,
      },
      out_for_delivery: {
        text: 'Out for Delivery',
        color: '#8B5CF6',
        bgColor: '#EDE9FE',
        icon: 'truck' as const,
      },
      delivered: {
        text: 'Delivered',
        color: '#10B981',
        bgColor: '#D1FAE5',
        icon: 'check-circle' as const,
      },
      cancelled: {
        text: 'Cancelled',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        icon: 'times-circle' as const,
      },
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

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

  const formatPrice = (price: number) => {
    return `₹${price.toFixed(2)}`;
  };

  const handleAddMoreProducts = () => {
    router.push('/medicines');
  };

  const status = getStatusConfig(order.status);
  const orderId = order._id.slice(-8).toUpperCase();

  return (
    <View className="space-y-5">
      {/* Order Status */}
      <View
        className="rounded-xl p-4 border"
        style={{
          backgroundColor: '#F0F9FF',
          borderColor: '#DBEAFE',
        }}
      >
        <View className="flex-row justify-between items-center mb-3">
          <View>
            <Text className="text-xs text-gray-500 font-medium">Order ID</Text>
            <Text className="text-lg font-bold text-gray-900 tracking-wider">#{orderId}</Text>
          </View>
          <View
            className="px-3 py-2 rounded-full flex-row items-center shadow-sm"
            style={{ backgroundColor: status.bgColor }}
          >
            <FontAwesome name={status.icon} size={15} color={status.color} />
            <Text
              className="text-xs font-bold ml-2"
              style={{ color: status.color }}
            >
              {status.text}
            </Text>
          </View>
        </View>

        <View className="space-y-2">
          <View className="flex-row justify-between items-center bg-white rounded-lg p-3">
            <Text className="text-gray-600 font-medium">Order Type</Text>
            <Text className="font-semibold text-gray-900">
              {order.prescription ? 'Prescription Order' : 'Product Order'}
            </Text>
          </View>

          <View className="flex-row justify-between items-center bg-white rounded-lg p-3">
            <Text className="text-gray-600 font-medium">Payment Status</Text>
            <View className="flex-row items-center">
              <FontAwesome
                name={order.isPaid ? "check-circle" : "clock-o"}
                size={16}
                color={order.isPaid ? "#10B981" : "#F59E0B"}
              />
              <Text
                className={`ml-2 font-semibold ${order.isPaid ? 'text-green-600' : 'text-yellow-600'}`}
              >
                {order.isPaid ? 'Paid' : 'Payment Pending'}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between items-center bg-white rounded-lg p-3">
            <Text className="text-gray-600 font-medium">Order Date</Text>
            <Text className="font-semibold text-gray-900 text-right">
              {formatDate(order.createdAt)}
            </Text>
          </View>
        </View>
      </View>

      {/* Products */}
      {order.products && order.products.length > 0 && (
        <View className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
          <View className="flex-row items-center mb-4">
            <View className="bg-blue-100 rounded-lg p-2 mr-3">
              <FontAwesome name="shopping-bag" size={16} color="#3B82F6" />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900">
                Products
              </Text>
              <Text className="text-sm text-gray-500">
                {order.products.length} item{order.products.length > 1 ? 's' : ''}
              </Text>
            </View>
          </View>

          <View className="space-y-3">
            {order.products.map((item, index) => (
              <View
                key={`${item.product._id}-${item.quantity}-${index}`}
                className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-100"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-base font-bold text-gray-900 flex-1 mr-3" numberOfLines={1}>
                    {item.product.name}
                  </Text>
                  <View className="bg-blue-600 rounded-lg px-3 py-1">
                    <Text className="text-sm font-bold text-white">
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center bg-white rounded-lg px-3 py-1">
                    <FontAwesome name="cube" size={12} color="#6B7280" />
                    <Text className="text-gray-600 ml-2">Qty:</Text>
                    <Text className="font-bold text-gray-900 ml-1">
                      {item.quantity}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-500 font-medium">
                    ₹{item.product.price.toFixed(2)} each
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Prescription */}
      {order.prescription && (
        <View className="bg-white rounded-xl p-4 border border-gray-100">
          <View className="flex-row items-center mb-3">
            <FontAwesome name="file-text" size={16} color="#3B82F6" />
            <Text className="text-lg font-bold text-gray-900 ml-2">
              Prescription
            </Text>
          </View>

          <View className="bg-blue-50 rounded-lg p-3">
            <Text className="text-blue-700 font-medium">
              Prescription has been uploaded and is being processed.
            </Text>
          </View>
        </View>
      )}

      {/* Order Summary */}
      <View
        className="rounded-xl p-4 border"
        style={{
          backgroundColor: '#F0FDF4',
          borderColor: '#BBF7D0',
        }}
      >
        <View className="flex-row items-center mb-4">
          <View className="bg-green-100 rounded-lg p-2 mr-3">
            <FontAwesome name="calculator" size={16} color="#10B981" />
          </View>
          <Text className="text-lg font-bold text-gray-900">Order Summary</Text>
        </View>

        <View className="space-y-2">
          <View className="flex-row justify-between items-center bg-white rounded-lg p-3">
            <Text className="text-gray-600 font-medium">Subtotal</Text>
            <Text className="font-semibold text-gray-900">
              {formatPrice(order.totalPrice)}
            </Text>
          </View>

          <View className="flex-row justify-between items-center bg-white rounded-lg p-3">
            <Text className="text-gray-600 font-medium">Delivery Fee</Text>
            <Text className="font-semibold text-green-600">FREE</Text>
          </View>

          <View className="bg-white rounded-lg p-4 border-2 border-green-200">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-bold text-gray-900">Total Amount</Text>
              <Text className="text-xl font-bold text-green-600">
                {formatPrice(order.totalPrice)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="space-y-3 pt-2">
        <TouchableOpacity
          onPress={handleAddMoreProducts}
          activeOpacity={0.92}
          style={{
            backgroundColor: '#fff',
            borderWidth: 2,
            borderColor: '#6366F1',
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#6366F1',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.13,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <View
            style={{
              backgroundColor: '#6366F1',
              borderRadius: 999,
              padding: 8,
              marginRight: 12,
            }}
          >
            <FontAwesome name="plus" size={18} color="#fff" />
          </View>
          <Text
            style={{
              color: '#3730A3',
              fontWeight: 'bold',
              fontSize: 18,
              letterSpacing: 0.5,
            }}
          >
            Add More Products
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OrdersTab;