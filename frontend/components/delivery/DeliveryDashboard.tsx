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
  Modal,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useDeliveryStore } from '@/store/deliveryStore';
import DeliveryOrderList from './DeliveryOrderList';
import DeliveryStats from './DeliveryStats';

export const DeliveryDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'stats'>('orders');
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<string>('all');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const {
    fetchDeliveryOrders,
    fetchDeliveryStats,
    isLoading,
    stats,
    orders,
    setFilters,
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

  // Handle date selection
  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    setSelectedTimeFilter('all'); // Clear time filter when selecting specific date
    
    // Format date for API
    const formattedDate = date.toISOString().split('T')[0];
    console.log('Selected date:', formattedDate);
    
    // Update filters with selected date
    setFilters({ date: formattedDate, startDate: undefined, page: 1 });
    fetchDeliveryOrders({ date: formattedDate, startDate: undefined, page: 1 }, true);
  }, [setFilters, fetchDeliveryOrders]);

  // Handle time filter selection
  const handleTimeFilterSelect = useCallback((filter: string) => {
    setSelectedTimeFilter(filter);
    setSelectedDate(null);
    
    let startDate: string | undefined;
    const today = new Date();
    
    switch (filter) {
      case '1month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()).toISOString().split('T')[0];
        break;
      case '3months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()).toISOString().split('T')[0];
        break;
      case '6months':
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()).toISOString().split('T')[0];
        break;
      case '1year':
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
        break;
      default:
        startDate = undefined;
    }
    
    console.log('Selected time filter:', filter, 'start date:', startDate);
    
    // Update filters
    setFilters({ startDate, date: undefined, page: 1 });
    fetchDeliveryOrders({ startDate, date: undefined, page: 1 }, true);
  }, [setFilters, fetchDeliveryOrders]);

  // Clear date filter
  const handleClearDateFilter = useCallback(() => {
    setSelectedDate(null);
    setSelectedTimeFilter('all');
    setFilters({ date: undefined, startDate: undefined, page: 1 });
    fetchDeliveryOrders({ page: 1 }, true);
  }, [setFilters, fetchDeliveryOrders]);

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    const isToday = (day: number) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return date.toDateString() === today.toDateString();
    };
    const isSelected = (day: number) => {
      if (!selectedDate) return false;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      return date.toDateString() === selectedDate.toDateString();
    };
    const isFuture = (day: number) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 0);
      return date >= tomorrow;
    };

    const calendarDays = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Add day headers
    dayNames.forEach(day => {
      calendarDays.push(
        <View key={`header-${day}`} style={styles.calendarDayHeader}>
          <Text style={styles.calendarDayHeaderText}>{day}</Text>
        </View>
      );
    });

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      calendarDays.push(
        <View key={`empty-${i}`} style={styles.calendarDayEmpty} />
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isFutureDate = isFuture(day);
      
      calendarDays.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.calendarDay,
            isToday(day) && styles.calendarDayToday,
            isSelected(day) && styles.calendarDaySelected,
            isFutureDate && styles.calendarDayFuture
          ]}
          onPress={() => !isFutureDate && handleDateSelect(date)}
          disabled={isFutureDate}
        >
          <Text style={[
            styles.calendarDayText,
            isToday(day) && styles.calendarDayTodayText,
            isSelected(day) && styles.calendarDaySelectedText,
            isFutureDate && styles.calendarDayFutureText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return calendarDays;
  };

  // Custom date picker modal
  const renderDatePickerModal = () => (
    <Modal
      visible={showDatePicker}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowDatePicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.datePickerModal}>
          <Text style={styles.datePickerTitle}>Select Date</Text>
          
          {/* Time period filters */}
          <View style={styles.timeFilterContainer}>
            <Text style={styles.timeFilterTitle}>Quick Filters:</Text>
            <View style={styles.timeFilterButtons}>
              <TouchableOpacity
                style={[
                  styles.timeFilterButton,
                  selectedTimeFilter === '1month' && styles.activeTimeFilterButton
                ]}
                onPress={() => handleTimeFilterSelect('1month')}
              >
                <Text style={[
                  styles.timeFilterButtonText,
                  selectedTimeFilter === '1month' && styles.activeTimeFilterButtonText
                ]}>1 Month</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.timeFilterButton,
                  selectedTimeFilter === '3months' && styles.activeTimeFilterButton
                ]}
                onPress={() => handleTimeFilterSelect('3months')}
              >
                <Text style={[
                  styles.timeFilterButtonText,
                  selectedTimeFilter === '3months' && styles.activeTimeFilterButtonText
                ]}>3 Months</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.timeFilterButton,
                  selectedTimeFilter === '6months' && styles.activeTimeFilterButton
                ]}
                onPress={() => handleTimeFilterSelect('6months')}
              >
                <Text style={[
                  styles.timeFilterButtonText,
                  selectedTimeFilter === '6months' && styles.activeTimeFilterButtonText
                ]}>6 Months</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.timeFilterButton,
                  selectedTimeFilter === '1year' && styles.activeTimeFilterButton
                ]}
                onPress={() => handleTimeFilterSelect('1year')}
              >
                <Text style={[
                  styles.timeFilterButtonText,
                  selectedTimeFilter === '1year' && styles.activeTimeFilterButtonText
                ]}>1 Year</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Custom Calendar */}
          <View style={styles.calendarContainer}>
            <Text style={styles.datePickerSubtitle}>Or select specific date:</Text>
            
            {/* Date restriction info */}
            <View style={styles.dateRestrictionInfo}>
              <FontAwesome name="info-circle" size={14} color="#6B7280" />
              <Text style={styles.dateRestrictionText}>
                Select the dates only (from past)
              </Text>
            </View>
            
            {/* Calendar Header */}
            <View style={styles.calendarHeader}>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => navigateMonth('prev')}
              >
                <FontAwesome name="chevron-left" size={16} color={Colors.light.tint} />
              </TouchableOpacity>
              
              <Text style={styles.calendarMonthText}>{getMonthName(currentMonth)}</Text>
              
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => navigateMonth('next')}
              >
                <FontAwesome name="chevron-right" size={16} color={Colors.light.tint} />
              </TouchableOpacity>
            </View>
            
            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {renderCalendar()}
            </View>
          </View>
          
          {/* Action buttons */}
          <View style={styles.datePickerActions}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearDateFilter}
            >
              <Text style={styles.clearButtonText}>Clear Filter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

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
          <View style={styles.headerButtons}>
            {/* Calendar Button - Left side */}
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[
                styles.headerButton,
                (selectedDate || selectedTimeFilter !== 'all') && styles.activeHeaderButton
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <FontAwesome 
                name="calendar" 
                size={20} 
                color={(selectedDate || selectedTimeFilter !== 'all') ? 'white' : Colors.light.tint} 
              />
            </TouchableOpacity>
            
            {/* Refresh Button - Right side */}
            <TouchableOpacity
              onPress={handleRefresh}
              style={styles.headerButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <FontAwesome name="refresh" size={20} color={Colors.light.tint} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date Filter Display */}
        {(selectedDate || selectedTimeFilter !== 'all') && (
          <View style={styles.dateFilterDisplay}>
            <FontAwesome name="filter" size={14} color={Colors.light.tint} />
            <Text style={styles.dateFilterText}>
              {selectedDate 
                ? `Showing orders for ${selectedDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}`
                : selectedTimeFilter === '1month' ? 'Last 1 Month'
                : selectedTimeFilter === '3months' ? 'Last 3 Months'
                : selectedTimeFilter === '6months' ? 'Last 6 Months'
                : selectedTimeFilter === '1year' ? 'Last 1 Year'
                : 'All Orders'
              }
            </Text>
            <TouchableOpacity onPress={handleClearDateFilter}>
              <FontAwesome name="times" size={14} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}

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

        {/* Date Picker Modal */}
        {renderDatePickerModal()}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerButton: {
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
  activeHeaderButton: {
    backgroundColor: Colors.light.tint,
  },
  dateFilterDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderBottomWidth: 1,
    borderBottomColor: '#DBEAFE',
    gap: 8,
  },
  dateFilterText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.tint,
    fontWeight: '500',
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
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 6,
  },
  activeTabButtonText: {
    color: 'white',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  contentWrapper: {
    flex: 1,
  },
  statsScroll: {
    flex: 1,
  },
  statsContent: {
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
    fontWeight: '500',
  },
  // Date Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 400,
    width: '90%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  timeFilterContainer: {
    marginBottom: 20,
  },
  timeFilterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  timeFilterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  calendarContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  datePickerSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 15,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    width: '100%',
  },
  calendarDayHeader: {
    width: '14.28%', // 7 days
    alignItems: 'center',
    marginBottom: 8,
  },
  calendarDayHeaderText: {
    fontSize: 12,
    color: Colors.light.text,
  },
  calendarDayEmpty: {
    width: '14.28%', // 7 days
    height: 40,
  },
  calendarDay: {
    width: '14.28%', // 7 days
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  calendarDayToday: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  calendarDayTodayText: {
    color: 'white',
  },
  calendarDaySelected: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  calendarDaySelectedText: {
    color: 'white',
  },
  calendarDayFuture: {
    opacity: 0.5,
    backgroundColor: '#E0E7FF', // Light blue for future dates
    borderColor: '#C7D2FE', // Lighter border for future dates
  },
  calendarDayFutureText: {
    color: '#6B7280', // Gray for future dates
  },
  timeFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeTimeFilterButton: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  timeFilterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  activeTimeFilterButtonText: {
    color: 'white',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    textAlign: 'center',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  dateRestrictionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  dateRestrictionText: {
    fontSize: 12,
    color: '#4B5563',
    marginLeft: 8,
  },
});

export default DeliveryDashboard;