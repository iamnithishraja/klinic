import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { DeliveryStats as DeliveryStatsType } from '@/store/deliveryStore';

interface DeliveryStatsProps {
  stats: DeliveryStatsType | null;
}

const DeliveryStats: React.FC<DeliveryStatsProps> = ({ stats }) => {
  if (!stats) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No statistics available</Text>
      </View>
    );
  }

  const renderStatCard = (title: string, value: string | number, icon: string, color: string, subtitle?: string, trend?: string) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <FontAwesome name={icon as any} size={20} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trend === 'up' ? '#10B981' : '#EF4444' }]}>
            <FontAwesome name={trend === 'up' ? 'arrow-up' : 'arrow-down'} size={10} color="white" />
          </View>
        )}
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Performance Overview */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Overview</Text>
        <View style={styles.statsGrid}>
          {renderStatCard(
            'Total Orders',
            stats.totalOrders,
            'list',
            '#3B82F6',
            'All time'
          )}
          {renderStatCard(
            'Completed',
            stats.completedOrders,
            'check',
            '#10B981',
            'Successfully delivered'
          )}
          {renderStatCard(
            'Pending',
            stats.pendingOrders,
            'clock-o',
            '#F59E0B',
            'In progress'
          )}
          {renderStatCard(
            'Rejected',
            stats.rejectedOrders,
            'times-circle',
            '#EF4444',
            'Declined orders'
          )}
        </View>
      </View>

      {/* Performance Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <FontAwesome name="trophy" size={18} color="#F59E0B" />
              <Text style={styles.metricTitle}>Completion Rate</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#F59E0B' }]}>
              {stats.completionRate.toFixed(1)}%
            </Text>
            <Text style={styles.metricDescription}>
              Successfully completed deliveries
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <FontAwesome name="clock-o" size={18} color="#3B82F6" />
              <Text style={styles.metricTitle}>Avg. Delivery Time</Text>
            </View>
            <Text style={[styles.metricValue, { color: '#3B82F6' }]}>
              {stats.averageDeliveryTimeHours.toFixed(1)}h
            </Text>
            <Text style={styles.metricDescription}>
              Average time to complete delivery
            </Text>
            {stats.averageDeliveryTimeHours < 2 && (
              <View style={styles.performanceBadge}>
                <FontAwesome name="star" size={12} color="#F59E0B" />
                <Text style={styles.performanceText}>Fast Delivery</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityItem}>
            <FontAwesome name="check-circle" size={16} color="#10B981" />
            <Text style={styles.activityText}>
              {stats.completedOrders} orders delivered this period
            </Text>
          </View>
          <View style={styles.activityItem}>
            <FontAwesome name="clock-o" size={16} color="#F59E0B" />
            <Text style={styles.activityText}>
              {stats.pendingOrders} orders currently in progress
            </Text>
          </View>
          <View style={styles.activityItem}>
            <FontAwesome name="star" size={16} color="#F59E0B" />
            <Text style={styles.activityText}>
              {stats.completionRate >= 90 ? 'Excellent' : stats.completionRate >= 75 ? 'Good' : 'Needs Improvement'} performance rating
            </Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tips for Better Performance</Text>
        <View style={styles.tipsContainer}>
          <View style={styles.tipItem}>
            <FontAwesome name="lightbulb-o" size={16} color="#F59E0B" />
            <Text style={styles.tipText}>
              Accept orders promptly to maintain good response time
            </Text>
          </View>
          <View style={styles.tipItem}>
            <FontAwesome name="lightbulb-o" size={16} color="#F59E0B" />
            <Text style={styles.tipText}>
              Update delivery status regularly for better tracking
            </Text>
          </View>
          <View style={styles.tipItem}>
            <FontAwesome name="lightbulb-o" size={16} color="#F59E0B" />
            <Text style={styles.tipText}>
              Communicate with customers for smooth deliveries
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '45%',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 10,
    color: '#6B7280',
  },
  metricsContainer: {
    gap: 16,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 12,
    flex: 1,
  },
  tipsContainer: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tipText: {
    fontSize: 13,
    color: Colors.light.text,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  noDataText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 40,
  },
  trendBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  performanceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  performanceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
});

export default DeliveryStats; 