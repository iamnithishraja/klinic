import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import useProfileApi from '@/hooks/useProfileApi';
import { orderService } from '@/services/orderService';
import PrescriptionPaymentModal from '@/components/payment/PrescriptionPaymentModal';

const { width, height } = Dimensions.get('window');

interface PrescriptionUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PrescriptionUploadModal: React.FC<PrescriptionUploadModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { uploadFile } = useProfileApi({ endpoint: '/api/v1/user-profile' });
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    uri: string;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file size (5MB limit)
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Please select a PDF file smaller than 5MB.');
          return;
        }

        setSelectedFile({
          name: file.name || `prescription-${Date.now()}.pdf`,
          size: file.size || 0,
          uri: file.uri,
        });
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };

  const handleUploadAndCreateOrder = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select a prescription file first.');
      return;
    }

    setIsUploading(true);
    setIsCreatingOrder(true);

    try {
      // Upload prescription using existing upload system
      const publicUrl = await uploadFile(
        'application/pdf',
        selectedFile.name,
        selectedFile.uri
      );

      if (!publicUrl) {
        throw new Error('Failed to upload prescription');
      }

      // Prepare order data for payment (don't create order yet)
      const orderData = {
        prescription: publicUrl,
        needAssignment: true, // This flag tells admin to assign laboratory
        totalPrice: 0, // Will be calculated after laboratory assignment
        products: [], // No products for prescription-only orders
      };

      console.log('Preparing prescription order data:', orderData);

      // Store order data and show payment modal
      setOrderData(orderData);
      setShowPaymentModal(true);
    } catch (error) {
      console.error('Error preparing prescription order:', error);
      Alert.alert(
        'Error', 
        'Failed to prepare prescription order. Please try again or contact support if the issue persists.'
      );
    } finally {
      setIsUploading(false);
      setIsCreatingOrder(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setIsCreatingOrder(false);
    setCreatedOrder(null);
    setOrderData(null);
    setShowPaymentModal(false);
    onClose();
  };

  const handlePaymentSuccess = () => {
    setCreatedOrder(null);
    setOrderData(null);
    setShowPaymentModal(false);
    onSuccess();
    handleClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton} activeOpacity={0.7}>
            <IconSymbol name="x" size={24} color={Colors.light.text} weight="medium" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Prescription Order</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={true}>
          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <View style={styles.instructionsHeader}>
              <IconSymbol name="star" size={24} color={Colors.light.tint} weight="medium" />
              <Text style={styles.instructionsTitle}>How it works</Text>
            </View>
            <Text style={styles.instructionsText}>
              1. Upload your prescription PDF{'\n'}
              2. Our admin team reviews your prescription{'\n'}
              3. Admin assigns it to a suitable laboratory{'\n'}
              4. Laboratory processes and prices your order{'\n'}
              5. You receive notification to complete payment
            </Text>
          </View>

          {/* File Selection Area */}
          <View style={styles.fileSection}>
            <Text style={styles.sectionTitle}>Upload Prescription</Text>
            {selectedFile ? (
              <View style={styles.selectedFileContainer}>
                <View style={styles.fileInfo}>
                  <IconSymbol name="document-text" size={24} color="#10B981" weight="medium" />
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileName}>{selectedFile.name}</Text>
                    <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedFile(null)}
                  style={styles.removeFileButton}
                  activeOpacity={0.7}
                >
                  <IconSymbol name="trash" size={18} color="#EF4444" weight="medium" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadArea}
                onPress={handleDocumentPick}
                disabled={isUploading}
                activeOpacity={0.8}
              >
                <View style={styles.uploadIconContainer}>
                  <IconSymbol name="upload" size={32} color={Colors.light.tint} weight="light" />
                </View>
                <Text style={styles.uploadText}>Select Prescription PDF</Text>
                <Text style={styles.uploadSubtext}>PDF files only, max 5MB</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Upload Progress */}
          {isUploading && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color={Colors.light.tint} />
              <Text style={styles.progressText}>Uploading prescription...</Text>
            </View>
          )}

          {/* Order Summary */}
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Order Type</Text>
              <Text style={styles.summaryValue}>Prescription Only</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.summaryValue}>Pending Assignment</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Processing</Text>
              <Text style={styles.summaryValue}>Admin Review Required</Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleClose}
            disabled={isUploading || isCreatingOrder}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.createOrderButton,
              (!selectedFile || isUploading || isCreatingOrder) && styles.disabledButton,
            ]}
            onPress={handleUploadAndCreateOrder}
            disabled={!selectedFile || isUploading || isCreatingOrder}
            activeOpacity={0.8}
          >
            {isCreatingOrder ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <IconSymbol name="check-circle" size={20} color="#FFFFFF" weight="medium" />
            )}
            <Text style={styles.createOrderButtonText}>
              {isCreatingOrder ? 'Creating Order...' : 'Create Prescription Order'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Prescription Payment Modal */}
      {orderData && (
        <PrescriptionPaymentModal
          visible={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          orderData={orderData}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  instructionsContainer: {
    backgroundColor: '#F0F9FF',
    padding: 20,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  instructionsText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 22,
  },
  fileSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadText: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: '600',
    marginBottom: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 16,
    padding: 20,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fileDetails: {
    marginLeft: 16,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  fileSize: {
    fontSize: 14,
    color: '#166534',
    marginTop: 4,
  },
  removeFileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  progressText: {
    marginLeft: 12,
    fontSize: 16,
    color: Colors.light.text,
    fontWeight: '500',
  },
  summaryContainer: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  createOrderButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    gap: 8,
    shadowColor: Colors.light.tint,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  createOrderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
});

PrescriptionUploadModal.displayName = 'PrescriptionUploadModal';
export { PrescriptionUploadModal }; 