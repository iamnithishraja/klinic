import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Linking,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  // selectedAppointment is not used, so we can remove it to avoid unused variable error
  // const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
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

  const {
    showRatingModal,
    ratingModalData,
    handleRatingSubmitted
  } = useRatingSystem(completedAppointments);

  // Handle rating submission and refresh data
  const handleRatingSubmittedWithRefresh = useCallback(async () => {
    await handleRatingSubmitted();
    // Refresh dashboard data after rating submission
    await Promise.all([
      fetchDashboardData(),
      fetchPreviousAppointments(),
      fetchPreviousLabTests(),
      fetchCollectedSamples()
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleRatingSubmitted]);

  // Add handler for AI chat
  const handleOpenAIChat = () => {
    setShowAIChat(true);
  };

  const handleCloseAIChat = () => {
    setShowAIChat(false);
  };

  // useCallback to avoid stale closures
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/v1/user/dashboard');
      setDashboardData(response.data);
    } catch (error: any) {
      showAlert({
        title: 'Error',
        message: 'Failed to load dashboard data',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  const fetchPreviousAppointments = useCallback(async (page: number = 1) => {
    try {
      const response = await apiClient.get(`/api/v1/user/appointments/previous?page=${page}&limit=5`);
      setPreviousAppointments(response.data);
    } catch (error) {
      // Optionally show error toast
    }
  }, []);

  const fetchPreviousLabTests = useCallback(async (page: number = 1) => {
    try {
      const response = await apiClient.get(`/api/v1/user/lab-tests/previous?page=${page}&limit=5`);
      setPreviousLabTests(response.data);
    } catch (error) {
      // Optionally show error toast
    }
  }, []);

  const fetchCollectedSamples = useCallback(async (page: number = 1) => {
    try {
      const response = await apiClient.get(`/api/v1/user/lab-tests/collected?page=${page}&limit=5`);
      setCollectedSamples(response.data);
    } catch (error) {
      // Optionally show error toast
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchDashboardData(),
      fetchPreviousAppointments(),
      fetchPreviousLabTests(),
      fetchCollectedSamples()
    ]);
    setRefreshing(false);
  }, [fetchDashboardData, fetchPreviousAppointments, fetchPreviousLabTests, fetchCollectedSamples]);

  useEffect(() => {
    // Use IIFE to call async functions in useEffect
    (async () => {
      await fetchDashboardData();
      await fetchPreviousAppointments();
      await fetchPreviousLabTests();
      await fetchCollectedSamples();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    let addressData: any = null;
    let locationName = '';

    if (appointment.type === 'doctor' && appointment.clinic) {
      addressData = appointment.clinic.clinicAddress;
      locationName = 'clinic';
    } else if (appointment.type === 'laboratory' && appointment.lab) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      showAlert({
        title: 'Error',
        message: 'Failed to load lab notes',
        type: 'error'
      });
    }
  };

  const fetchAllLabReports = async () => {
    try {
      const response = await apiClient.get('/api/v1/user/lab-tests/previous?page=1&limit=50');
      setAllLabReports(response.data.labTests || []);
      setShowLabReportsListModal(true);
    } catch (error: any) {
      showAlert({
        title: 'Error',
        message: 'Failed to load lab reports',
        type: 'error'
      });
    }
  };

  const showPrescriptionsModal = () => {
    const appointmentsWithPrescriptions = previousAppointments?.appointments?.filter((apt: any) => apt.prescription) || [];
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
    } catch (e) {
      return timeSlotDisplay;
    }
  };

  const getAppointmentStatusColor = (appointment: Appointment) => {
    if (appointment.type === 'doctor') {
      // @ts-ignore
      return appointment.consultationType === 'online' ? '#10B981' : '#3B82F6';
    }
    return '#8B5CF6';
  };

  const canJoinNow = (timeSlot: string) => {
    // TODO: Implement actual logic if needed
    return true;
  };

  // UI/UX IMPROVEMENTS: Add a subtle gradient background, improved header, sticky orders button, and section cards

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
        <View style={{
          backgroundColor: '#fff',
          padding: 24,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
          alignItems: 'center'
        }}>
          <FontAwesome name="spinner" size={32} color="#6B7280" style={{ marginBottom: 8 }} />
          <Text style={{ color: '#6B7280', fontSize: 16, fontWeight: '500' }}>Loading your dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      {/* Gradient background */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 220,
          // React Native does not support CSS gradients in backgroundColor
          // Use a fallback color or a gradient library if needed
          opacity: 0.15,
          zIndex: -1,
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={Platform.OS === 'android' ? ['#3B82F6'] : undefined}
            tintColor={Platform.OS === 'ios' ? '#3B82F6' : undefined}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 8,
        }}>
          {/* Header */}
          <View
            style={{
              marginBottom: 18,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View>
              <Text
                style={{
                  fontSize: 26,
                  fontWeight: 'bold',
                  color: '#1e293b',
                  letterSpacing: 0.2,
                }}
              >
                 Welcome Back
              </Text>
              <Text
                style={{
                  color: '#64748b',
                  fontSize: 15,
                  marginTop: 2,
                  fontWeight: '500',
                }}
              >
                Your Health Dashboard
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/orders')}
              style={{
                backgroundColor: '#3B82F6',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                shadowColor: '#3B82F6',
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 2,
              }}
              activeOpacity={0.85}
            >
              <FontAwesome name="shopping-cart" size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 15 }}>
                Orders
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section Cards */}
        <View style={{ paddingHorizontal: 12 }}>
          {/* Upcoming Appointments */}
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              marginBottom: 18,
              padding: 14,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <UpcomingAppointments
              dashboardData={dashboardData}
              onJoinOnlineConsultation={handleJoinOnlineConsultation}
              onGetDirections={handleGetDirections}
              formatAppointmentTime={formatAppointmentTime}
              getAppointmentStatusColor={getAppointmentStatusColor}
              canJoinNow={canJoinNow}
              onAppointmentCancelled={handleRefresh}
              cardMode
            />
          </View>

          {/* Previous Appointments */}
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              marginBottom: 18,
              padding: 14,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <PreviousAppointments
              previousAppointments={previousAppointments}
              formatAppointmentTime={formatAppointmentTime}
              onViewPrescription={viewPrescription}
              onShowPrescriptionsModal={showPrescriptionsModal}
              cardMode
            />
          </View>

          {/* Collected Samples */}
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              marginBottom: 18,
              padding: 14,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <CollectedSamples
              collectedSamples={collectedSamples}
              formatAppointmentTime={formatAppointmentTime}
              cardMode
            />
          </View>

          {/* Previous Lab Tests */}
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              marginBottom: 18,
              padding: 14,
              shadowColor: '#000',
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <PreviousLabTests
              previousLabTests={previousLabTests}
              formatAppointmentTime={formatAppointmentTime}
              onViewLabReport={viewLabReport}
              onViewLabPdfs={viewLabPdfs}
              onViewLabNotes={viewLabNotes}
              onShowAllReportsModal={fetchAllLabReports}
              cardMode
            />
          </View>
        </View>
      </ScrollView>

      {/* AI Chat Floating Button */}
      <ToctorFloatingButton
        onPress={handleOpenAIChat}
        style={{
          position: 'absolute',
          bottom: 32,
          right: 24,
          zIndex: 10,
          shadowColor: '#3B82F6',
          shadowOpacity: 0.18,
          shadowRadius: 8,
          elevation: 4,
        }}
      />

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
          onClose={handleRatingSubmittedWithRefresh}
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