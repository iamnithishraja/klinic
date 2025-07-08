import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  Linking
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Appointment } from './types';

interface UserDashboardModalsProps {
  // Modal visibility states
  showPrescriptionModal: boolean;
  showReportModal: boolean;
  showPdfsModal: boolean;
  showNotesModal: boolean;
  showLabReportsListModal: boolean;

  // Modal data
  prescriptionData: any;
  reportData: any;
  pdfsData: any;
  notesData: any;
  allLabReports: Appointment[];

  // Modal handlers
  onClosePrescriptionModal: () => void;
  onCloseReportModal: () => void;
  onClosePdfsModal: () => void;
  onCloseNotesModal: () => void;
  onCloseLabReportsListModal: () => void;

  // Action handlers
  onViewLabReport: (testId: string) => void;
  onViewLabPdfs: (testId: string) => void;
  onViewLabNotes: (testId: string) => void;

  // Utility functions
  formatAppointmentTime: (timeSlot: string, timeSlotDisplay: string) => string;
}

const UserDashboardModals: React.FC<UserDashboardModalsProps> = ({
  showPrescriptionModal,
  showReportModal,
  showPdfsModal,
  showNotesModal,
  showLabReportsListModal,
  prescriptionData,
  reportData,
  pdfsData,
  notesData,
  allLabReports,
  onClosePrescriptionModal,
  onCloseReportModal,
  onClosePdfsModal,
  onCloseNotesModal,
  onCloseLabReportsListModal,
  onViewLabReport,
  onViewLabPdfs,
  onViewLabNotes,
  formatAppointmentTime
}) => {
  return (
    <>
      {/* Prescription Modal */}
      <Modal
        visible={showPrescriptionModal}
        transparent={true}
        animationType="slide"
        onRequestClose={onClosePrescriptionModal}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-full max-w-lg h-[80%]">
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Your Prescriptions</Text>
              <Pressable onPress={onClosePrescriptionModal}>
                <FontAwesome name="times" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-6">
              {prescriptionData?.appointments ? (
                prescriptionData.appointments.map((appointment: Appointment, index: number) => (
                  <View key={appointment._id} className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                    <View className="flex-row items-center mb-3">
                      <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                        <FontAwesome name="user-md" size={16} color="#3B82F6" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900">Dr. {appointment.providerName}</Text>
                        <Text className="text-sm text-gray-600">{formatAppointmentTime(appointment.timeSlot, appointment.timeSlotDisplay)}</Text>
                      </View>
                    </View>
                    
                    <View className="bg-white rounded-lg p-4 border border-gray-100">
                      <Text className="text-sm font-medium text-gray-700 mb-2">Prescription:</Text>
                      <Text className="text-gray-900 text-sm leading-relaxed">{appointment.prescription}</Text>
                    </View>
                  </View>
                ))
              ) : prescriptionData?.prescription ? (
                <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Prescription:</Text>
                  <Text className="text-gray-900 text-sm leading-relaxed">{prescriptionData.prescription}</Text>
                </View>
              ) : (
                <Text className="text-gray-600 text-center">No prescription data available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Lab Reports List Modal */}
      <Modal
        visible={showLabReportsListModal}
        transparent={true}
        animationType="slide"
        onRequestClose={onCloseLabReportsListModal}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-full max-w-lg h-[80%]">
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">All Lab Reports</Text>
              <Pressable onPress={onCloseLabReportsListModal}>
                <FontAwesome name="times" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-6">
              {allLabReports.length > 0 ? (
                allLabReports.map((report: Appointment, index: number) => (
                  <View key={report._id} className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                    <View className="flex-row items-center mb-3">
                      <View className="mr-3">
                        {report.packageCoverImage ? (
                          <Image
                            source={{ uri: report.packageCoverImage }}
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
                        <Text className="text-lg font-semibold text-gray-900">{report.providerName}</Text>
                        <Text className="text-sm text-gray-600">{report.serviceName}</Text>
                        <Text className="text-xs text-gray-500">{formatAppointmentTime(report.timeSlot, report.timeSlotDisplay)}</Text>
                      </View>
                    </View>
                    
                    {report.reportResult && (
                      <View className="bg-white rounded-lg p-3 border border-gray-100 mb-3">
                        <Text className="text-sm font-medium text-gray-700 mb-1">Report Summary:</Text>
                        <Text className="text-gray-900 text-sm" numberOfLines={3}>
                          {report.reportResult}
                        </Text>
                      </View>
                    )}
                    
                    {/* Three Action Buttons */}
                    {report.reportResult && (
                      <View className="flex-row space-x-2">
                        <Pressable
                          onPress={() => {
                            onCloseLabReportsListModal();
                            onViewLabReport(report._id);
                          }}
                          className="flex-1 bg-purple-100 px-3 py-2 rounded-lg items-center border border-purple-200"
                        >
                          <FontAwesome name="file-text" size={12} color="#8B5CF6" style={{ marginBottom: 2 }} />
                          <Text className="text-purple-700 text-xs font-medium">Report</Text>
                        </Pressable>
                        
                        <Pressable
                          onPress={() => {
                            onCloseLabReportsListModal();
                            onViewLabPdfs(report._id);
                          }}
                          className="flex-1 bg-red-100 px-3 py-2 rounded-lg items-center border border-red-200"
                        >
                          <FontAwesome name="file-pdf-o" size={12} color="#EF4444" style={{ marginBottom: 2 }} />
                          <Text className="text-red-700 text-xs font-medium">PDFs</Text>
                        </Pressable>
                        
                        <Pressable
                          onPress={() => {
                            onCloseLabReportsListModal();
                            onViewLabNotes(report._id);
                          }}
                          className="flex-1 bg-blue-100 px-3 py-2 rounded-lg items-center border border-blue-200"
                        >
                          <FontAwesome name="sticky-note" size={12} color="#3B82F6" style={{ marginBottom: 2 }} />
                          <Text className="text-blue-700 text-xs font-medium">Notes</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View className="items-center py-8">
                  <FontAwesome name="flask" size={48} color="#D1D5DB" />
                  <Text className="text-gray-600 text-center mt-4">No lab reports available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Lab Report PDFs Modal */}
      <Modal
        visible={showPdfsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={onClosePdfsModal}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-full max-w-lg h-[80%]">
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Report Documents</Text>
              <Pressable onPress={onClosePdfsModal}>
                <FontAwesome name="times" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-6">
              {pdfsData && pdfsData.testReportPdfs && pdfsData.testReportPdfs.length > 0 ? (
                <View>
                  <View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Laboratory:</Text>
                    <Text className="text-gray-900 text-sm">{pdfsData.labTest?.providerName}</Text>
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">Service:</Text>
                    <Text className="text-gray-900 text-sm">{pdfsData.labTest?.serviceName}</Text>
                  </View>
                  
                  <Text className="text-sm font-medium text-gray-700 mb-3">Available Documents ({pdfsData.testReportPdfs.length}):</Text>
                  {pdfsData.testReportPdfs.map((pdf: string, index: number) => (
                    <Pressable
                      key={index}
                      onPress={() => Linking.openURL(pdf)}
                      className="flex-row items-center bg-red-50 rounded-lg p-4 mb-3 border border-red-200"
                    >
                      <FontAwesome name="file-pdf-o" size={20} color="#EF4444" style={{ marginRight: 12 }} />
                      <View className="flex-1">
                        <Text className="text-red-700 text-sm font-medium">Report Document {index + 1}</Text>
                        <Text className="text-red-600 text-xs mt-1">Tap to open PDF</Text>
                      </View>
                      <FontAwesome name="external-link" size={14} color="#EF4444" />
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View className="items-center py-8">
                  <FontAwesome name="file-pdf-o" size={48} color="#D1D5DB" />
                  <Text className="text-gray-600 text-center mt-4">No PDF documents available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Lab Notes Modal */}
      <Modal
        visible={showNotesModal}
        transparent={true}
        animationType="slide"
        onRequestClose={onCloseNotesModal}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-full max-w-lg h-[80%]">
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Laboratory Notes</Text>
              <Pressable onPress={onCloseNotesModal}>
                <FontAwesome name="times" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-6">
              {notesData ? (
                <View>
                  <View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Laboratory:</Text>
                    <Text className="text-gray-900 text-sm">{notesData.labTest?.providerName}</Text>
                    <Text className="text-sm font-medium text-gray-700 mb-2 mt-2">Service:</Text>
                    <Text className="text-gray-900 text-sm">{notesData.labTest?.serviceName}</Text>
                  </View>
                  
                  <View className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <Text className="text-sm font-medium text-blue-700 mb-2">Laboratory Notes:</Text>
                    <Text className="text-blue-900 text-sm leading-relaxed">{notesData.notes}</Text>
                  </View>
                </View>
              ) : (
                <Text className="text-gray-600 text-center">No notes data available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Lab Report Detail Modal */}
      <Modal
        visible={showReportModal}
        transparent={true}
        animationType="slide"
        onRequestClose={onCloseReportModal}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-full max-w-lg h-[80%]">
            {/* Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
              <Text className="text-xl font-bold text-gray-900">Lab Report Details</Text>
              <Pressable onPress={onCloseReportModal}>
                <FontAwesome name="times" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <ScrollView className="flex-1 p-6">
              {reportData ? (
                <View>
                  <View className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Lab Report:</Text>
                    <Text className="text-gray-900 text-sm leading-relaxed">{reportData.report}</Text>
                  </View>
                  
                  {reportData.labTest?.testReportPdfs && reportData.labTest.testReportPdfs.length > 0 && (
                    <View className="mt-4">
                      <Text className="text-sm font-medium text-gray-700 mb-2">Report Documents:</Text>
                      {reportData.labTest.testReportPdfs.map((pdf: string, index: number) => (
                        <Pressable
                          key={index}
                          onPress={() => Linking.openURL(pdf)}
                          className="flex-row items-center bg-blue-50 rounded-lg p-3 mb-2 border border-blue-200"
                        >
                          <FontAwesome name="file-pdf-o" size={16} color="#EF4444" style={{ marginRight: 8 }} />
                          <Text className="text-blue-700 text-sm font-medium flex-1">Report Document {index + 1}</Text>
                          <FontAwesome name="external-link" size={12} color="#3B82F6" />
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              ) : (
                <Text className="text-gray-600 text-center">No report data available</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default UserDashboardModals; 