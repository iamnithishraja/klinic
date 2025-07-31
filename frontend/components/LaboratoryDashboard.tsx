import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, Modal, RefreshControl, Image, TextInput, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
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
  prescriptionUrl?: string;
  prescriptionPdfs?: string[];
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

interface LabTest {
  _id: string;
  name: string;
  description: string;
  price: number;
}

interface LaboratoryService {
  _id: string;
  name: string;
  description: string;
  coverImage?: string;
  tests: LabTest[];
  price: number;
  category: string;
}

interface LabAppointment {
  _id: string;
  patient: Patient;
  laboratoryService: LaboratoryService;
  timeSlot: string;
  timeSlotDisplay: string;
  collectionType: 'lab' | 'home';
  status: 'pending' | 'processing' | 'completed' | 'upcoming' | 'collected' | 'marked-as-read';
  selectedTests: number[];
  reportResult?: string;
  notes?: string;
  testReportPdfs?: string[];
  reportsUploaded?: boolean;
  isPaid: boolean;
  feedbackRequested?: boolean;
  createdAt: string;
}

interface DashboardData {
  pendingAppointments: LabAppointment[];
  processingAppointments: LabAppointment[];
  completedAppointments: LabAppointment[];
  totalPending: number;
  totalProcessing: number;
  totalCompleted: number;
  totalAppointments: number;
}

const LaboratoryDashboard: React.FC = () => {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<LabAppointment | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportText, setReportText] = useState('');
  const [notesText, setNotesText] = useState('');
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [testReportPdfs, setTestReportPdfs] = useState<string[]>([]);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<string>('');
  const { showAlert, AlertComponent } = useCustomAlert();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching laboratory dashboard data...');
      const response = await apiClient.get('/api/v1/laboratory/dashboard');
      console.log('Laboratory dashboard response:', response.data);
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Error fetching laboratory dashboard data:', error);
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
    try {
    setRefreshing(true);
      console.log('Refreshing laboratory dashboard data...');
      const response = await apiClient.get('/api/v1/laboratory/dashboard');
      console.log('Laboratory dashboard refresh response:', response.data);
      
      setDashboardData(response.data);
    } catch (error: any) {
      console.error('Error refreshing laboratory dashboard data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      showAlert({
        title: 'Error',
        message: `Failed to refresh dashboard data: ${error.response?.data?.message || error.message}`,
        type: 'error'
      });
    } finally {
    setRefreshing(false);
    }
  };

  const handleSampleCollected = async (appointment: LabAppointment) => {
    showAlert({
      title: 'Sample Collected',
      message: `Mark sample as collected for ${appointment.patient.name}? This will move the appointment to processing.`,
      type: 'info',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark Collected', 
          style: 'primary',
          onPress: async () => {
            try {
              await apiClient.patch(`/api/v1/laboratory/appointments/${appointment._id}/sample-collected`);
              
              showAlert({
                title: 'Success',
                message: 'Sample marked as collected. Appointment moved to processing.',
                type: 'success'
              });
              
              // Refresh dashboard data
              await fetchDashboardData();
            } catch (error: any) {
              showAlert({
                title: 'Error',
                message: `Failed to mark sample as collected: ${error.response?.data?.message || error.message}`,
                type: 'error'
              });
            }
          }
        }
      ]
    });
  };

  const handleViewPatient = (appointment: LabAppointment) => {
    console.log('Viewing patient data:', appointment.patient);
    setSelectedAppointment(appointment);
    setShowPatientModal(true);
  };

  const handleAddReport = (appointment: LabAppointment) => {
    setSelectedAppointment(appointment);
    setReportText(appointment.reportResult || '');
    setNotesText(appointment.notes || '');
    setTestReportPdfs(appointment.testReportPdfs || []);
    setShowReportModal(true);
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name || `test-report-${Date.now()}.pdf`;
        const fileType = result.assets[0].mimeType || 'application/pdf';

        console.log('Document selected:', fileUri);

        // Step 1: Get upload URL from backend
        const uploadUrlResponse = await apiClient.post('/api/v1/upload-url', {
          fileType,
          fileName,
        });

        if (!uploadUrlResponse.data.uploadUrl) {
          throw new Error('Failed to get upload URL');
        }

        const uploadUrl = uploadUrlResponse.data.uploadUrl;
        console.log('Got upload URL:', uploadUrl);

        // Step 2: Upload file directly to the presigned URL
        const response = await fetch(fileUri);
        const blob = await response.blob();

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: blob,
          headers: {
            'Content-Type': fileType,
          },
        });

        if (uploadResponse.ok) {
          // Extract the file URL from the upload URL (remove query parameters)  
          const urlWithoutQuery = uploadUrl.split('?')[0];
          const parts = urlWithoutQuery.split('.com/');
          const key = parts[1];
          
          const s3Url = `https://pub-0f703feb53794f768ba649b826a64db4.r2.dev/${key}`;
          console.log('PDF uploaded successfully, URL:', s3Url);
          
          setTestReportPdfs([...testReportPdfs, s3Url]);
          showAlert({
            title: 'Success',
            message: 'Test report PDF uploaded successfully',
            type: 'success'
          });
        } else {
          throw new Error(`Upload failed with status: ${uploadResponse.status}`);
        }
      }
    } catch (error) {
      console.error('Error picking document:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to upload document',
        type: 'error'
      });
    }
  };

  const handleRemovePdf = (index: number) => {
    showAlert({
      title: 'Remove PDF',
      message: 'Are you sure you want to remove this PDF from the upload list?',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            const updatedPdfs = testReportPdfs.filter((_, i) => i !== index);
            setTestReportPdfs(updatedPdfs);
            showAlert({
              title: 'Success',
              message: 'PDF removed from upload list',
              type: 'success'
            });
          }
        }
      ]
    });
  };

  const handleViewDocument = async (pdfUrl: string, documentName: string) => {
    try {
      console.log('Opening document:', pdfUrl);
      
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

  const handleViewPrescription = async (prescriptionUrl: string) => {
    try {
      console.log('Opening prescription:', prescriptionUrl);
      
      const canOpen = await Linking.canOpenURL(prescriptionUrl);
      
      if (canOpen) {
        await Linking.openURL(prescriptionUrl);
      } else {
        showAlert({
          title: 'Error',
          message: 'Cannot open this prescription. Please check if the URL is valid.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error opening prescription:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to open prescription. Please try again.',
        type: 'error'
      });
    }
  };

  const handleDownloadPrescription = async (prescriptionUrl: string) => {
    try {
      console.log('Downloading prescription:', prescriptionUrl);
      
      const canOpen = await Linking.canOpenURL(prescriptionUrl);
      
      if (canOpen) {
        await Linking.openURL(prescriptionUrl);
      } else {
        showAlert({
          title: 'Error',
          message: 'Cannot download this prescription. Please check if the URL is valid.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error downloading prescription:', error);
      showAlert({
        title: 'Error',
        message: 'Failed to download prescription. Please try again.',
        type: 'error'
      });
    }
  };

  const handleViewPrescriptionModal = (prescriptionUrl: string) => {
    setSelectedPrescription(prescriptionUrl);
    setShowPrescriptionModal(true);
  };

  const handleSaveReport = async () => {
    if (!selectedAppointment || (!reportText.trim() && testReportPdfs.length === 0)) {
      showAlert({
        title: 'Error',
        message: 'Please enter report details or upload test PDFs',
        type: 'error'
      });
      return;
    }

    try {
      await apiClient.post(`/api/v1/laboratory/appointments/${selectedAppointment._id}/report`, {
        reportResult: reportText,
        notes: notesText,
        testReportPdfs: testReportPdfs
      });

      showAlert({
        title: 'Success',
        message: 'Lab report and test PDFs saved successfully',
        type: 'success'
      });

      setShowReportModal(false);
      setReportText('');
      setNotesText('');
      setTestReportPdfs([]);
      setSelectedAppointment(null);
      
      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error) {
      showAlert({
        title: 'Error',
        message: 'Failed to save lab report and test PDFs',
        type: 'error'
      });
    }
  };

  const handleDeleteReport = async () => {
    if (!selectedAppointment) {
      showAlert({
        title: 'Error',
        message: 'No appointment selected',
        type: 'error'
      });
      return;
    }

    showAlert({
      title: 'Delete Report',
      message: 'Are you sure you want to delete this report? This will move the appointment back to processing and remove all uploaded reports.',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/api/v1/laboratory/appointments/${selectedAppointment._id}/report`);

              showAlert({
                title: 'Success',
                message: 'Report deleted successfully. Appointment moved back to processing.',
                type: 'success'
              });

              setShowReportModal(false);
              setReportText('');
              setNotesText('');
              setTestReportPdfs([]);
              setSelectedAppointment(null);
              
              // Refresh dashboard data
              await fetchDashboardData();
            } catch (error: any) {
              showAlert({
                title: 'Error',
                message: `Failed to delete report: ${error.response?.data?.message || error.message}`,
                type: 'error'
              });
            }
          }
        }
      ]
    });
  };

  const handleMarkAsRead = async (appointment: LabAppointment) => {
    // Check if both report details and PDFs are uploaded
    const hasReportDetails = appointment.reportResult && appointment.reportResult.trim() !== '';
    const hasPdfs = appointment.testReportPdfs && appointment.testReportPdfs.length > 0;
    
    if (!hasReportDetails || !hasPdfs) {
      showAlert({
        title: 'Error',
        message: 'Both report details and test PDFs must be uploaded before marking as read',
        type: 'error'
      });
      return;
    }

    showAlert({
      title: 'Mark as Read',
      message: `Mark appointment with ${appointment.patient.name} as completed? This will move it to completed appointments and request feedback from the patient.`,
      type: 'info',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Mark as Read', 
          style: 'primary',
          onPress: async () => {
            try {
              console.log('Marking appointment as completed:', appointment._id);
              const response = await apiClient.patch(`/api/v1/laboratory/appointments/${appointment._id}/mark-as-read`);
              console.log('Mark as read response:', response.data);

              showAlert({
                title: 'Success',
                message: 'Appointment marked as completed and feedback requested from patient',
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

  const handleRequestFeedback = async (appointment: LabAppointment) => {
    try {
      const response = await apiClient.post(`/api/v1/ratings/appointments/${appointment._id}/request-feedback`);
      console.log('Request feedback response:', response.data);

      showAlert({
        title: 'Success',
        message: 'Feedback request sent to patient successfully',
        type: 'success'
      });

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Request feedback error:', error);
      showAlert({
        title: 'Error',
        message: `Failed to request feedback: ${error.response?.data?.message || error.message}`,
        type: 'error'
      });
    }
  };

  const handleCancelFeedbackRequest = async (appointment: LabAppointment) => {
    try {
      const response = await apiClient.delete(`/api/v1/ratings/appointments/${appointment._id}/cancel-feedback`);
      console.log('Cancel feedback response:', response.data);

      showAlert({
        title: 'Success',
        message: 'Feedback request cancelled successfully',
        type: 'success'
      });

      // Refresh dashboard data
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Cancel feedback error:', error);
      showAlert({
        title: 'Error',
        message: `Failed to cancel feedback request: ${error.response?.data?.message || error.message}`,
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

  const canStartNow = (timeSlot: string) => {
    try {
      const appointmentTimeUTC = new Date(timeSlot);
      const appointmentTimeIST = new Date(appointmentTimeUTC.getTime() + (5.5 * 60 * 60 * 1000));
      
      const nowUTC = new Date();
      const nowIST = new Date(nowUTC.getTime() + (5.5 * 60 * 60 * 1000));
      
      const appointmentDateIST = new Date(appointmentTimeIST.getFullYear(), appointmentTimeIST.getMonth(), appointmentTimeIST.getDate());
      const todayDateIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());
      
      if (appointmentDateIST.getTime() !== todayDateIST.getTime()) return false;
      
      const timeDiff = appointmentTimeIST.getTime() - nowIST.getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      return minutesDiff >= -15 && minutesDiff <= 30;
    } catch {
      return false;
    }
  };

  const getSelectedTestsNames = (appointment: LabAppointment) => {
    // Check if laboratoryService exists and has tests
    if (!appointment.laboratoryService?.tests || appointment.laboratoryService.tests.length === 0) {
      return 'No tests available';
    }

    if (!appointment.selectedTests || appointment.selectedTests.length === 0) {
      return appointment.laboratoryService.tests.map(test => test.name).join(', ');
    }
    
    return appointment.selectedTests
      .map(index => appointment.laboratoryService.tests[index]?.name)
      .filter(Boolean)
      .join(', ');
  };

  // Filter appointments to only show paid home collections
  const filterAppointments = (appointments: LabAppointment[] = []) =>
    appointments.filter(
      (apt) =>
        apt.collectionType !== 'home' || apt.isPaid === true
    );

  const renderPendingAppointment = ({ item }: { item: LabAppointment }) => (
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
              <View className="w-16 h-16 rounded-full bg-purple-100 items-center justify-center">
                <FontAwesome name="user" size={24} color="#8B5CF6" />
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
              backgroundColor: item.collectionType === 'home' ? '#F59E0B20' : '#8B5CF620' 
            }}
          >
            <Text 
              className="text-xs font-medium"
              style={{ 
                color: item.collectionType === 'home' ? '#F59E0B' : '#8B5CF6' 
              }}
            >
              {item.collectionType === 'home' ? 'Home' : 'Lab Visit'}
            </Text>
          </View>
        </View>

        <View className="bg-gray-50 rounded-xl p-3 mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Test Package</Text>
          <Text className="text-sm text-gray-600">{item.laboratoryService?.name || 'Service not available'}</Text>
          <Text className="text-sm text-gray-500">{getSelectedTestsNames(item)}</Text>
        </View>

        <View className="flex-row space-x-2">
          <Pressable
            onPress={() => handleViewPatient(item)}
            className="flex-1 py-2.5 px-3 rounded-lg bg-purple-50 items-center border border-purple-200"
          >
            <FontAwesome name="user" size={14} color="#8B5CF6" style={{ marginBottom: 3 }} />
            <Text className="text-purple-700 font-medium text-xs">View Patient</Text>
          </Pressable>
          
          <Pressable
            onPress={() => handleSampleCollected(item)}
            className="flex-1 py-2.5 px-3 rounded-lg bg-orange-500 items-center shadow-sm"
            style={{
              shadowColor: '#F97316',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <FontAwesome 
              name="flask" 
              size={14} 
              color="white" 
              style={{ marginBottom: 3 }} 
            />
            <Text className="text-white font-medium text-xs">Sample Collected</Text>
          </Pressable>
        </View>

        {/* Payment Status - Show for all collection types */}
          <View className="mt-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs font-medium text-gray-600">Payment Status</Text>
              <View className="flex-row items-center">
                <View 
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                    item.isPaid ? 'bg-green-500' : 'bg-red-500'
                  }`} 
                />
                <Text className={`text-xs font-medium ${
                  item.isPaid ? 'text-green-700' : 'text-red-700'
                }`}>
                {item.isPaid 
                  ? (item.collectionType === 'home' ? 'Paid Online' : 'Payment Collected') 
                  : (item.collectionType === 'home' ? 'Payment Pending' : 'Payment Not Collected')
                }
                </Text>
              </View>
            </View>
          </View>
      </View>
    </View>
  );

  const renderProcessingAppointment = ({ item }: { item: LabAppointment }) => (
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
              <View className="w-16 h-16 rounded-full bg-orange-100 items-center justify-center">
                <FontAwesome name="user" size={24} color="#F97316" />
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
          
          <View className={`px-3 py-1 rounded-full ${
            item.status === 'completed' ? 'bg-green-100' : 'bg-orange-100'
          }`}>
            <Text className={`text-xs font-medium ${
              item.status === 'completed' ? 'text-green-700' : 'text-orange-700'
            }`}>
              {item.status === 'completed' ? 'Completed' : 'Processing'}
            </Text>
          </View>
        </View>

        <View className="bg-gray-50 rounded-xl p-3 mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Test Package</Text>
          <Text className="text-sm text-gray-600">{item.laboratoryService?.name || 'Service not available'}</Text>
          <Text className="text-sm text-gray-500">{getSelectedTestsNames(item)}</Text>
        </View>

        <View className="flex-row space-x-2">
          <Pressable
            onPress={() => handleViewPatient(item)}
            className="flex-1 py-2.5 px-3 rounded-lg bg-orange-50 items-center border border-orange-200"
          >
            <FontAwesome name="user" size={14} color="#F97316" style={{ marginBottom: 3 }} />
            <Text className="text-orange-700 font-medium text-xs">View Patient</Text>
          </Pressable>
          
          {(() => {
                const hasReportDetails = item.reportResult && item.reportResult.trim() !== '';
                const hasPdfs = item.testReportPdfs && item.testReportPdfs.length > 0;
            const reportsComplete = hasReportDetails && hasPdfs;
            
            // If status is completed, show Mark as Read button
            if (item.status === 'completed') {
              return (
                <Pressable
                  onPress={() => handleMarkAsRead(item)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-green-500 items-center shadow-sm"
                  style={{
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <FontAwesome 
                    name="check-circle" 
                    size={14} 
                    color="white" 
                    style={{ marginBottom: 3 }} 
                  />
                  <Text className="text-white font-medium text-xs">Mark as Read</Text>
                </Pressable>
              );
                } else {
              // If status is processing, show Upload Reports button
              return (
                <Pressable
                  onPress={() => handleAddReport(item)}
                  className="flex-1 py-2.5 px-3 rounded-lg bg-blue-500 items-center shadow-sm"
                  style={{
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  <FontAwesome 
                    name="upload" 
                    size={14} 
                    color="white" 
                    style={{ marginBottom: 3 }} 
                  />
                  <Text className="text-white font-medium text-xs">
                    {!hasReportDetails && !hasPdfs ? 'Upload Reports' : 
                     !hasReportDetails ? 'Add Details' : 'Add PDFs'}
                  </Text>
                </Pressable>
              );
                }
              })()}
        </View>

        {/* Payment Status - Show for all collection types */}
          <View className="mt-2.5 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
            <View className="flex-row justify-between items-center">
              <Text className="text-xs font-medium text-gray-600">Payment Status</Text>
              <View className="flex-row items-center">
                <View 
                  className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  item.isPaid ? 'bg-green-500' : 'bg-red-500'
                  }`} 
                />
                <Text className={`text-xs font-medium ${
                item.isPaid ? 'text-green-700' : 'text-red-700'
                }`}>
                {item.isPaid 
                  ? (item.collectionType === 'home' ? 'Paid Online' : 'Payment Collected') 
                  : (item.collectionType === 'home' ? 'Payment Pending' : 'Payment Not Collected')
                }
            </Text>
        </View>
            </View>
          </View>
      </View>
    </View>
  );

  const renderCompletedAppointment = ({ item }: { item: LabAppointment }) => (
    <View className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center">
        <View className="mr-3">
          {item.patient.profilePicture ? (
            <Image
              source={{ uri: item.patient.profilePicture }}
              className="w-12 h-12 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-green-100 items-center justify-center">
              <FontAwesome name="user" size={20} color="#10B981" />
            </View>
          )}
        </View>
        
        <View className="flex-1 items-start">
          <Text className="text-lg font-semibold text-gray-900 text-center">{item.patient.name}</Text>
          <Text className="text-gray-600 text-sm text-center">{item.laboratoryService?.name || 'Service not available'}</Text>
          <Text className="text-gray-500 text-xs text-center">{formatAppointmentTime(item.timeSlot, item.timeSlotDisplay)}</Text>
          
          {/* Feedback Status */}
          <View className="mt-2 flex-row items-center justify-center">
            <View 
              className={`px-2 py-1 rounded-full ${
                item.feedbackRequested 
                  ? 'bg-yellow-100 border border-yellow-200' 
                  : 'bg-gray-100 border border-gray-200'
              }`}
            >
              <Text 
                className={`text-xs font-medium ${
                  item.feedbackRequested ? 'text-yellow-700' : 'text-gray-600'
                }`}
              >
                {item.feedbackRequested ? 'Feedback Requested' : 'No Feedback Requested'}
              </Text>
            </View>
          </View>
          
          {/* Payment Status */}
          <View className="mt-2 flex-row items-center justify-center">
            <View 
              className={`px-2 py-1 rounded-full ${
                item.isPaid 
                  ? 'bg-green-100 border border-green-200' 
                  : 'bg-red-100 border border-red-200'
              }`}
            >
              <Text 
                className={`text-xs font-medium ${
                  item.isPaid ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {item.isPaid 
                  ? (item.collectionType === 'home' ? 'Paid Online' : 'Payment Collected') 
                  : (item.collectionType === 'home' ? 'Payment Pending' : 'Payment Not Collected')
                }
              </Text>
            </View>
          </View>
        </View>
        
        <View className="flex-col space-y-1.5 ml-3">
          <Pressable
            onPress={() => handleViewPatient(item)}
            className="bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-200 items-center"
          >
            <FontAwesome name="user" size={10} color="#10B981" style={{ marginBottom: 1 }} />
            <Text className="text-green-700 text-xs font-medium">Patient</Text>
          </Pressable>
          
          <Pressable
            onPress={() => handleAddReport(item)}
            className="bg-blue-50 px-2.5 py-1.5 rounded-lg border border-blue-200 items-center"
          >
            <FontAwesome 
              name="upload" 
              size={10} 
              color="#3B82F6" 
              style={{ marginBottom: 1 }} 
            />
            <Text className="text-blue-700 text-xs font-medium">
              {item.reportResult ? 'Edit Report' : 'Add Report'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

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
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            colors={['#8B5CF6', '#10B981', '#F59E0B']}
            tintColor="#8B5CF6"
            title="Pull to refresh"
            titleColor="#6B7280"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="p-6 pt-2">
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-gray-900 mb-2">Laboratory Dashboard</Text>
            <Text className="text-gray-600">Manage your lab tests and patient reports</Text>
          </View>

          {/* Stats Cards */}
          <View className="flex-row space-x-3 mb-8">
            {/* Pending Tests */}
            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <View className="items-center">
                <View className="bg-purple-100 rounded-full p-2 mb-2 self-center">
                  <FontAwesome name="clock-o" size={14} color="#8B5CF6" />
                </View>
                <Text className="text-xl font-bold text-gray-900 text-center">{dashboardData?.totalPending || 0}</Text>
                <Text className="text-xs text-gray-600 font-medium text-center">Pending</Text>
              </View>
            </View>
            
            {/* Processing Tests */}
            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <View className="items-center">
                <View className="bg-orange-100 rounded-full p-2 mb-2 self-center">
                  <FontAwesome name="flask" size={14} color="#F97316" />
                </View>
                <Text className="text-xl font-bold text-gray-900 text-center">{dashboardData?.totalProcessing || 0}</Text>
                <Text className="text-xs text-gray-600 font-medium text-center">Processing</Text>
              </View>
            </View>
            
            {/* Completed Tests */}
            <View className="flex-1 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <View className="items-center">
                <View className="bg-green-100 rounded-full p-2 mb-2 self-center">
                  <FontAwesome name="check-circle" size={14} color="#10B981" />
                </View>
                <Text className="text-xl font-bold text-gray-900 text-center">{dashboardData?.totalCompleted || 0}</Text>
                <Text className="text-xs text-gray-600 font-medium text-center">Completed</Text>
              </View>
            </View>
          </View>

          {/* Upcoming Appointments */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Upcoming Tests ({filterAppointments(dashboardData?.pendingAppointments).length || 0})
            </Text>
            
            {filterAppointments(dashboardData?.pendingAppointments).length > 0 ? (
              <View>
                {filterAppointments(dashboardData?.pendingAppointments).map((item) => renderPendingAppointment({ item }))}
              </View>
            ) : (
              <View className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-3xl p-8 shadow-sm border border-purple-100 items-center">
                <View className="bg-purple-100 rounded-full p-4 mb-4">
                  <FontAwesome name="flask" size={40} color="#8B5CF6" />
                </View>
                <Text className="text-xl font-bold text-gray-900 mb-2">No upcoming tests</Text>
                <Text className="text-gray-600 text-center leading-relaxed">
                  Your upcoming lab tests will appear here. Patients can book test packages with you.
                </Text>
              </View>
            )}
          </View>

          {/* Processing Appointments */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Processing & Completed Tests ({filterAppointments(dashboardData?.processingAppointments).length || 0})
            </Text>
            
            {filterAppointments(dashboardData?.processingAppointments).length > 0 ? (
              <View>
                {filterAppointments(dashboardData?.processingAppointments).map((item) => renderProcessingAppointment({ item }))}
              </View>
            ) : (
              <View className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-8 shadow-sm border border-orange-100 items-center">
                <View className="bg-orange-100 rounded-full p-4 mb-4">
                  <FontAwesome name="flask" size={40} color="#F97316" />
                </View>
                <Text className="text-xl font-bold text-gray-900 mb-2">No processing or completed tests</Text>
                <Text className="text-gray-600 text-center leading-relaxed">
                  Processing and completed tests will appear here.
                </Text>
              </View>
            )}
          </View>

          {/* Completed Appointments */}
          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-4">Recent Tests</Text>
            
            {filterAppointments(dashboardData?.completedAppointments).length > 0 ? (
              <View>
                {filterAppointments(dashboardData?.completedAppointments).map((item) => renderCompletedAppointment({ item }))}
              </View>
            ) : (
              <View className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-sm border border-green-100 items-center">
                <View className="bg-green-100 rounded-full p-3 mb-3">
                  <FontAwesome name="file-text" size={28} color="#059669" />
                </View>
                <Text className="text-lg font-semibold text-gray-900 mb-1">No completed tests</Text>
                <Text className="text-gray-600 text-center text-sm">
                  Completed tests and reports will appear here
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
          presentationStyle="fullScreen"
        >
        
          <View className="flex-1 bg-black/50" style={{ zIndex: 1000 }}>
            <View className="bg-white w-full h-full" style={{ zIndex: 1001 }}>
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
                  <View className="flex-row items-center mb-6 p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl">
                    {selectedAppointment.patient.profilePicture ? (
                      <Image
                        source={{ uri: selectedAppointment.patient.profilePicture }}
                        className="w-20 h-20 rounded-full mr-4"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 rounded-full bg-purple-100 items-center justify-center mr-4">
                        <FontAwesome name="user" size={32} color="#8B5CF6" />
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
                      <FontAwesome name="user-circle" size={18} color="#8B5CF6" style={{ marginRight: 8 }} />
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

                  {/* Test Information */}
                  <View className="mb-6">
                    <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                      <FontAwesome name="flask" size={18} color="#8B5CF6" style={{ marginRight: 8 }} />
                      Test Details
                    </Text>
                    <View className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <View className="flex-row justify-between">
                        <Text className="text-sm font-medium text-gray-700">Test Package</Text>
                        <Text className="text-gray-900">{selectedAppointment.laboratoryService?.name || 'Service not available'}</Text>
                      </View>
                      
                      <View className="flex-row justify-between">
                        <Text className="text-sm font-medium text-gray-700">Selected Tests</Text>
                        <Text className="text-gray-900">{getSelectedTestsNames(selectedAppointment)}</Text>
                      </View>
                      
                      <View className="flex-row justify-between">
                        <Text className="text-sm font-medium text-gray-700">Collection Type</Text>
                        <View className="flex-row items-center">
                          <View 
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ 
                              backgroundColor: selectedAppointment.collectionType === 'home' ? '#F59E0B' : '#8B5CF6' 
                            }}
                          />
                          <Text className="text-gray-900 capitalize">{selectedAppointment.collectionType}</Text>
                        </View>
                      </View>
                      
                      <View className="flex-row justify-between">
                        <Text className="text-sm font-medium text-gray-700">Status</Text>
                        <View 
                          className="px-3 py-1 rounded-full"
                          style={{ 
                            backgroundColor: selectedAppointment.status === 'pending' || selectedAppointment.status === 'upcoming' ? '#FEF3C7' : 
                                       selectedAppointment.status === 'processing' || selectedAppointment.status === 'collected' ? '#FED7AA' : '#D1FAE5' 
                          }}
                        >
                          <Text 
                            className="text-xs font-medium"
                            style={{ 
                              color: selectedAppointment.status === 'pending' || selectedAppointment.status === 'upcoming' ? '#D97706' : 
                                     selectedAppointment.status === 'processing' || selectedAppointment.status === 'collected' ? '#EA580C' : '#059669' 
                            }}
                          >
                            {selectedAppointment.status === 'pending' || selectedAppointment.status === 'upcoming' ? 'Pending' : 
                             selectedAppointment.status === 'processing' || selectedAppointment.status === 'collected' ? 'Processing' : 'Completed'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Test Reports Section */}
                  {(selectedAppointment.reportResult || selectedAppointment.testReportPdfs?.length || selectedAppointment.notes) && (
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                        <FontAwesome name="file-text" size={18} color="#10B981" style={{ marginRight: 8 }} />
                        Test Reports
                      </Text>
                      <View className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                        {selectedAppointment.reportResult && (
                          <View>
                            <Text className="text-sm font-medium text-gray-700 mb-2">Report Details</Text>
                            <Text className="text-gray-900 text-sm leading-relaxed">
                              {selectedAppointment.reportResult}
                            </Text>
                          </View>
                        )}
                        
                        {selectedAppointment.testReportPdfs && selectedAppointment.testReportPdfs.length > 0 && (
                          <View>
                            <Text className="text-sm font-medium text-gray-700 mb-2">Test Report PDFs</Text>
                            <View className="space-y-2">
                              {selectedAppointment.testReportPdfs.map((pdf, index) => (
                                <View key={index} className="flex-row items-center bg-gray-50 rounded-lg p-3">
                                  <FontAwesome name="file-pdf-o" size={16} color="#EF4444" style={{ marginRight: 8 }} />
                                  <View className="flex-1">
                                    <Text className="text-sm text-gray-700 font-medium">Test Report {index + 1}</Text>
                                    <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                                      {pdf.length > 50 ? pdf.substring(0, 50) + '...' : pdf}
                                    </Text>
                                  </View>
                                  <Pressable 
                                    onPress={() => handleViewDocument(pdf, `Test Report ${index + 1}`)}
                                    className="bg-blue-500 px-3 py-2 rounded-lg"
                                  >
                                    <Text className="text-white text-xs font-medium">View</Text>
                                  </Pressable>
                                </View>
                              ))}
                            </View>
                          </View>
                        )}
                        
                        {selectedAppointment.notes && (
                          <View>
                            <Text className="text-sm font-medium text-gray-700 mb-2">Laboratory Notes</Text>
                            <Text className="text-gray-900 text-sm leading-relaxed">
                              {selectedAppointment.notes}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Prescription Section */}
                  {(selectedAppointment.patient.prescriptionUrl || selectedAppointment.patient.prescriptionPdfs?.length) && (
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                        <FontAwesome name="medkit" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                        Prescription
                      </Text>
                      <View className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                        {selectedAppointment.patient.prescriptionUrl && (
                          <View className="flex-row items-center bg-gray-50 rounded-lg p-3">
                            <FontAwesome name="file-pdf-o" size={16} color="#EF4444" style={{ marginRight: 8 }} />
                            <View className="flex-1">
                              <Text className="text-sm text-gray-700 font-medium">Prescription</Text>
                              <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                                {selectedAppointment.patient.prescriptionUrl.length > 50 ? selectedAppointment.patient.prescriptionUrl.substring(0, 50) + '...' : selectedAppointment.patient.prescriptionUrl}
                              </Text>
                            </View>
                            <View className="flex-row space-x-2">
                              <Pressable 
                                onPress={() => {
                                  if (selectedAppointment.patient.prescriptionUrl) {
                                    handleViewPrescription(selectedAppointment.patient.prescriptionUrl);
                                  }
                                }}
                                className="bg-blue-500 px-3 py-2 rounded-lg"
                              >
                                <Text className="text-white text-xs font-medium">View</Text>
                              </Pressable>
                              <Pressable 
                                onPress={() => {
                                  if (selectedAppointment.patient.prescriptionUrl) {
                                    handleDownloadPrescription(selectedAppointment.patient.prescriptionUrl);
                                  }
                                }}
                                className="bg-green-500 px-3 py-2 rounded-lg"
                              >
                                <Text className="text-white text-xs font-medium">Download</Text>
                              </Pressable>
                            </View>
                          </View>
                        )}
                        
                        {selectedAppointment.patient.prescriptionPdfs && selectedAppointment.patient.prescriptionPdfs.length > 0 && (
                          <View>
                            <Text className="text-sm font-medium text-gray-700 mb-2">Prescription PDFs</Text>
                            <View className="space-y-2">
                              {selectedAppointment.patient.prescriptionPdfs.map((pdf, index) => (
                                <View key={index} className="flex-row items-center bg-gray-50 rounded-lg p-3">
                                  <FontAwesome name="file-pdf-o" size={16} color="#EF4444" style={{ marginRight: 8 }} />
                                  <View className="flex-1">
                                    <Text className="text-sm text-gray-700 font-medium">Prescription {index + 1}</Text>
                                    <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                                      {pdf.length > 50 ? pdf.substring(0, 50) + '...' : pdf}
                                    </Text>
                                  </View>
                                  <View className="flex-row space-x-2">
                                    <Pressable 
                                      onPress={() => handleViewPrescription(pdf)}
                                      className="bg-blue-500 px-3 py-2 rounded-lg"
                                    >
                                      <Text className="text-white text-xs font-medium">View</Text>
                                    </Pressable>
                                    <Pressable 
                                      onPress={() => handleDownloadPrescription(pdf)}
                                      className="bg-green-500 px-3 py-2 rounded-lg"
                                    >
                                      <Text className="text-white text-xs font-medium">Download</Text>
                                    </Pressable>
                                  </View>
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
                        <Text className="text-sm font-medium text-gray-700">Created</Text>
                        <Text className="text-gray-900">
                          {new Date(selectedAppointment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Text>
                      </View>
                    </View>
                  </View>

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
                          handleAddReport(selectedAppointment);
                        }}
                        className="flex-1 py-3 px-4 rounded-xl bg-green-500 items-center"
                      >
                        <FontAwesome name="upload" size={16} color="white" style={{ marginBottom: 4 }} />
                        <Text className="text-white font-medium text-sm">Upload Test Reports</Text>
                      </Pressable>
                    </View>
                    
                    {/* Mark as Read Button - Only show for processing appointments */}
                    {(selectedAppointment.status === 'processing' || selectedAppointment.status === 'collected') && (
                      <View className="mt-3">
                        <Pressable
                          onPress={() => handleMarkAsRead(selectedAppointment)}
                          disabled={!selectedAppointment.reportsUploaded}
                          className={`py-3 px-4 rounded-xl items-center ${
                            (() => {
                              const hasReportDetails = selectedAppointment.reportResult && selectedAppointment.reportResult.trim() !== '';
                              const hasPdfs = selectedAppointment.testReportPdfs && selectedAppointment.testReportPdfs.length > 0;
                              return hasReportDetails && hasPdfs ? 'bg-blue-500' : 'bg-gray-300';
                            })()
                          }`}
                        >
                          <FontAwesome 
                            name="check-circle" 
                            size={16} 
                            color="white" 
                            style={{ marginBottom: 4 }} 
                          />
                          <Text className="text-white font-medium text-sm text-center">
                            {(() => {
                              const hasReportDetails = selectedAppointment.reportResult && selectedAppointment.reportResult.trim() !== '';
                              const hasPdfs = selectedAppointment.testReportPdfs && selectedAppointment.testReportPdfs.length > 0;
                              
                              if (!hasReportDetails && !hasPdfs) {
                                return 'No Reports Uploaded';
                              } else if (!hasReportDetails) {
                                return 'Missing Report Details';
                              } else if (!hasPdfs) {
                                return 'Missing PDFs';
                              } else {
                                return 'Mark as Read';
                              }
                            })()}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
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
            presentationStyle="fullScreen"
          >
            <View className="flex-1 bg-black/50" style={{ zIndex: 1000 }}>
              <View className="bg-white w-full h-full" style={{ zIndex: 1001 }}>
                {/* Header */}
                <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
                  <Text className="text-xl font-bold text-gray-900">Upload Test Reports</Text>
                  <Pressable onPress={() => setShowReportModal(false)}>
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
                        Test: {selectedAppointment.laboratoryService?.name || 'Service not available'}
                      </Text>
                    </View>
                    
                    {/* Report Section */}
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                        <FontAwesome name="file-text" size={18} color="#10B981" style={{ marginRight: 8 }} />
                        Report Details
                      </Text>
                      <View className="bg-white border border-gray-200 rounded-xl p-4">
                        <TextInput
                          value={reportText}
                          onChangeText={setReportText}
                          placeholder="Enter detailed test report including results, observations, and recommendations..."
                          multiline
                          numberOfLines={6}
                          className="text-gray-900 text-sm leading-relaxed"
                          textAlignVertical="top"
                          style={{ minHeight: 100 }}
                        />
                      </View>
                      <Text className="text-xs text-gray-500 mt-2">
                        This report will be sent to the patient and saved in their medical records.
                      </Text>
                    </View>
                    
                    {/* Notes Section */}
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                        <FontAwesome name="edit" size={18} color="#8B5CF6" style={{ marginRight: 8 }} />
                        Laboratory Notes
                      </Text>
                      <View className="bg-white border border-gray-200 rounded-xl p-4">
                        <TextInput
                          value={notesText}
                          onChangeText={setNotesText}
                          placeholder="Enter private notes, observations, or any additional information for your records..."
                          multiline
                          numberOfLines={4}
                          className="text-gray-900 text-sm leading-relaxed"
                          textAlignVertical="top"
                          style={{ minHeight: 80 }}
                        />
                      </View>
                      <Text className="text-xs text-gray-500 mt-2">
                        These notes are private and will not be shared with the patient.
                      </Text>
                    </View>

                    {/* PDF Upload Section */}
                    <View className="mb-6">
                      <Text className="text-lg font-semibold text-gray-900 mb-4 flex-row items-center">
                        <FontAwesome name="upload" size={18} color="#F59E0B" style={{ marginRight: 8 }} />
                        Test Report PDFs
                      </Text>
                      <View className="bg-white border border-gray-200 rounded-xl p-4">
                        <Pressable
                          onPress={handleDocumentPick}
                          className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center"
                        >
                          <FontAwesome name="upload" size={24} color="#6B7280" style={{ marginBottom: 8 }} />
                          <Text className="text-gray-700 font-medium text-base">Upload Test Report PDF</Text>
                          <Text className="text-gray-500 text-sm mt-1">Tap to select PDF file</Text>
                        </Pressable>
                        
                        {testReportPdfs.length > 0 && (
                          <View className="mt-4 space-y-2">
                            <Text className="text-sm font-medium text-gray-700 mb-2">Uploaded PDFs:</Text>
                            {testReportPdfs.map((pdf, index) => (
                              <View key={index} className="flex-row items-center bg-gray-50 rounded-lg p-3">
                                <FontAwesome name="file-pdf-o" size={16} color="#EF4444" style={{ marginRight: 8 }} />
                                <View className="flex-1">
                                  <Text className="text-sm text-gray-700 font-medium">Test Report {index + 1}</Text>
                                  <Text className="text-xs text-gray-500 mt-1" numberOfLines={1}>
                                    {pdf.length > 50 ? pdf.substring(0, 50) + '...' : pdf}
                                  </Text>
                                </View>
                                <View className="flex-row space-x-2">
                                <Pressable 
                                  onPress={() => handleViewDocument(pdf, `Test Report ${index + 1}`)}
                                  className="bg-blue-500 px-3 py-2 rounded-lg"
                                >
                                  <Text className="text-white text-xs font-medium">View</Text>
                                </Pressable>
                                  <Pressable 
                                    onPress={() => handleRemovePdf(index)}
                                    className="bg-red-500 px-3 py-2 rounded-lg"
                                  >
                                    <Text className="text-white text-xs font-medium">Remove</Text>
                                  </Pressable>
                                </View>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-gray-500 mt-2">
                        Upload PDF reports for each test. These will be shared with the patient.
                      </Text>
                    </View>

                    {/* Action Buttons */}
                    <View className="mt-8 mb-4">
                      <View className="flex-row space-x-2">
                        {/* Delete Button - Only show if there's existing report data */}
                        {(selectedAppointment?.reportResult || selectedAppointment?.testReportPdfs?.length || reportText.trim() || testReportPdfs.length > 0) && (
                          <Pressable
                            onPress={handleDeleteReport}
                            className="flex-1 py-4 px-6 rounded-2xl bg-red-500 items-center shadow-lg"
                            style={{
                              shadowColor: '#EF4444',
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.3,
                              shadowRadius: 8,
                              elevation: 6,
                            }}
                          >
                            <FontAwesome name="trash" size={18} color="white" style={{ marginBottom: 6 }} />
                            <Text className="text-white font-semibold text-base">Delete Report</Text>
                            <Text className="text-red-100 text-xs mt-1">Move to processing</Text>
                          </Pressable>
                        )}
                        
                        <Pressable
                          onPress={() => {
                            setShowReportModal(false);
                            setReportText('');
                            setNotesText('');
                            setTestReportPdfs([]);
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
                          onPress={handleSaveReport}
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
                              The test reports will be sent to the patient immediately. Notes are private and for your records only.
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

          {/* Prescription Modal */}
          <Modal
            visible={showPrescriptionModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowPrescriptionModal(false)}
            presentationStyle="fullScreen"
          >
            <View className="flex-1 bg-black/50" style={{ zIndex: 1000 }}>
              <View className="bg-white w-full h-full" style={{ zIndex: 1001 }}>
                {/* Header */}
                <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
                  <Text className="text-xl font-bold text-gray-900">Prescription</Text>
                    <Pressable onPress={() => setShowPrescriptionModal(false)}>
                    <FontAwesome name="times" size={24} color="#6B7280" />
                    </Pressable>
                </View>

                {selectedPrescription && (
                  <ScrollView 
                    className="flex-1 p-6"
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={{ paddingBottom: 20 }}
                  >
                    <View className="bg-white border border-gray-200 rounded-xl p-4">
                              <Pressable
                        onPress={() => handleViewPrescription(selectedPrescription)}
                        className="border-2 border-dashed border-gray-300 rounded-xl p-6 items-center"
                      >
                        <FontAwesome name="upload" size={24} color="#6B7280" style={{ marginBottom: 8 }} />
                        <Text className="text-gray-700 font-medium text-base">View Prescription</Text>
                        <Text className="text-gray-500 text-sm mt-1">Tap to view prescription</Text>
                              </Pressable>
                      
                  <Pressable
                        onPress={() => handleDownloadPrescription(selectedPrescription)}
                        className="mt-4 border-2 border-dashed border-gray-300 rounded-xl p-6 items-center"
                  >
                        <FontAwesome name="download" size={24} color="#6B7280" style={{ marginBottom: 8 }} />
                        <Text className="text-gray-700 font-medium text-base">Download Prescription</Text>
                        <Text className="text-gray-500 text-sm mt-1">Tap to download</Text>
                  </Pressable>
                </View>
                  </ScrollView>
                )}
              </View>
            </View>
          </Modal>

          <AlertComponent />
        </ScrollView>

        {/* Floating Action Button for Product Management */}
        <View className="absolute bottom-10 right-6 items-end w-full px-2">
          <Pressable
            onPress={() => router.push('/laboratory/product-management')}
            className="w-16 h-16 bg-blue-500 rounded-full items-center justify-center shadow-lg"
            style={{
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.35,
              shadowRadius: 16,
              elevation: 12,
              justifyContent: 'center',
              alignItems: 'center',
              paddingBottom: 0,
              borderWidth: 2,
              borderColor: '#2563EB',
              marginBottom: 15,
              marginRight: 0, // Add margin to avoid touching the navigation bar
            }}
          >
            <FontAwesome name="plus" size={28} color="white" />

          </Pressable>
          <Text className="mt-2 text-xs text-blue-700 font-medium">Manage Products</Text>
        </View>
      </SafeAreaView>
    );
  };

  export default LaboratoryDashboard;