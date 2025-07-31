import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useDeliveryStore, DeliveryOrder } from '@/store/deliveryStore';
import DeliveryOrderCard from './DeliveryOrderCard';

const DeliveryOrderList: React.FC = () => {
  const { 
    orders, 
    pagination, 
    isLoading, 
    error,
    fetchDeliveryOrders, 
    setFilters 
  } = useDeliveryStore();

  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Debug logging
  console.log('DeliveryOrderList render:', {
    ordersCount: orders.length,
    isLoading,
    error,
    selectedStatus,
    pagination
  });

  const handleStatusFilter = useCallback((status: string | null) => {
    setSelectedStatus(status);
    setFilters({ status: status || undefined, page: 1 });
    fetchDeliveryOrders({ status: status || undefined, page: 1 }, true);
  }, [setFilters, fetchDeliveryOrders]);

  const handleLoadMore = useCallback(() => {
    if (pagination.hasNextPage && !isLoading) {
      const nextPage = pagination.currentPage + 1;
      setFilters({ page: nextPage });
      fetchDeliveryOrders({ page: nextPage });
    }
  }, [pagination, isLoading, setFilters, fetchDeliveryOrders]);

  // Auto-refresh orders every 10 seconds for better responsiveness
  useEffect(() => {
    // Removed auto-refresh functionality
  }, [fetchDeliveryOrders, selectedStatus]);

  const getStatusCount = (status: string) => {
    return orders.filter(order => order.status === status).length;
  };

  const renderStatusFilter = (status: string, label: string, icon: string, color: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.statusFilter,
        selectedStatus === status && { backgroundColor: color }
      ]}
      onPress={() => handleStatusFilter(selectedStatus === status ? null : status)}
    >
      <View style={styles.statusFilterContent}>
        <FontAwesome 
          name={icon as any} 
          size={14} 
          color={selectedStatus === status ? 'white' : Colors.light.text} 
        />
        <Text style={[
          styles.statusFilterText,
          selectedStatus === status && styles.activeStatusFilterText
        ]}>
          {label}
        </Text>
        {count > 0 && (
          <View style={[styles.statusCount, { backgroundColor: selectedStatus === status ? 'white' : color }]}>
            <Text style={[styles.statusCountText, { color: selectedStatus === status ? color : 'white' }]}>
              {count}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderOrderItem = useCallback(({ item }: { item: DeliveryOrder }) => (
    <DeliveryOrderCard order={item} />
  ), []);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <FontAwesome name="inbox" size={48} color={Colors.light.icon} />
      <Text style={styles.emptyStateText}>
        {error ? 'Error loading orders' : selectedStatus ? `No ${selectedStatus} orders found` : 'No orders assigned yet'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {isLoading ? 'Loading orders...' : error ? error : 'Orders will appear here when assigned'}
      </Text>
      {error && (
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchDeliveryOrders()}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!pagination.hasNextPage) return null;
    
    return (
      <View style={styles.loadMoreContainer}>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.light.tint} />
        ) : (
          <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreButton}>
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity 
        style={styles.quickActionButton}
        onPress={() => handleStatusFilter(null)}
      >
        <FontAwesome name="list" size={16} color={Colors.light.tint} />
        <Text style={styles.quickActionText}>All ({orders.length})</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.quickActionButton}
        onPress={() => handleStatusFilter('assigned_to_delivery')}
      >
        <FontAwesome name="clock-o" size={16} color="#F59E0B" />
        <Text style={styles.quickActionText}>New ({getStatusCount('assigned_to_delivery')})</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.quickActionButton}
        onPress={() => handleStatusFilter('out_for_delivery')}
      >
        <FontAwesome name="truck" size={16} color="#3B82F6" />
        <Text style={styles.quickActionText}>In Transit ({getStatusCount('out_for_delivery')})</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Quick Actions */}
      {orders.length > 0 && renderQuickActions()}

      {/* Status Filters */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderStatusFilter('assigned_to_delivery', 'Assigned', 'clock-o', '#F59E0B', getStatusCount('assigned_to_delivery'))}
          {renderStatusFilter('delivery_accepted', 'Accepted', 'check-circle', '#10B981', getStatusCount('delivery_accepted'))}
          {renderStatusFilter('out_for_delivery', 'In Transit', 'truck', '#3B82F6', getStatusCount('out_for_delivery'))}
          {renderStatusFilter('delivered', 'Delivered', 'check', '#059669', getStatusCount('delivered'))}
          {renderStatusFilter('delivery_rejected', 'Rejected', 'times-circle', '#EF4444', getStatusCount('delivery_rejected'))}
        </ScrollView>
      </View>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 6,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    marginBottom: 8,
  },
  statusFilter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  statusFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusFilterText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.text,
  },
  activeStatusFilterText: {
    color: 'white',
  },
  statusCount: {
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  statusCountText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.light.tint,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default DeliveryOrderList; 