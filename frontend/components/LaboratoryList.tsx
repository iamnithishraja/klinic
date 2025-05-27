import { View, FlatList, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LaboratoryCard from './LaboratoryCard';
import { useLaboratoryStore } from '../store/laboratoryStore';

interface Laboratory {
  _id: string;
  [key: string]: any;
}

export default function LaboratoryList() {
  const insets = useSafeAreaInsets();
  const { 
    laboratories, 
    pagination,
    isLoading,
    isLoadingMore,
    searchLaboratories,
    loadMore
  } = useLaboratoryStore();

  useEffect(() => {
    searchLaboratories();
  }, []);

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