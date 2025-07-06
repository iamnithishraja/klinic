import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Modal, RefreshControl, Linking, Alert, SafeAreaView, Image } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import apiClient from '@/api/client';
import { useCustomAlert } from '@/components/CustomAlert';

// @ts-ignore
import { router } from 'expo-router';

interface Appointment {
  _id: string;
  type: 'doctor' | 'lab';
  timeSlot: string; // Now a Date string from backend
  timeSlotDisplay: string; // Human-readable formatted time display
  status: string;
  consultationType?: 'in-person' | 'online';
  collectionType?: 'lab' | 'home';
  providerName: string;
  serviceName: string;
  prescription?: string;
  reportResult?: string;
  clinic?: any;
  laboratoryService?: any;
  doctor?: any;
  lab?: any;
  packageCoverImage?: string; // For lab appointments - cover image from laboratoryService
  createdAt: string;
}

interface DashboardData {
  upcomingAppointments: Appointment[];
  totalUpcoming: number;
}

interface PreviousData {
  appointments?: Appointment[];
  labTests?: Appointment[];
  pagination: {
    current: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const UserDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [previousAppointments, setPreviousAppointments] = useState<PreviousData | null>(null);
  const [previousLabTests, setPreviousLabTests] = useState<PreviousData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const { showAlert, AlertComponent } = useCustomAlert();

  useEffect(() => {
    fetchDashboardData();
    fetchPreviousAppointments();
    fetchPreviousLabTests();
  }, []);

  const handleNavigateToSection = (section: 'doctors' | 'laboratories') => {
    try {
      if (section === 'doctors') {
        router.push('/(tabs)/doctors');
      } else {
        router.push('/(tabs)/laboratories');
      }
    } catch (error) {
      // Fallback - do nothing if navigation fails
      console.log('Navigation error:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await apiClient.get('/api/v1/user/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to load dashboard data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPreviousAppointments = async (page: number = 1) => {
    try {
      const response = await apiClient.get(`/api/v1/user/appointments/previous?page=${page}&limit=5`);
      setPreviousAppointments(response.data);
    } catch (error) {
      console.error('Error fetching previous appointments:', error);
    }
  };

  const fetchPreviousLabTests = async (page: number = 1) => {
    try {
      const response = await apiClient.get(`/api/v1/user/lab-tests/previous?page=${page}&limit=5`);
      setPreviousLabTests(response.data);
    } catch (error) {
      console.error('Error fetching previous lab tests:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchPreviousAppointments(),
      fetchPreviousLabTests()
    ]);
    setRefreshing(false);
  };

  const handleJoinOnlineConsultation = (appointment: Appointment) => {
    showAlert({
      title: 'Join Online Consultation',
      message: `Ready to join your consultation with ${appointment.providerName}?`,
      type: 'info',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Join Now', 
          style: 'primary',
          onPress: () => {
            // In a real app, this would open the video call interface
            showAlert({
              title: 'Joining...',
              message: 'Connecting you to the online consultation...',
              type: 'success'
            });
          }
        }
      ]
    });
  };

  const handleGetDirections = (appointment: Appointment) => {
    let addressData = null;
    let locationName = '';

    if (appointment.type === 'doctor' && appointment.clinic) {
      addressData = appointment.clinic.clinicAddress;
      locationName = 'clinic';
    } else if (appointment.type === 'lab' && appointment.lab) {
      // For labs, we need to get the laboratory address
      // This might be stored differently in the lab profile
      addressData = appointment.lab.laboratoryAddress || appointment.lab.address;
      locationName = 'laboratory';
    }

    if (addressData) {
      const { latitude, longitude, address, googleMapsLink } = addressData;
      
      if (googleMapsLink) {
        Linking.openURL(googleMapsLink);
      } else if (latitude && longitude) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        Linking.openURL(url);
      } else if (address) {
        const encodedAddress = encodeURIComponent(address);
        const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        Linking.openURL(url);
      } else {
        showAlert({
          title: 'No Location Data',
          message: `Location information is not available for this ${locationName}.`,
          type: 'warning'
        });
      }
    } else {
      showAlert({
        title: 'No Location Data',
        message: `Location information is not available for this ${locationName}.`,
        type: 'warning'
      });
    }
  };

  const viewPrescription = async (appointmentId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/user/appointments/${appointmentId}/prescription`);
      setPrescriptionData(response.data);
      setShowPrescriptionModal(true);
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to load prescription',
        type: 'error'
      });
    }
  };

  const viewLabReport = async (testId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/user/lab-tests/${testId}/report`);
      setReportData(response.data);
      setShowReportModal(true);
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to load lab report',
        type: 'error'
      });
    }
  };

  const formatAppointmentTime = (timeSlot: string, timeSlotDisplay: string) => {
    try {
      // Convert UTC timeSlot to IST for comparison
      const appointmentDateUTC = new Date(timeSlot);
      const appointmentDateIST = new Date(appointmentDateUTC.getTime() + (5.5 * 60 * 60 * 1000));
      
      // Get today's date in IST
      const todayUTC = new Date();
      const todayIST = new Date(todayUTC.getTime() + (5.5 * 60 * 60 * 1000));
      
      // Check if it's today or tomorrow in IST
      const todayStartIST = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate());
      const appointmentStartIST = new Date(appointmentDateIST.getFullYear(), appointmentDateIST.getMonth(), appointmentDateIST.getDate());
      
      const daysDiff = Math.floor((appointmentStartIST.getTime() - todayStartIST.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Today - extract just the time from timeSlotDisplay
        const timePart = timeSlotDisplay.split(' ').slice(1).join(' ');
        return `Today, ${timePart}`;
      } else if (daysDiff === 1) {
        // Tomorrow - extract just the time from timeSlotDisplay
        const timePart = timeSlotDisplay.split(' ').slice(1).join(' ');
        return `Tomorrow, ${timePart}`;
      } else {
        // Other days - use the full timeSlotDisplay
        return timeSlotDisplay;
      }
    } catch {
      // Fallback to timeSlotDisplay
      return timeSlotDisplay;
    }
  };

  const getAppointmentStatusColor = (appointment: Appointment) => {
    if (appointment.type === 'doctor') {
      return appointment.consultationType === 'online' ? '#10B981' : '#3B82F6';
    }
    return '#8B5CF6';
  };

  const canJoinNow = (timeSlot: string) => {
    try {
      // Parse the UTC Date object from timeSlot and convert to IST
      const appointmentTimeUTC = new Date(timeSlot);
      const appointmentTimeIST = new Date(appointmentTimeUTC.getTime() + (5.5 * 60 * 60 * 1000));
      
      // Get current time in IST
      const nowUTC = new Date();
      const nowIST = new Date(nowUTC.getTime() + (5.5 * 60 * 60 * 1000));
      
      // Check if appointment is today in IST
      const appointmentDateIST = new Date(appointmentTimeIST.getFullYear(), appointmentTimeIST.getMonth(), appointmentTimeIST.getDate());
      const todayDateIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());
      
      // Only allow joining if it's today
      if (appointmentDateIST.getTime() !== todayDateIST.getTime()) return false;
      
      // Calculate time difference in minutes (using IST times)
      const timeDiff = appointmentTimeIST.getTime() - nowIST.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      // Allow joining 15 minutes before to 30 minutes after the appointment time
      return minutesDiff >= -30 && minutesDiff <= 15;
    } catch {
      return false;
    }
  };

  const renderUpcomingAppointment = ({ item }: { item: Appointment }) => (
    <View className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden" style={{ width: 300 }}>
      {/* Cover Image Section */}
      {item.type === 'doctor' && item.doctor ? (
        item.doctor.coverImage ? (
          <Image
            source={{ uri: item.doctor.coverImage }}
            className="w-full h-32"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-32 bg-gradient-to-r from-blue-100 to-indigo-100 items-center justify-center">
            <FontAwesome name="user-md" size={32} color="#6366F1" />
          </View>
        )
      ) : item.type === 'lab' ? (
        item.packageCoverImage ? (
          <Image
            source={{ uri: item.packageCoverImage }}
            className="w-full h-32"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-32 bg-gradient-to-r from-purple-100 to-violet-100 items-center justify-center">
            <FontAwesome name="flask" size={32} color="#8B5CF6" />
          </View>
        )
      ) : (
        <View className="w-full h-32 bg-gradient-to-r from-gray-100 to-gray-200 items-center justify-center">
          <FontAwesome name="hospital-o" size={32} color="#6B7280" />
        </View>
      )}

      <View className="p-5">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {item.type === 'doctor' ? `Dr. ${item.providerName}` : item.providerName}
            </Text>
            <Text className="text-gray-600 mb-2">{item.serviceName}</Text>
            <Text className="text-sm text-gray-500">{formatAppointmentTime(item.timeSlot, item.timeSlotDisplay)}</Text>
          </View>
          <View 
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: `${getAppointmentStatusColor(item)}20` }}
          >
            <Text 
              className="text-xs font-medium"
              style={{ color: getAppointmentStatusColor(item) }}
            >
              {item.type === 'doctor' ? 
                (item.consultationType === 'online' ? 'Online' : 'In-Person') : 
                (item.collectionType === 'home' ? 'Home Collection' : 'Lab Visit')
              }
            </Text>
          </View>
        </View>

      <View className="space-y-3">
        {item.type === 'doctor' && item.consultationType === 'online' && (
          <Pressable
            onPress={() => handleJoinOnlineConsultation(item)}
            disabled={!canJoinNow(item.timeSlot)}
            className={`py-3 px-4 rounded-xl flex-row items-center justify-center ${
              canJoinNow(item.timeSlot) ? 'bg-green-500' : 'bg-gray-300'
            }`}
          >
            <FontAwesome 
              name="video-camera" 
              size={16} 
              color="white" 
              style={{ marginRight: 8 }} 
            />
            <Text className="text-white font-medium">
              {canJoinNow(item.timeSlot) ? 'Join Now' : 'Join Later'}
            </Text>
          </Pressable>
        )}

        {item.type === 'doctor' && item.consultationType === 'in-person' && item.clinic && (
          <Pressable
            onPress={() => handleGetDirections(item)}
            className="py-3 px-4 rounded-xl flex-row items-center justify-center bg-blue-500"
          >
            <FontAwesome 
              name="map-marker" 
              size={16} 
              color="white" 
              style={{ marginRight: 8 }} 
            />
            <Text className="text-white font-medium">Get Directions</Text>
          </Pressable>
        )}

        {item.type === 'lab' && item.collectionType === 'lab' && (
          <Pressable
            onPress={() => handleGetDirections(item)}
            className="py-3 px-4 rounded-xl flex-row items-center justify-center bg-purple-500"
          >
            <FontAwesome 
              name="map-marker" 
              size={16} 
              color="white" 
              style={{ marginRight: 8 }} 
            />
            <Text className="text-white font-medium">Get Directions to Lab</Text>
          </Pressable>
        )}

        {item.type === 'lab' && item.collectionType === 'home' && (
          <View className="py-3 px-4 rounded-xl bg-orange-100 flex-row items-center justify-center">
            <FontAwesome 
              name="home" 
              size={16} 
              color="#ea580c" 
              style={{ marginRight: 8 }} 
            />
            <Text className="text-orange-700 font-medium">Home Collection Scheduled</Text>
          </View>
        )}
        </View>
      </View>
    </View>
  );

  const renderPreviousAppointment = ({ item }: { item: Appointment }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-start mb-2">
        {/* Small cover image or icon */}
        <View className="mr-3">
          {item.type === 'doctor' && item.doctor?.coverImage ? (
            <Image
              source={{ uri: item.doctor.coverImage }}
              className="w-12 h-12 rounded-lg"
              resizeMode="cover"
            />
          ) : item.type === 'doctor' ? (
            <View className="w-12 h-12 rounded-lg bg-blue-100 items-center justify-center">
              <FontAwesome name="user-md" size={20} color="#6366F1" />
            </View>
          ) : (
            <View className="w-12 h-12 rounded-lg bg-purple-100 items-center justify-center">
              <FontAwesome name="flask" size={20} color="#8B5CF6" />
            </View>
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">
            {item.type === 'doctor' ? `Dr. ${item.providerName}` : item.providerName}
          </Text>
          <Text className="text-gray-600 text-sm">{item.serviceName}</Text>
          <Text className="text-gray-500 text-xs">{formatAppointmentTime(item.timeSlot, item.timeSlotDisplay)}</Text>
        </View>
        
        {item.type === 'doctor' && item.prescription && (
          <Pressable
            onPress={() => viewPrescription(item._id)}
            className="bg-blue-100 px-3 py-1 rounded-lg ml-2"
          >
            <Text className="text-blue-700 text-xs font-medium">View Prescription</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const renderPreviousLabTest = ({ item }: { item: Appointment }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-start mb-2">
        {/* Small lab icon or package cover image */}
        <View className="mr-3">
          {item.packageCoverImage ? (
            <Image
              source={{ uri: item.packageCoverImage }}
              className="w-12 h-12 rounded-lg"
              resizeMode="cover"
            />
          ) : (
            <View className="w-12 h-12 rounded-lg bg-purple-100 items-center justify-center">
              <FontAwesome name="flask" size={20} color="#8B5CF6" />
            </View>
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">{item.providerName}</Text>
          <Text className="text-gray-600 text-sm">{item.serviceName}</Text>
          <Text className="text-gray-500 text-xs">{formatAppointmentTime(item.timeSlot, item.timeSlotDisplay)}</Text>
        </View>
        
        {item.reportResult && (
          <Pressable
            onPress={() => viewLabReport(item._id)}
            className="bg-purple-100 px-3 py-1 rounded-lg ml-2"
          >
            <Text className="text-purple-700 text-xs font-medium">View Report</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
          <FontAwesome name="spinner" size={24} color="#6B7280" />
          <Text className="text-gray-600 mt-2">Loading your dashboard...</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView 
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View className="p-6 pt-2">
            {/* Header */}
            <View className="mb-6">
              <Text className="text-3xl font-bold text-gray-900 mb-2">Your Health Dashboard</Text>
              <Text className="text-gray-600">Stay on top of your appointments and health records</Text>
            </View>

          {/* Upcoming Appointments Carousel */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Upcoming Appointments ({dashboardData?.totalUpcoming || 0})
            </Text>
            
            {dashboardData?.upcomingAppointments && dashboardData.upcomingAppointments.length > 0 ? (
              <FlatList
                data={dashboardData.upcomingAppointments}
                renderItem={renderUpcomingAppointment}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 24, paddingRight: 24 }}
                ItemSeparatorComponent={() => <View className="w-4" />}
              />
            ) : (
              <View className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 shadow-sm border border-blue-100 items-center">
                <View className="bg-blue-100 rounded-full p-4 mb-4">
                  <FontAwesome name="calendar-plus-o" size={40} color="#4F46E5" />
                </View>
                <Text className="text-xl font-bold text-gray-900 mb-2">Ready for your next consultation?</Text>
                <Text className="text-gray-600 text-center mb-6 leading-relaxed">
                  Book appointments with top doctors and laboratories near you. Your health journey starts here!
                </Text>
                <View className="flex-row space-x-3">
                  <Pressable 
                    onPress={() => handleNavigateToSection('doctors')}
                    className="bg-primary px-6 py-3 rounded-xl flex-row items-center"
                  >
                    <FontAwesome name="stethoscope" size={16} color="white" style={{ marginRight: 8 }} />
                    <Text className="text-white font-medium">Find Doctors</Text>
                  </Pressable>
                  <Pressable 
                    onPress={() => handleNavigateToSection('laboratories')}
                    className="bg-purple-500 px-6 py-3 rounded-xl flex-row items-center"
                  >
                    <FontAwesome name="flask" size={16} color="white" style={{ marginRight: 8 }} />
                    <Text className="text-white font-medium">Book Lab Tests</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Previous Appointments */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">Previous Appointments</Text>
            
            {previousAppointments?.appointments && previousAppointments.appointments.length > 0 ? (
              <FlatList
                data={previousAppointments.appointments}
                renderItem={renderPreviousAppointment}
                scrollEnabled={false}
              />
            ) : (
              <View className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-green-100 items-center">
                <View className="bg-green-100 rounded-full p-3 mb-3">
                  <FontAwesome name="clock-o" size={28} color="#059669" />
                </View>
                <Text className="text-lg font-semibold text-gray-900 mb-1">Your consultation history</Text>
                <Text className="text-gray-600 text-center text-sm">
                  Previous appointments and prescriptions will appear here
                </Text>
              </View>
            )}
          </View>

          {/* Previous Lab Tests */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">Previous Lab Tests</Text>
            
            {previousLabTests?.labTests && previousLabTests.labTests.length > 0 ? (
              <FlatList
                data={previousLabTests.labTests}
                renderItem={renderPreviousLabTest}
                scrollEnabled={false}
              />
            ) : (
              <View className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-6 shadow-sm border border-purple-100 items-center">
                <View className="bg-purple-100 rounded-full p-3 mb-3">
                  <FontAwesome name="heartbeat" size={28} color="#8B5CF6" />
                </View>
                <Text className="text-lg font-semibold text-gray-900 mb-1">Your health reports</Text>
                <Text className="text-gray-600 text-center text-sm">
                  Lab test results and health reports will be available here
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Prescription Modal */}
        <Modal
          visible={showPrescriptionModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowPrescriptionModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-6">
            <View className="bg-white rounded-2xl p-6 w-full max-w-md">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-900">Prescription</Text>
                <Pressable onPress={() => setShowPrescriptionModal(false)}>
                  <FontAwesome name="times" size={24} color="#6B7280" />
                </Pressable>
              </View>
              
              {prescriptionData && (
                <ScrollView className="max-h-80">
                  <Text className="text-gray-600 mb-2">
                    Doctor: {prescriptionData.appointment?.doctor?.name}
                  </Text>
                  <Text className="text-gray-600 mb-4">
                    Date: {prescriptionData.appointment?.timeSlotDisplay || formatAppointmentTime(prescriptionData.appointment?.timeSlot, prescriptionData.appointment?.timeSlot)}
                  </Text>
                  <Text className="text-gray-900">
                    {prescriptionData.prescription || 'No prescription available'}
                  </Text>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* Lab Report Modal */}
        <Modal
          visible={showReportModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowReportModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-center items-center p-6">
            <View className="bg-white rounded-2xl p-6 w-full max-w-md">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-900">Lab Report</Text>
                <Pressable onPress={() => setShowReportModal(false)}>
                  <FontAwesome name="times" size={24} color="#6B7280" />
                </Pressable>
              </View>
              
              {reportData && (
                <ScrollView className="max-h-80">
                  <Text className="text-gray-600 mb-2">
                    Laboratory: {reportData.labTest?.lab?.name}
                  </Text>
                  <Text className="text-gray-600 mb-2">
                    Service: {reportData.labTest?.laboratoryService?.name}
                  </Text>
                  <Text className="text-gray-600 mb-4">
                    Date: {reportData.labTest?.timeSlotDisplay || formatAppointmentTime(reportData.labTest?.timeSlot, reportData.labTest?.timeSlot)}
                  </Text>
                  <Text className="text-gray-900">
                    {reportData.report || 'Report not available yet'}
                  </Text>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

          <AlertComponent />
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default UserDashboard; 