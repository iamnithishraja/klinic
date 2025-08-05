import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useDeliveryStore } from '@/store/deliveryStore';
import DeliveryOrderList from './DeliveryOrderList';
import DeliveryStats from './DeliveryStats';

export const DeliveryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'stats'>('orders');
  const [refreshing, setRefreshing] = useState(false);

  const {
    fetchDeliveryOrders,
    fetchDeliveryStats,
    isLoading,
    stats,
    orders,
  } = useDeliveryStore();

  // Data fetching on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchDeliveryOrders();
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch delivery orders.');
      }
      try {
        await fetchDeliveryStats();
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch delivery stats.');
      }
    };
    fetchData();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refresh handler
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    let statsImproved = false;
    try {
      await Promise.all([
        fetchDeliveryOrders(undefined, true).catch(() => {
          Alert.alert('Refresh Error', 'Failed to refresh orders.');
        }),
        fetchDeliveryStats().then((result) => {
          statsImproved = !!result;
        }).catch(() => {
          Alert.alert('Refresh Error', 'Failed to refresh stats.');
        }),
      ]);
      if (statsImproved) {
        Alert.alert(
          'Stats Updated! 📈',
          'Your delivery statistics have been updated with new data.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Refresh Error',
        'Failed to refresh data. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setRefreshing(false);
    }
  }, [fetchDeliveryOrders, fetchDeliveryStats]);



  const renderTabButton = (
    tab: 'orders' | 'stats',
    title: string,
    icon: string,
    badge?: number
  ) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.activeTabButton,
        // Add shadow and elevation for better appearance
        styles.tabButtonShadow,
      ]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.85}
    >
      <View style={styles.tabContent}>
        <FontAwesome
          name={icon as any}
          size={18}
          color={activeTab === tab ? 'white' : Colors.light.text}
        />
        <Text
          style={[
            styles.tabButtonText,
            activeTab === tab && styles.activeTabButtonText,
          ]}
        >
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

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Delivery Dashboard</Text>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <FontAwesome name="refresh" size={22} color={Colors.light.tint} />
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {renderTabButton(
            'orders',
            'Orders',
            'list',
            orders.filter((o) => o.status === 'assigned_to_delivery').length
          )}
          {renderTabButton('stats', 'Statistics', 'bar-chart')}
        </View>

        {/* Content */}
        <View style={styles.contentWrapper}>
          {activeTab === 'orders' ? (
            <DeliveryOrderList />
          ) : (
            <ScrollView
              style={styles.statsScroll}
              contentContainerStyle={styles.statsContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }
            >
              <DeliveryStats stats={stats} />
            </ScrollView>
          )}
        </View>


      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? 24 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 48,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    flexShrink: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    minWidth: 100,
    minHeight: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  tabButtonShadow: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  activeTabButton: {
    backgroundColor: Colors.light.tint,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    letterSpacing: 0.2,
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
    marginLeft: 8,
    paddingHorizontal: 5,
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 2,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    minHeight: 0,
  },
  statsScroll: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  statsContent: {
    flexGrow: 1,
    padding: 12,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 0,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 15,
    color: Colors.light.text,
  },
});

export default DeliveryDashboard;