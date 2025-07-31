import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useDeliveryStore } from '@/store/deliveryStore';
import DeliveryOrderList from './DeliveryOrderList';
import DeliveryStats from './DeliveryStats';

export const DeliveryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'stats'>('orders');
  const [refreshing, setRefreshing] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);
  const [lastCompletedCount, setLastCompletedCount] = useState(0);
  
  const { 
    fetchDeliveryOrders, 
    fetchDeliveryStats, 
    isLoading, 
    stats,
    orders 
  } = useDeliveryStore();

  useEffect(() => {
    console.log('DeliveryDashboard: Fetching orders and stats');
    fetchDeliveryOrders();
    fetchDeliveryStats();
  }, [fetchDeliveryOrders, fetchDeliveryStats]);

  // Auto-switch to stats tab when orders are completed
  useEffect(() => {
    if (stats) {
      setLastCompletedCount(stats.completedOrders);
    }
  }, [stats, lastCompletedCount]);

  // Auto-switch to orders tab when new orders arrive
  useEffect(() => {
    setLastOrderCount(orders.length);
  }, [orders.length, lastOrderCount]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      console.log('Manual refresh triggered');
      const [_, statsImproved] = await Promise.all([
        fetchDeliveryOrders(undefined, true),
        fetchDeliveryStats()
      ]);
      
      console.log('Refresh completed, stats improved:', statsImproved);
      
      if (statsImproved) {
        // Show success notification
        Alert.alert(
          'Stats Updated! 📈',
          'Your delivery statistics have been updated with new data.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Refresh error:', error);
      Alert.alert(
        'Refresh Error',
        'Failed to refresh data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickAction = () => {
    const newOrders = orders.filter(order => order.status === 'assigned_to_delivery').length;
    const pendingOrders = orders.filter(order => 
      order.status === 'delivery_accepted' || order.status === 'out_for_delivery'
    ).length;

    if (newOrders > 0) {
      Alert.alert(
        'Quick Action',
        `You have ${newOrders} new order${newOrders > 1 ? 's' : ''} to accept. Would you like to view them?`,
        [
          { text: 'Later', style: 'cancel' },
          { 
            text: 'View New Orders', 
            onPress: () => {
              setActiveTab('orders');
              // You could also trigger a filter here
            }
          }
        ]
      );
    } else if (pendingOrders > 0) {
      Alert.alert(
        'Quick Action',
        `You have ${pendingOrders} order${pendingOrders > 1 ? 's' : ''} in progress. Would you like to continue?`,
        [
          { text: 'Later', style: 'cancel' },
          { 
            text: 'View Orders', 
            onPress: () => setActiveTab('orders')
          }
        ]
      );
         } else {
       Alert.alert(
         'All Caught Up! 🎉',
         'You have no pending orders. Great job!',
         [
           { text: 'View Statistics', onPress: () => setActiveTab('stats'), style: 'default' },
           { text: 'OK', style: 'cancel' }
         ]
       );
     }
  };

  const renderTabButton = (tab: 'orders' | 'stats', title: string, icon: string, badge?: number) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTabButton]}
      onPress={() => setActiveTab(tab)}
    >
      <View style={styles.tabContent}>
        <FontAwesome 
          name={icon as any} 
          size={16} 
          color={activeTab === tab ? 'white' : Colors.light.text} 
        />
        <Text style={[styles.tabButtonText, activeTab === tab && styles.activeTabButtonText]}>
          {title}
        </Text>
        {badge && badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const getPendingOrdersCount = () => {
    return orders.filter(order => 
      order.status === 'assigned_to_delivery' || 
      order.status === 'delivery_accepted' || 
      order.status === 'out_for_delivery'
    ).length;
  };

  const getNewOrdersCount = () => {
    return orders.filter(order => order.status === 'assigned_to_delivery').length;
  };

  const getActiveOrdersCount = () => {
    return orders.filter(order => 
      order.status === 'delivery_accepted' || order.status === 'out_for_delivery'
    ).length;
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Delivery Dashboard</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <FontAwesome name="refresh" size={20} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      {/* Simple Status Indicator */}
      <View style={styles.statusIndicator}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Delivery Dashboard Active</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {renderTabButton('orders', 'Orders', 'list')}
        {renderTabButton('stats', 'Statistics', 'bar-chart')}
      </View>

      {/* Content */}
      {activeTab === 'orders' ? (
        <View style={styles.content}>
          <DeliveryOrderList />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <DeliveryStats stats={stats} />
        </ScrollView>
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleQuickAction}
      >
        <FontAwesome name="bolt" size={20} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  refreshButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: 16,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: Colors.light.tint,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  activeTabButtonText: {
    color: 'white',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.text,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.tint,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
});

export default DeliveryDashboard; 