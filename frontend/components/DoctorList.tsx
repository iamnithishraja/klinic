import { View, FlatList, ActivityIndicator, TouchableOpacity, Text, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DoctorCard from './DoctorCard';
import SearchBox from './SearchBox';
import DoctorFilters from './filters/DoctorFilters';
import { Ionicons } from '@expo/vector-icons';
import { useDoctorStore } from '../store/doctorStore';

interface Doctor {
  // We'll type this properly later
  _id: string;
  [key: string]: any;
}

export default function DoctorList() {
  const insets = useSafeAreaInsets();
  const [showFilters, setShowFilters] = useState(false);
  
  const { 
    doctors, 
    pagination,
    isLoading,
    isLoadingMore,
    searchDoctors,
    loadMore,
    setFilters,
    filters
  } = useDoctorStore();

  useEffect(() => {
    searchDoctors();
  }, []);

  const handleSearch = (query: string) => {
    setFilters({ search: query, page: 1 });
    searchDoctors({ search: query, page: 1 });
  };
  
  const handleApplyFilters = () => {
    searchDoctors();
    setShowFilters(false);
  };
  
  const hasActiveFilters = () => {
    return !!(
      filters.specialization || 
      filters.gender || 
      filters.consultationType || 
      filters.minFee || 
      filters.maxFee || 
      filters.minRating || 
      filters.city || 
      filters.pinCode
    );
  };

  const handleRefresh = () => {
    searchDoctors(undefined, true);
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
            placeholder="Search doctors by name or clinic..."
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
        <DoctorFilters
          onApplyFilters={handleApplyFilters}
          onClose={() => setShowFilters(false)}
        />
      </Modal>
      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <DoctorCard doctor={item} />}
        refreshing={isLoading}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 16
        }}
      />
    </View>
  );
} 