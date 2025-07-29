import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import apiClient from '@/api/client';
import RatingModal from './RatingModal';
import VideoCallModal from './VideoCallModal';
import { useCustomAlert } from '@/components/CustomAlert';
import { useRatingSystem } from '@/hooks/useRatingSystem';
import ToctorFloatingButton from './ToctorFloatingButton';
import ToctorAIChat from './ToctorAIChat';

// Import modular components and types
import {
  UpcomingAppointments,
  PreviousAppointments,
  CollectedSamples,
  PreviousLabTests,
  UserDashboardModals,
  Appointment,
  DashboardData,
  PreviousData,
  CollectedData
} from './dashboard';

const UserDashboard: React.FC = () => {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [previousAppointments, setPreviousAppointments] = useState<PreviousData | null>(null);
  const [previousLabTests, setPreviousLabTests] = useState<PreviousData | null>(null);
  const [collectedSamples, setCollectedSamples] = useState<CollectedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showPdfsModal, setShowPdfsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showLabReportsListModal, setShowLabReportsListModal] = useState(false);
  const [allLabReports, setAllLabReports] = useState<Appointment[]>([]);
  
  // Modal data
  const [prescriptionData, setPrescriptionData] = useState<any>(null);
  const [reportData, setReportData] = useState<any>(null);
  const [pdfsData, setPdfsData] = useState<any>(null);
  const [notesData, setNotesData] = useState<any>(null);
  
  // Video call states
  const [showVideoCallModal, setShowVideoCallModal] = useState(false);
  const [selectedVideoCallAppointment, setSelectedVideoCallAppointment] = useState<Appointment | null>(null);
  
  // AI Chat state
  const [showAIChat, setShowAIChat] = useState(false);
  
  const { showAlert, AlertComponent } = useCustomAlert();

  // Rating system - Only check previous/completed appointments for ratings
  const completedAppointments = [
    ...(previousAppointments?.appointments || []),
    ...(previousLabTests?.labTests || [])
  ];
  
  console.log('📊 Completed appointments for rating system:', {
    totalAppointments: completedAppointments.length,
    doctorAppointments: previousAppointments?.appointments?.length || 0,
    labTests: previousLabTests?.labTests?.length || 0,
    appointments: completedAppointments.map(apt => ({
      id: apt._id,
      status: apt.status,
      type: apt.type,
      hasDoctor: !!apt.doctor,
      hasLaboratoryService: !!apt.laboratoryService,
      hasLaboratory: !!apt.laboratory
    }))
  });
  
  const { 
    showRatingModal, 
    ratingModalData, 
    handleRatingSubmitted 
  } = useRatingSystem(completedAppointments);

  // Handle rating submission and refresh data
  const handleRatingSubmittedWithRefresh = async () => {
    handleRatingSubmitted();
    // Refresh dashboard data after rating submission
    await Promise.all([
      fetchDashboardData(),
      fetchPreviousAppointments(),
      fetchPreviousLabTests(),
      fetchCollectedSamples()
    ]);
  };

  // Add handler for AI chat
  const handleOpenAIChat = () => {
    setShowAIChat(true);
  };

  const handleCloseAIChat = () => {
    setShowAIChat(false);
  };

  useEffect(() => {
    fetchDashboardData();
    fetchPreviousAppointments();
    fetchPreviousLabTests();
    fetchCollectedSamples();
  }, []);

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

  const fetchCollectedSamples = async (page: number = 1) => {
    try {
      const response = await apiClient.get(`/api/v1/user/lab-tests/collected?page=${page}&limit=5`);
      setCollectedSamples(response.data);
    } catch (error) {
      console.error('Error fetching collected samples:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchPreviousAppointments(),
      fetchPreviousLabTests(),
      fetchCollectedSamples()
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
            setSelectedVideoCallAppointment(appointment);
            setShowVideoCallModal(true);
          }
        }
      ]
    });
  };

  const handleCloseVideoCall = () => {
    setShowVideoCallModal(false);
    setSelectedVideoCallAppointment(null);
  };

  const handleGetDirections = (appointment: Appointment) => {
    let addressData = null;
    let locationName = '';

    if (appointment.type === 'doctor' && appointment.clinic) {
      addressData = appointment.clinic.clinicAddress;
      locationName = 'clinic';
    } else if (appointment.type === 'laboratory' && appointment.lab) {
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

  const viewLabPdfs = async (testId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/user/lab-tests/${testId}/pdfs`);
      setPdfsData(response.data);
      setShowPdfsModal(true);
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to load lab report PDFs',
        type: 'error'
      });
    }
  };

  const viewLabNotes = async (testId: string) => {
    try {
      const response = await apiClient.get(`/api/v1/user/lab-tests/${testId}/notes`);
      setNotesData(response.data);
      setShowNotesModal(true);
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to load lab notes',
        type: 'error'
      });
    }
  };

  const fetchAllLabReports = async () => {
    try {
      // Fetch all completed lab tests to show in the list
      const response = await apiClient.get('/api/v1/user/lab-tests/previous?page=1&limit=50');
      setAllLabReports(response.data.labTests || []);
      setShowLabReportsListModal(true);
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to load lab reports',
        type: 'error'
      });
    }
  };

  const showPrescriptionsModal = () => {
    // Show all appointments with prescriptions
    const appointmentsWithPrescriptions = previousAppointments?.appointments?.filter(apt => apt.prescription) || [];
    if (appointmentsWithPrescriptions.length > 0) {
      setPrescriptionData({ appointments: appointmentsWithPrescriptions });
      setShowPrescriptionModal(true);
    } else {
      showAlert({
        title: 'No Prescriptions',
        message: 'You don\'t have any prescriptions yet.',
        type: 'info'
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
    // Always allow joining for online consultations
    return true;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <FontAwesome name="spinner" size={24} color="#6B7280" />
        <Text className="text-gray-600 mt-2">Loading your dashboard...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
        <ScrollView 
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          <View className="p-6">
            {/* Header */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-2xl font-bold text-gray-900">Your Health Dashboard</Text>
                <TouchableOpacity
                  onPress={() => router.push('/orders')}
                  className="bg-blue-600 px-4 py-2 rounded-lg flex-row items-center"
                >
                  <FontAwesome name="shopping-cart" size={16} color="white" />
                  <Text className="text-white font-semibold ml-2">Orders</Text>
                </TouchableOpacity>
              </View>
              <Text className="text-gray-600">Stay on top of your appointments and health records</Text>
            </View>

            {/* Upcoming Appointments */}
            <UpcomingAppointments
              dashboardData={dashboardData}
              onJoinOnlineConsultation={handleJoinOnlineConsultation}
              onGetDirections={handleGetDirections}
              formatAppointmentTime={formatAppointmentTime}
              getAppointmentStatusColor={getAppointmentStatusColor}
              canJoinNow={canJoinNow}
              onAppointmentCancelled={handleRefresh}
            />

            {/* Previous Appointments */}
            <PreviousAppointments
              previousAppointments={previousAppointments}
              formatAppointmentTime={formatAppointmentTime}
              onViewPrescription={viewPrescription}
              onShowPrescriptionsModal={showPrescriptionsModal}
            />

            {/* Collected Samples */}
            <CollectedSamples
              collectedSamples={collectedSamples}
              formatAppointmentTime={formatAppointmentTime}
            />

            {/* Previous Lab Tests */}
            <PreviousLabTests
              previousLabTests={previousLabTests}
              formatAppointmentTime={formatAppointmentTime}
              onViewLabReport={viewLabReport}
              onViewLabPdfs={viewLabPdfs}
              onViewLabNotes={viewLabNotes}
              onShowAllReportsModal={fetchAllLabReports}
            />
          </View>
        </ScrollView>

        {/* AI Chat Floating Button */}
        <ToctorFloatingButton onPress={handleOpenAIChat} />

        {/* Video Call Modal */}
        {selectedVideoCallAppointment && (
          <VideoCallModal
            visible={showVideoCallModal}
            onClose={handleCloseVideoCall}
            appointmentId={selectedVideoCallAppointment._id}
            userRole="patient"
            appointmentData={{
              doctorName: selectedVideoCallAppointment.providerName,
              appointmentTime: selectedVideoCallAppointment.timeSlotDisplay
            }}
          />
        )}

        {/* Rating Modal */}
        {ratingModalData && (
          <RatingModal
            visible={showRatingModal}
            onClose={() => handleRatingSubmittedWithRefresh()}
            appointmentId={ratingModalData.appointmentId}
            providerId={ratingModalData.providerId}
            providerName={ratingModalData.providerName}
            providerType={ratingModalData.providerType}
            onRatingSubmitted={handleRatingSubmittedWithRefresh}
          />
        )}

        {/* All Dashboard Modals */}
        <UserDashboardModals
          showPrescriptionModal={showPrescriptionModal}
          showReportModal={showReportModal}
          showPdfsModal={showPdfsModal}
          showNotesModal={showNotesModal}
          showLabReportsListModal={showLabReportsListModal}
          prescriptionData={prescriptionData}
          reportData={reportData}
          pdfsData={pdfsData}
          notesData={notesData}
          allLabReports={allLabReports}
          onClosePrescriptionModal={() => setShowPrescriptionModal(false)}
          onCloseReportModal={() => setShowReportModal(false)}
          onClosePdfsModal={() => setShowPdfsModal(false)}
          onCloseNotesModal={() => setShowNotesModal(false)}
          onCloseLabReportsListModal={() => setShowLabReportsListModal(false)}
          onViewLabReport={viewLabReport}
          onViewLabPdfs={viewLabPdfs}
          onViewLabNotes={viewLabNotes}
          formatAppointmentTime={formatAppointmentTime}
        />

        {/* AI Chat Modal */}
        <ToctorAIChat
          visible={showAIChat}
          onClose={handleCloseAIChat}
        />

        <AlertComponent />
      </SafeAreaView>
  );
};

export default UserDashboard; 