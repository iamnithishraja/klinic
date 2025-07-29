import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { IconSymbol } from '@/components/ui/IconSymbol';
import useProfileApi from '@/hooks/useProfileApi';
import { Colors } from '@/constants/Colors';

interface PrescriptionUploadProps {
  onUploadComplete: (url: string) => void;
  isUploading?: boolean;
}

export const PrescriptionUpload: React.FC<PrescriptionUploadProps> = ({
  onUploadComplete,
  isUploading = false,
}) => {
  const { uploadFile } = useProfileApi({ endpoint: '/api/v1/user-profile' });
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

        setIsProcessing(true);
        
        try {
          // Upload prescription using existing upload system
          const publicUrl = await uploadFile('application/pdf', file.name || `prescription-${Date.now()}.pdf`, file.uri);
          
          if (publicUrl) {
          setUploadedUrl(publicUrl);
          onUploadComplete(publicUrl);
          Alert.alert('Success', 'Prescription uploaded successfully!');
          } else {
            throw new Error('Failed to upload prescription');
          }
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert('Upload Failed', 'Failed to upload prescription. Please try again.');
        } finally {
          setIsProcessing(false);
        }
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to select document. Please try again.');
    }
  };

  const handleRemovePrescription = () => {
    Alert.alert(
      'Remove Prescription',
      'Are you sure you want to remove the uploaded prescription?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setUploadedUrl(null);
            onUploadComplete('');
          },
        },
      ]
    );
  };

  if (uploadedUrl) {
    return (
      <View style={styles.container}>
        <View style={styles.uploadedContainer}>
          <View style={styles.uploadedInfo}>
            <IconSymbol name="check-circle" size={20} color="#10B981" weight="medium" />
            <Text style={styles.uploadedText}>Prescription uploaded successfully</Text>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemovePrescription}
          >
            <IconSymbol name="trash" size={14} color="#EF4444" weight="medium" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.uploadButton, (isUploading || isProcessing) && styles.disabledButton]}
        onPress={handleDocumentPick}
        disabled={isUploading || isProcessing}
      >
        {(isUploading || isProcessing) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.light.tint} />
            <Text style={styles.loadingText}>
              {isUploading ? 'Uploading...' : 'Processing...'}
            </Text>
          </View>
        ) : (
          <>
            <IconSymbol name="upload" size={20} color={Colors.light.tint} weight="medium" />
            <Text style={styles.uploadText}>Upload Prescription</Text>
            <Text style={styles.uploadSubtext}>PDF files only, max 5MB</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 1, // Reduced from 16
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: Colors.light.tint,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 1, // Reduced from 24
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  disabledButton: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2, // Reduced from 12
  },
  loadingText: {
    fontSize: 14, // Reduced from 16
    color: Colors.light.tint,
    fontWeight: '500',
  },
  uploadText: {
    fontSize: 14, // Reduced from 16
    color: Colors.light.tint,
    fontWeight: '600',
    marginTop: 6, // Reduced from 8
    marginBottom: 2, // Reduced from 4
  },
  uploadSubtext: {
    fontSize: 12, // Reduced from 14
    color: Colors.light.icon,
  },
  uploadedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12, // Reduced from 16
  },
  uploadedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // Reduced from 12
  },
  uploadedText: {
    fontSize: 14, // Reduced from 16
    color: '#166534',
    fontWeight: '500',
  },
  removeButton: {
    padding: 6, // Reduced from 8
  },
}); 