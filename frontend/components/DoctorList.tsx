import { View, FlatList } from 'react-native';
import { useState, useEffect } from 'react';
import DoctorCard from './DoctorCard';
import Pagination from './Pagination';

interface Doctor {
  // We'll type this properly later
  _id: string;
  [key: string]: any;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface DoctorListProps {
  onFetchDoctors: (page: number) => Promise<{
    doctors: Doctor[];
    pagination: PaginationData;
  }>;
}

export default function DoctorList({ onFetchDoctors }: DoctorListProps) {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchDoctors = async (page: number) => {
    try {
      setIsLoading(true);
      const response = await onFetchDoctors(page);
      setDoctors(response.doctors);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    fetchDoctors(newPage);
  };

  return (
    <View className="flex-1">
      <FlatList
        data={doctors}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <DoctorCard doctor={item} />}
        refreshing={isLoading}
        onRefresh={() => fetchDoctors(pagination.currentPage)}
      />
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
        hasNextPage={pagination.hasNextPage}
        hasPrevPage={pagination.hasPrevPage}
      />
    </View>
  );
} 