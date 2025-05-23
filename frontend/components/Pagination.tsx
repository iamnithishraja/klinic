import { View, Text, TouchableOpacity } from 'react-native';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hasNextPage,
  hasPrevPage,
}: PaginationProps) {
  return (
    <View className="flex-row items-center justify-center space-x-4 py-4">
      <TouchableOpacity
        onPress={() => hasPrevPage && onPageChange(currentPage - 1)}
        disabled={!hasPrevPage}
        className={`px-4 py-2 rounded-lg ${!hasPrevPage ? 'opacity-50' : ''}`}
      >
        <Text className="text-primary">Previous</Text>
      </TouchableOpacity>

      <Text className="text-gray-600">
        Page {currentPage} of {totalPages}
      </Text>

      <TouchableOpacity
        onPress={() => hasNextPage && onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className={`px-4 py-2 rounded-lg ${!hasNextPage ? 'opacity-50' : ''}`}
      >
        <Text className="text-primary">Next</Text>
      </TouchableOpacity>
    </View>
  );
} 