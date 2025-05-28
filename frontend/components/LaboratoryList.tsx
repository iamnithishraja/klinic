import { View, FlatList, ActivityIndicator, TouchableOpacity, Text, Modal } from 'react-native';
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
        <ActivityIndicator size="small" />
      </View>
    );
  };

  return (
    <View 
      className="flex-1"
      style={{
        paddingBottom: insets.bottom + 60 // Add extra padding for bottom tab bar
      }}
    >
      <View className="px-4 py-2 flex-row items-center justify-between">
        <View className="flex-1">
          <SearchBox 
            onSearch={handleSearch}
            placeholder="Search laboratories by name or service..."
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
            color={hasActiveFilters() ? '#2196F3' : '#666'} 
          />
          {hasActiveFilters() && (
            <View className="ml-1 h-2 w-2 rounded-full bg-blue-500" />
          )}
        </TouchableOpacity>
      </View>
      
      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        onRequestClose={() => setShowFilters(false)}
      >
        <LaboratoryFilters
          onApplyFilters={handleApplyFilters}
          onClose={() => setShowFilters(false)}
        />
      </Modal>
      <FlatList
        data={laboratories}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <LaboratoryCard laboratory={item} />}
        refreshing={isLoading}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
} 