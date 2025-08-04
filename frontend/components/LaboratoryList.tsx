import { View, FlatList, ActivityIndicator, TouchableOpacity, Text, Modal, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LaboratoryCard from './LaboratoryCard';
import SearchBox from './SearchBox';
import LaboratoryFilters from './filters/LaboratoryFilters';
import { Ionicons } from '@expo/vector-icons';
import { useLaboratoryStore } from '../store/laboratoryStore';

interface Laboratory {
  _id: string;
  [key: string]: any;
}

export default function LaboratoryList() {
  const insets = useSafeAreaInsets();
  const [showFilters, setShowFilters] = useState(false);

  const {
    laboratories,
    pagination,
    isLoading,
    isLoadingMore,
    searchLaboratories,
    loadMore,
    setFilters,
    filters
  } = useLaboratoryStore();

  useEffect(() => {
    searchLaboratories();
  }, []);

  const handleSearch = (query: string) => {
    setFilters({ search: query, page: 1 });
    searchLaboratories({ search: query, page: 1 });
  };

  const handleApplyFilters = () => {
    searchLaboratories();
    setShowFilters(false);
  };

  const hasActiveFilters = () => {
    return !!(
      filters.category ||
      filters.collectionType ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.minRating ||
      filters.city ||
      filters.pinCode
    );
  };

  const handleRefresh = () => {
    searchLaboratories(undefined, true);
  };

  const handleLoadMore = () => {
    if (pagination.hasNextPage && !isLoading && !isLoadingMore) {
      loadMore();
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color="#2196F3" />
      </View>
    );
  };

  const renderEmptyList = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name="flask-outline" size={48} color="#bdbdbd" />
      <Text className="text-lg text-gray-500 mt-4 font-semibold">No laboratories found</Text>
      <Text className="text-base text-gray-400 mt-1 text-center px-8">
        Try adjusting your search or filter criteria.
      </Text>
    </View>
  );

  return (
    <View
      className="flex-1 bg-gray-50"
      style={{
        paddingBottom: insets.bottom + 60,
        paddingTop: Platform.OS === 'android' ? insets.top : 0,
      }}
    >
      {/* Header with Search and Filters */}
      <View
        className="px-4 py-1 bg-white border-b border-gray-100"
        // Removed shadow styles from header
        style={{
          zIndex: 2,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 mr-3">
            <SearchBox
              onSearch={handleSearch}
              placeholder="🔍 Search labs by name or service..."
              // Removed 'style' prop to fix type error
            />
          </View>
          <TouchableOpacity
            onPress={() => setShowFilters(true)}
            activeOpacity={0.8}
            className="flex-row items-center justify-center"
            style={{
              padding: 12,
              borderRadius: 12,
              backgroundColor: hasActiveFilters() ? '#e6f7ff' : '#f3f6fa',
              borderWidth: hasActiveFilters() ? 1.5 : 1,
              borderColor: hasActiveFilters() ? '#2196F3' : '#e0e7ef',
              // Removed shadow styles from filter button
            }}
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={hasActiveFilters() ? '#2196F3' : '#666'}
              style={{ marginRight: hasActiveFilters() ? 4 : 0 }}
            />
            {hasActiveFilters() && (
              <View
                style={{
                  marginLeft: 2,
                  height: 8,
                  width: 8,
                  borderRadius: 4,
                  backgroundColor: '#2196F3',
                  borderWidth: 1,
                  borderColor: '#fff',
                }}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
        transparent
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.18)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              paddingBottom: insets.bottom + 12,
              minHeight: '60%',
              // Removed shadow styles from modal
            }}
          >
            <LaboratoryFilters
              onApplyFilters={handleApplyFilters}
              onClose={() => setShowFilters(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Laboratory List */}
      <FlatList
        data={laboratories}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={{ marginHorizontal: 12, marginBottom: 16 }}>
            <LaboratoryCard laboratory={item} />
          </View>
        )}
        refreshing={isLoading}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmptyList : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16,
          paddingBottom: 24,
          minHeight: '80%',
        }}
        style={{ flex: 1 }}
      />
     
    </View>
  );
}