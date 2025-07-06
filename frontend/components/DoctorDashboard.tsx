import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Modal, RefreshControl, SafeAreaView, Image, TextInput, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import apiClient from '@/api/client';
import { useCustomAlert } from '@/components/CustomAlert';

interface Patient {
  _id: string;
  name: string;
  email: string;
  phone: string;
  profilePicture?: string;
  age?: number;
  gender?: string;
  medicalHistory?: string;
  medicalHistoryPdfs?: string[];
  address?: {
    address?: string;
    pinCode?: string;
    latitude?: number;
    longitude?: number;
  };
  city?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DoctorAppointment {
  _id: string;
  patient: Patient;
  timeSlot: string;
  timeSlotDisplay: string;
  consultationType: 'in-person' | 'online';
  status: 'upcoming' | 'completed';
  prescription?: string;
  prescriptionSent?: boolean;
  clinic?: {
    clinicName: string;
    clinicAddress: {
      address: string;
      pinCode: string;
    };
  };
  notes?: string;
  isPaid: boolean;
  paymentStatus?: 'pending' | 'captured' | 'failed';
  createdAt: string;
}

interface DashboardData {
  pendingAppointments: DoctorAppointment[];
  completedAppointments: DoctorAppointment[];
  totalPending: number;
  totalCompleted: number;
  totalAppointments: number;
}

const DoctorDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<DoctorAppointment | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [notesText, setNotesText] = useState('');
  const { showAlert, AlertComponent } = useCustomAlert();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching doctor dashboard data...');
      const response = await apiClient.get('/api/v1/doctor/dashboard');
      console.log('Doctor dashboard response:', response.data);
      
      // Debug: Check patient data in appointments
      if (response.data.upcomingAppointments && response.data.upcomingAppointments.length > 0) {
        console.log('Sample upcoming appointment patient data:', response.data.upcomingAppointments[0].patient);
        console.log('Patient age:', response.data.upcomingAppointments[0].patient.age);
        console.log('Patient gender:', response.data.upcomingAppointments[0].patient.gender);
        console.log('Patient medicalHistory:', response.data.upcomingAppointments[0].patient.medicalHistory);
        console.log('Patient medicalHistoryPdfs:', response.data.upcomingAppointments[0].patient.medicalHistoryPdfs);
        console.log('Patient address:', response.data.upcomingAppointments[0].patient.address);
        console.log('Patient city:', response.data.upcomingAppointments[0].patient.city);
      }
      if (response.data.completedAppointments && response.data.completedAppointments.length > 0) {
        console.log('Sample completed appointment patient data:', response.data.completedAppointments[0].patient);
      }
      
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Error fetching doctor dashboard data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      showAlert({
        title: 'Error',
        message: `Failed to load dashboard data: ${error.response?.data?.message || error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };



  const handleViewPatient = (appointment: DoctorAppointment) => {
    console.log('Viewing patient data:', appointment.patient);
    console.log('Patient age:', appointment.patient.age);
    console.log('Patient gender:', appointment.patient.gender);
    console.log('Patient medicalHistory:', appointment.patient.medicalHistory);
    console.log('Patient medicalHistoryPdfs:', appointment.patient.medicalHistoryPdfs);
    console.log('Patient address:', appointment.patient.address);
    console.log('Patient city:', appointment.patient.city);
    setSelectedAppointment(appointment);
    setShowPatientModal(true);
  };

  const handleAddPrescription = (appointment: DoctorAppointment) => {
    setSelectedAppointment(appointment);
    setPrescriptionText(appointment.prescription || '');
    setNotesText(appointment.notes || '');
    setShowPrescriptionModal(true);
  };

  const handleViewDocument = async (pdfUrl: string, documentName: string) => {
    try {
      console.log('Opening document:', pdfUrl);
      
      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(pdfUrl);
      
      if (canOpen) {
        await Linking.openURL(pdfUrl);
      } else {
        showAlert({
          title: 'Error',
          message: 'Cannot open this document. Please check if the URL is valid.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error opening document:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to open document. Please try again.',
        type: 'error'
      });
    }
  };

  const handleSavePrescription = async () => {
    if (!selectedAppointment || (!prescriptionText.trim() && !notesText.trim())) {
      showAlert({
        title: 'Error',
        message: 'Please enter prescription details or notes',
        type: 'error'
      });
      return;
    }

    try {
      await apiClient.post(`/api/v1/doctor/appointments/${selectedAppointment._id}/prescription`, {
        prescription: prescriptionText,
        notes: notesText
      });

      showAlert({
        title: 'Success',
        message: 'Prescription and notes saved successfully',
        type: 'success'
      });

      setShowPrescriptionModal(false);
      setPrescriptionText('');
      setNotesText('');
      setSelectedAppointment(null);
      
      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to save prescription and notes',
        type: 'error'
      });
    }
  };

  const formatAppointmentTime = (timeSlot: string, timeSlotDisplay: string) => {
    try {
      const appointmentDateUTC = new Date(timeSlot);
      const appointmentDateIST = new Date(appointmentDateUTC.getTime() + (5.5 * 60 * 60 * 1000));
      
      const todayUTC = new Date();
      const todayIST = new Date(todayUTC.getTime() + (5.5 * 60 * 60 * 1000));
      
      const todayStartIST = new Date(todayIST.getFullYear(), todayIST.getMonth(), todayIST.getDate());
      const appointmentStartIST = new Date(appointmentDateIST.getFullYear(), appointmentDateIST.getMonth(), appointmentDateIST.getDate());
      
      const daysDiff = Math.floor((appointmentStartIST.getTime() - todayStartIST.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        const timePart = timeSlotDisplay.split(' ').slice(1).join(' ');
        return `Today, ${timePart}`;
      } else if (daysDiff === 1) {
        const timePart = timeSlotDisplay.split(' ').slice(1).join(' ');
        return `Tomorrow, ${timePart}`;
      } else {
        return timeSlotDisplay;
      }
    } catch {
      return timeSlotDisplay;
    }
  };

  

  const handleMarkAsRead = async (appointment: DoctorAppointment) => {
    if (!appointment.prescriptionSent) {
      showAlert({
        title: 'Error',
        message: 'Prescription must be sent to patient before marking as read',
        type: 'error'
      });
      return;
    }

    showAlert({
      title: 'Mark as Read',
      message: `Mark appointment with ${appointment.patient.name} as completed? This will move it to completed appointments.`,
      type: 'info',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark as Read', 
          style: 'primary',
          onPress: async () => {
            try {
              console.log('Marking appointment as completed:', appointment._id);
              const response = await apiClient.patch(`/api/v1/doctor/appointments/${appointment._id}/status`, {
                status: 'completed'
              });
              console.log('Mark as read response:', response.data);

              showAlert({
                title: 'Success',
                message: 'Appointment marked as completed',
                type: 'success'
              });

              // Refresh dashboard data
              await fetchDashboardData();
            } catch (error: any) {
              console.error('Mark as read error:', error);
              console.error('Error response:', error.response?.data);
              console.error('Error status:', error.response?.status);
              showAlert({
                title: 'Error',
                message: `Failed to mark appointment as completed: ${error.response?.data?.message || error.message}`,
                type: 'error'
              });
            }
          }
        }
      ]
    });
  };

  const handleJoinNow = (appointment: DoctorAppointment) => {
    // Empty function for online consultation join
    console.log('Join Now clicked for appointment:', appointment._id);
    showAlert({
      title: 'Join Consultation',
      message: 'Online consultation joining functionality will be implemented here.',
      type: 'info'
    });
  };

  const renderUpcomingAppointment = ({ item }: { item: DoctorAppointment }) => (
    <View className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-4">
      <View className="p-5">
        <View className="flex-row items-start mb-4">
          <View className="mr-4">
            {item.patient.profilePicture ? (
              <Image
                source={{ uri: item.patient.profilePicture }}
                className="w-16 h-16 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center">
                <FontAwesome name="user" size={24} color="#6366F1" />
              </View>
            )}
          </View>
          
          <View className="flex-1">
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {item.patient.name}
            </Text>
            <Text className="text-gray-600 mb-1">{item.patient.email}</Text>
            <Text className="text-gray-500 text-sm mb-2">{item.patient.phone}</Text>
            <Text className="text-sm text-gray-500">
              {formatAppointmentTime(item.timeSlot, item.timeSlotDisplay)}
            </Text>
          </View>
          
          <View 
            className="px-3 py-1 rounded-full"
            style={{ 
              backgroundColor: item.consultationType === 'online' ? '#10B98120' : '#3B82F620' 
            }}
          >
            <Text 
              className="text-xs font-medium"
              style={{ 
                color: item.consultationType === 'online' ? '#10B981' : '#3B82F6' 
              }}
            >
              {item.consultationType === 'online' ? 'Online' : 'In-Person'}
            </Text>
          </View>
        </View>

        {item.clinic && item.consultationType === 'in-person' && (
          <View className="bg-gray-50 rounded-xl p-3 mb-4">
            <Text className="text-sm font-medium text-gray-700 mb-1">Clinic Location</Text>
            <Text className="text-sm text-gray-600">{item.clinic.clinicName}</Text>
            <Text className="text-sm text-gray-500">{item.clinic.clinicAddress.address}</Text>
          </View>
        )}

        <View className="flex-row space-x-3">
          <Pressable
            onPress={() => handleViewPatient(item)}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-100 items-center"
          >
            <FontAwesome name="user" size={16} color="#3B82F6" style={{ marginBottom: 4 }} />
            <Text className="text-blue-700 font-medium text-sm">View Patient</Text>
          </Pressable>
          
          {item.consultationType === 'online' && (
            <Pressable
              onPress={() => handleJoinNow(item)}
              className="flex-1 py-3 px-4 rounded-xl bg-green-500 items-center"
            >
              <FontAwesome 
                name="video-camera" 
                size={16} 
                color="white" 
                style={{ marginBottom: 4 }} 
              />
              <Text className="text-white font-medium text-sm">Join Now</Text>
            </Pressable>
          )}
          
          <Pressable
            onPress={() => handleMarkAsRead(item)}
            disabled={!item.prescriptionSent}
            className={`flex-1 py-3 px-4 rounded-xl items-center ${
              item.prescriptionSent ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <FontAwesome 
              name="check-circle" 
              size={16} 
              color="white" 
              style={{ marginBottom: 4 }} 
            />
            <Text className="text-white font-medium text-sm">
              {item.prescriptionSent ? 'Mark as Read' : 'No Prescription Sent'}
            </Text>
          </Pressable>
        </View>

        {/* Payment Status */}
        <View className="mt-3 p-3 bg-gray-50 rounded-xl">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-medium text-gray-700">Payment Status</Text>
            <View className="flex-row items-center">
              <View 
                className={`w-2 h-2 rounded-full mr-2 ${
                  item.isPaid ? 'bg-green-500' : 'bg-red-500'
                }`} 
              />
              <Text className={`text-sm font-medium ${
                item.isPaid ? 'text-green-700' : 'text-red-700'
              }`}>
                {item.isPaid ? 'Paid Online' : 'Payment to be Collected'}
              </Text>
            </View>
          </View>
          {item.paymentStatus && (
            <Text className="text-xs text-gray-500 mt-1">
              Status: {item.paymentStatus}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderCompletedAppointment = ({ item }: { item: DoctorAppointment }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-start mb-3">
        <View className="mr-3">
          {item.patient.profilePicture ? (
            <Image
              source={{ uri: item.patient.profilePicture }}
              className="w-12 h-12 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center">
              <FontAwesome name="user" size={20} color="#6366F1" />
            </View>
          )}
        </View>
        
        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-900">{item.patient.name}</Text>
          <Text className="text-gray-600 text-sm">{item.patient.email}</Text>
          <Text className="text-gray-500 text-xs">{formatAppointmentTime(item.timeSlot, item.timeSlotDisplay)}</Text>
        </View>
        
        <View className="flex-row space-x-2">
          <Pressable
            onPress={() => handleViewPatient(item)}
            className="bg-blue-100 px-3 py-1 rounded-lg"
          >
            <Text className="text-blue-700 text-xs font-medium">Patient</Text>
          </Pressable>
          
          <Pressable
            onPress={() => handleAddPrescription(item)}
            className="bg-green-100 px-3 py-1 rounded-lg"
          >
            <Text className="text-green-700 text-xs font-medium">
              {item.prescription ? 'Edit Rx' : 'Add Rx'}
            </Text>
          </Pressable>
        </View>
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
              <Text className="text-3xl font-bold text-gray-900 mb-2">Doctor Dashboard</Text>
              <Text className="text-gray-600">Manage your appointments and patients</Text>
            </View>

            {/* Stats Cards */}
            <View className="flex-row space-x-4 mb-8">
              <View className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center">
                  <View className="bg-blue-100 rounded-full mr-3">
                    <FontAwesome name="calendar" size={15} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="text-xl font-bold text-gray-900">{dashboardData?.totalAppointments || 0}</Text>
                    <Text className="text-sm text-gray-600">Total</Text>
                  </View>
                </View>
              </View>
              
              <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center">
                  <View className="bg-orange-100 rounded-full  mr-3">
                    <FontAwesome name="clock-o" size={17} color="#F97316" />
                  </View>
                  <View>
                    <Text className="text-2xl font-bold text-gray-900">{dashboardData?.totalPending || 0}</Text>
                    <Text className="text-sm text-gray-600">Pending</Text>
                  </View>
                </View>
              </View>
              
              <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <View className="flex-row items-center">
                  <View className="bg-green-100 rounded-full  mr-3">
                    <FontAwesome name="check-circle" size={18} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-2xl font-bold text-gray-900">{dashboardData?.totalCompleted || 0}</Text>
                    <Text className="text-sm text-gray-600">Completed</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Pending Appointments */}
            <View className="mb-8">
              <Text className="text-xl font-bold text-gray-900 mb-4">
                Pending Appointments ({dashboardData?.totalPending || 0})
              </Text>
              
              {dashboardData?.pendingAppointments && dashboardData.pendingAppointments.length > 0 ? (
                <FlatList
                  data={dashboardData.pendingAppointments.sort((a: DoctorAppointment, b: DoctorAppointment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
                  renderItem={renderUpcomingAppointment}
                  scrollEnabled={false}
                />
              ) : (
                <View className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 shadow-sm border border-orange-100 items-center">
                  <View className="bg-orange-100 rounded-full p-4 mb-4">
                    <FontAwesome name="clock-o" size={40} color="#F97316" />
                  </View>
                  <Text className="text-xl font-bold text-gray-900 mb-2">No pending appointments</Text>
                  <Text className="text-gray-600 text-center leading-relaxed">
                    Your pending appointments will appear here. Patients can book consultations with you.
                  </Text>
                </View>
              )}
            </View>

            {/* Completed Appointments */}
            <View className="mb-8">
              <Text className="text-xl font-bold text-gray-900 mb-4">Recent Consultations</Text>
              
              {dashboardData?.completedAppointments && dashboardData.completedAppointments.length > 0 ? (
                <FlatList
                  data={dashboardData.completedAppointments.sort((a: DoctorAppointment, b: DoctorAppointment) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())}
                  renderItem={renderCompletedAppointment}
                  scrollEnabled={false}
                />
              ) : (
                <View className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-green-100 items-center">
                  <View className="bg-green-100 rounded-full p-3 mb-3">
                    <FontAwesome name="check-circle" size={28} color="#059669" />
                  </View>
                  <Text className="text-lg font-semibold text-gray-900 mb-1">No completed consultations</Text>
                  <Text className="text-gray-600 text-center text-sm">
                    Completed consultations and prescriptions will appear here
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Patient Details Modal */}
          <Modal
            visible={showPatientModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPatientModal(false)}
          >
            <View className="flex-1 bg-black/50 justify-center items-center p-4" style={{ zIndex: 1000 }}>
              <View className="bg-white rounded-2xl w-full max-w-lg h-[95%]" style={{ zIndex: 1001 }}>
                {/* Header */}
                <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
                  <Text className="text-xl font-bold text-gray-900">Patient Profile</Text>
                  <Pressable onPress={() => setShowPatientModal(false)}>
                    <FontAwesome name="times" size={24} color="#6B7280" />
                  </Pressable>
                </View>
                
                {selectedAppointment && (
                  <ScrollView 
                    className="flex-1 p-6"
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ paddingBottom: 20 }}
                  >
                    {/* Patient Header */}
                    <View className="flex-row items-center mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                      {selectedAppointment.patient.profilePicture ? (
                        <Image
                          source={{ uri: selectedAppointment.patient.profilePicture }}
                          className="w-20 h-20 rounded-full mr-4"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mr-4">
                          <FontAwesome name="user" size={32} color="#6366F1" />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-xl font-bold text-gray-900 mb-1">{selectedAppointment.patient.name}</Text>
                        <Text className="text-gray-600 mb-1">{selectedAppointment.patient.email}</Text>
                        <Text className="text-gray-500 text-sm">{selectedAppointment.patient.phone}</Text>
                      </View>
                    </View>

                    {/* Personal Information */}
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                        <FontAwesome name="user-circle" size={18} color="#6366F1" style={{ marginRight: 8 }} />
                        Personal Information
                      </Text>
                      <View className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                        <View className="flex-row justify-between">
                          <Text className="text-sm font-medium text-gray-700">Age</Text>
                          <Text className="text-gray-900">
                            {selectedAppointment.patient.age ? `${selectedAppointment.patient.age} years` : 'Not specified'}
                          </Text>
                        </View>
                        
                        <View className="flex-row justify-between">
                          <Text className="text-sm font-medium text-gray-700">Gender</Text>
                          <Text className="text-gray-900 capitalize">
                            {selectedAppointment.patient.gender || 'Not specified'}
                          </Text>
                        </View>
                        
                        <View className="flex-row justify-between">
                          <Text className="text-sm font-medium text-gray-700">City</Text>
                          <Text className="text-gray-900">
                            {selectedAppointment.patient.city || 'Not specified'}
                          </Text>
                        </View>
                        
                        <View>
                          <Text className="text-sm font-medium text-gray-700 mb-1">Address</Text>
                          {selectedAppointment.patient.address?.address ? (
                            <>
                              <Text className="text-gray-900 text-sm">{selectedAppointment.patient.address.address}</Text>
                              {selectedAppointment.patient.address.pinCode && (
                                <Text className="text-gray-500 text-sm">PIN: {selectedAppointment.patient.address.pinCode}</Text>
                              )}
                              {(selectedAppointment.patient.address.latitude && selectedAppointment.patient.address.longitude) && (
                                <Text className="text-gray-500 text-sm">
                                  Location: {selectedAppointment.patient.address.latitude.toFixed(4)}, {selectedAppointment.patient.address.longitude.toFixed(4)}
                                </Text>
                              )}
                            </>
                          ) : (
                            <Text className="text-gray-500 text-sm">Not specified</Text>
                          )}
                        </View>
                      </View>
                    </View>

                    {/* Medical Information */}
                    {(selectedAppointment.patient.medicalHistory || selectedAppointment.patient.medicalHistoryPdfs?.length) && (
                      <View className="mb-6">
                        <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                          <FontAwesome name="heartbeat" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                          Medical History
                        </Text>
                        <View className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                          {selectedAppointment.patient.medicalHistory && (
                            <View>
                              <Text className="text-sm font-medium text-gray-700 mb-2">Medical Notes</Text>
                              <Text className="text-gray-900 text-sm leading-relaxed">
                                {selectedAppointment.patient.medicalHistory}
                              </Text>
                            </View>
                          )}
                          
                          {selectedAppointment.patient.medicalHistoryPdfs && selectedAppointment.patient.medicalHistoryPdfs.length > 0 && (
                            <View>
                              <Text className="text-sm font-medium text-gray-700 mb-2">Medical Documents</Text>
                              <View className="space-y-2">
                                {selectedAppointment.patient.medicalHistoryPdfs.map((pdf, index) => (
                                  <View key={index} className="flex-row items-center bg-gray-50 rounded-lg p-3">
                                    <FontAwesome name="file-pdf-o" size={16} color="#EF4444" style={{ marginRight: 8 }} />
                                    <View className="flex-1">
                                      <Text className="text-sm text-gray-700 font-medium">Medical Document {index + 1}</Text>
                                      <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                                        {pdf.length > 50 ? pdf.substring(0, 50) + '...' : pdf}
                                      </Text>
                                    </View>
                                    <Pressable 
                                      onPress={() => handleViewDocument(pdf, `Medical Document ${index + 1}`)}
                                      className="bg-blue-500 px-3 py-2 rounded-lg"
                                    >
                                      <Text className="text-white text-xs font-medium">View</Text>
                                    </Pressable>
                                  </View>
                                ))}
                              </View>
                            </View>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Appointment Information */}
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                        <FontAwesome name="calendar" size={18} color="#10B981" style={{ marginRight: 8 }} />
                        Appointment Details
                      </Text>
                      <View className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                        <View className="flex-row justify-between">
                          <Text className="text-sm font-medium text-gray-700">Appointment Time</Text>
                          <Text className="text-gray-900">{formatAppointmentTime(selectedAppointment.timeSlot, selectedAppointment.timeSlotDisplay)}</Text>
                        </View>
                        
                        <View className="flex-row justify-between">
                          <Text className="text-sm font-medium text-gray-700">Consultation Type</Text>
                          <View className="flex-row items-center">
                            <View 
                              className="w-2 h-2 rounded-full mr-2"
                              style={{ 
                                backgroundColor: selectedAppointment.consultationType === 'online' ? '#10B981' : '#3B82F6' 
                              }}
                            />
                            <Text className="text-gray-900 capitalize">{selectedAppointment.consultationType}</Text>
                          </View>
                        </View>
                        
                        <View className="flex-row justify-between">
                          <Text className="text-sm font-medium text-gray-700">Status</Text>
                          <View 
                            className="px-3 py-1 rounded-full"
                            style={{ 
                              backgroundColor: selectedAppointment.status === 'upcoming' ? '#FEF3C7' : '#D1FAE5' 
                            }}
                          >
                            <Text 
                              className="text-xs font-medium"
                              style={{ 
                                color: selectedAppointment.status === 'upcoming' ? '#D97706' : '#059669' 
                              }}
                            >
                              {selectedAppointment.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Clinic Information for In-Person */}
                    {selectedAppointment.consultationType === 'in-person' && selectedAppointment.clinic && (
                      <View className="mb-6">
                        <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                          <FontAwesome name="hospital-o" size={18} color="#8B5CF6" style={{ marginRight: 8 }} />
                          Clinic Information
                        </Text>
                        <View className="bg-white border border-gray-200 rounded-xl p-4">
                          <Text className="text-lg font-semibold text-gray-900 mb-2">{selectedAppointment.clinic.clinicName}</Text>
                          <Text className="text-gray-600 text-sm">{selectedAppointment.clinic.clinicAddress.address}</Text>
                          <Text className="text-gray-500 text-sm">PIN: {selectedAppointment.clinic.clinicAddress.pinCode}</Text>
                        </View>
                      </View>
                    )}

                    {/* Profile Information */}
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                        <FontAwesome name="clock-o" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                        Profile Information
                      </Text>
                      <View className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                        {selectedAppointment.patient.createdAt && (
                          <View className="flex-row justify-between">
                            <Text className="text-sm font-medium text-gray-700">Patient Since</Text>
                            <Text className="text-gray-900">
                              {new Date(selectedAppointment.patient.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </Text>
                          </View>
                        )}
                        
                        {selectedAppointment.patient.updatedAt && (
                          <View className="flex-row justify-between">
                            <Text className="text-sm font-medium text-gray-700">Last Updated</Text>
                            <Text className="text-gray-900">
                              {new Date(selectedAppointment.patient.updatedAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </Text>
                          </View>
                        )}
                        
                        <View className="flex-row justify-between">
                          <Text className="text-sm font-medium text-gray-700">Profile Status</Text>
                          <View className="flex-row items-center">
                            <View className={`w-2 h-2 rounded-full mr-2 ${
                              selectedAppointment.patient.age && selectedAppointment.patient.gender && selectedAppointment.patient.city 
                                ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                            <Text className="text-gray-900 text-sm">
                              {selectedAppointment.patient.age && selectedAppointment.patient.gender && selectedAppointment.patient.city 
                                ? 'Complete' : 'Incomplete'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Quick Actions */}
                    <View className="mb-6">
                  
                      <View className="flex-row space-x-3">
                        <Pressable
                          onPress={() => {
                            setShowPatientModal(false);
                            handleAddPrescription(selectedAppointment);
                          }}
                          className="flex-1 py-3 px-4 rounded-xl bg-green-500 items-center"
                        >
                          <FontAwesome name="stethoscope" size={16} color="white" style={{ marginBottom: 4 }} />
                          <Text className="text-white font-medium text-sm">Add Prescription</Text>
                        </Pressable>
                      </View>
                    </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

          {/* Prescription Modal */}
          <Modal
            visible={showPrescriptionModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPrescriptionModal(false)}
          >
            <View className="flex-1 bg-black/50 justify-center items-center p-4" style={{ zIndex: 1000 }}>
              <View className="bg-white rounded-2xl w-full max-w-lg h-[90%]" style={{ zIndex: 1001 }}>
                {/* Header */}
                <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
                  <Text className="text-xl font-bold text-gray-900">Prescription & Notes</Text>
                  <Pressable onPress={() => setShowPrescriptionModal(false)}>
                    <FontAwesome name="times" size={24} color="#6B7280" />
                  </Pressable>
                </View>
                
                {selectedAppointment && (
                  <ScrollView 
                    className="flex-1 p-6"
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ paddingBottom: 20 }}
                  >
                    {/* Patient Info */}
                    <View className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl">
                      <Text className="text-lg font-semibold text-gray-900 mb-1">
                        Patient: {selectedAppointment.patient.name}
                      </Text>
                      <Text className="text-gray-600 text-sm">
                        Date: {formatAppointmentTime(selectedAppointment.timeSlot, selectedAppointment.timeSlotDisplay)}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        Type: {selectedAppointment.consultationType === 'online' ? 'Online Consultation' : 'In-Person Consultation'}
                      </Text>
                    </View>
                    
                    {/* Prescription Section */}
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                        <FontAwesome name="stethoscope" size={18} color="#10B981" style={{ marginRight: 8 }} />
                        Prescription Details
                      </Text>
                      <View className="bg-white border border-gray-200 rounded-xl p-4">
                        <TextInput
                          value={prescriptionText}
                          onChangeText={setPrescriptionText}
                          placeholder="Enter detailed prescription including medications, dosage, instructions, and follow-up recommendations..."
                          multiline
                          numberOfLines={8}
                          className="text-gray-900 text-sm leading-relaxed"
                          textAlignVertical="top"
                          style={{ minHeight: 120 }}
                        />
                      </View>
                      <Text className="text-xs text-gray-500 mt-2">
                        This prescription will be sent to the patient and saved in their medical records.
                      </Text>
                    </View>
                    
                    {/* Notes Section */}
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                        <FontAwesome name="edit" size={18} color="#8B5CF6" style={{ marginRight: 8 }} />
                        Doctor&apos;s Notes
                      </Text>
                      <View className="bg-white border border-gray-200 rounded-xl p-4">
                        <TextInput
                          value={notesText}
                          onChangeText={setNotesText}
                          placeholder="Enter private notes, observations, diagnosis details, or any additional information for your records..."
                          multiline
                          numberOfLines={6}
                          className="text-gray-900 text-sm leading-relaxed"
                          textAlignVertical="top"
                          style={{ minHeight: 100 }}
                        />
                      </View>
                      <Text className="text-xs text-gray-500 mt-2">
                        These notes are private and will not be shared with the patient.
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View className="mt-8 mb-4">
                      <View className="flex-row space-x-4">
                        <Pressable
                          onPress={() => {
                            setShowPrescriptionModal(false);
                            setPrescriptionText('');
                            setNotesText('');
                            setSelectedAppointment(null);
                          }}
                          className="flex-1 py-4 px-6 rounded-2xl bg-gray-200 items-center shadow-sm"
                          style={{
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                          }}
                        >
                          <FontAwesome name="times" size={18} color="#6B7280" style={{ marginBottom: 6 }} />
                          <Text className="text-gray-700 font-semibold text-base">Cancel</Text>
                          <Text className="text-gray-500 text-xs mt-1">Discard changes</Text>
                        </Pressable>
                        
                        <Pressable
                          onPress={handleSavePrescription}
                          className="flex-1 py-4 px-6 rounded-2xl bg-green-500 items-center shadow-lg"
                          style={{
                            shadowColor: '#10B981',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 6,
                          }}
                        >
                          <FontAwesome name="save" size={18} color="white" style={{ marginBottom: 6 }} />
                          <Text className="text-white font-semibold text-base">Save & Send</Text>
                          <Text className="text-green-100 text-xs mt-1">Send to patient</Text>
                        </Pressable>
                      </View>
                      
                      {/* Additional Info */}
                      <View className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                        <View className="flex-row items-start">
                          <FontAwesome name="info-circle" size={14} color="#3B82F6" style={{ marginTop: 2, marginRight: 8 }} />
                          <View className="flex-1">
                            <Text className="text-blue-800 text-xs font-medium mb-1">Important</Text>
                            <Text className="text-blue-700 text-xs leading-relaxed">
                              The prescription will be sent to the patient immediately. Notes are private and for your records only.
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
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

export default DoctorDashboard; 