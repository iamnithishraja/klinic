import { View } from 'react-native';
import DoctorList from '@/components/DoctorList';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export default function DoctorsScreen() {
  const fetchDoctors = async (page: number) => {
    try {
      const response = await fetch(
        `${API_URL}/api/search/doctors?page=${page}&limit=10`
      );
      const data = await response.json();
      return {
        doctors: data.doctors,
        pagination: data.pagination,
      };
    } catch (error) {
      console.error('Error fetching doctors:', error);
      return {
        doctors: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }
  };

  return (
    <View className="flex-1 bg-background">
      <DoctorList onFetchDoctors={fetchDoctors} />
    </View>
  );
} 