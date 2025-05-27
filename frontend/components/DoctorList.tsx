import { View, FlatList, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DoctorCard from './DoctorCard';
import { useDoctorStore } from '../store/doctorStore';

interface Doctor {
  // We'll type this properly later
  _id: string;
  [key: string]: any;
}

export default function DoctorList() {
  const insets = useSafeAreaInsets();
  const { 
    doctors, 
    pagination,
    isLoading,
    isLoadingMore,
    searchDoctors,
    loadMore
  } = useDoctorStore();

  useEffect(() => {
    searchDoctors();
  }, []);

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