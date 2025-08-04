import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { accountDeletionService } from '@/services/accountDeletionService';
import { useUserStore } from '@/store/userStore';
import { useRouter } from 'expo-router';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({ visible, onClose }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [deletionStatus, setDeletionStatus] = useState<any>(null);
  const [step, setStep] = useState<'reason' | 'confirm' | 'pending'>('reason');
  const user = useUserStore(state => state.user);
  const clearUser = useUserStore(state => state.clearUser);
  const router = useRouter();

  useEffect(() => {
    if (visible) {
      checkDeletionStatus();
    }
  }, [visible]);

  const checkDeletionStatus = async () => {
    try {
      const status = await accountDeletionService.getDeletionStatus();
      setDeletionStatus(status);
      if (status.hasPendingRequest) {
        setStep('pending');
      } else {
        setStep('reason');
      }
    } catch (error) {
      console.error('Error checking deletion status:', error);
    }
  };

  const handleRequestDeletion = async () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for account deletion');
      return;
    }

    try {
      setLoading(true);
      await accountDeletionService.requestDeletion(reason.trim());
      setStep('confirm');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to request account deletion');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDeletion = async () => {
    Alert.alert(
      'Confirm Account Deletion',
      'This action cannot be undone. All your data will be permanently deleted. Are you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await accountDeletionService.confirmDeletion();
              Alert.alert(
                'Account Deleted',
                'Your account has been successfully deleted. You will be logged out.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      clearUser();
                      router.replace('/');
                      onClose();
                    }
                  }
                ]
              );
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete account');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCancelDeletion = async () => {
    try {
      setLoading(true);
      await accountDeletionService.cancelDeletion();
      setStep('reason');
      setReason('');
      setDeletionStatus(null);
      Alert.alert('Success', 'Account deletion request cancelled');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to cancel deletion request');
    } finally {
      setLoading(false);
    }
  };

  const renderReasonStep = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Delete Account</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <FontAwesome name="times" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <Text style={styles.warning}>
        ⚠️ This action cannot be undone. All your data will be permanently deleted.
      </Text>

      <Text style={styles.label}>Reason for deletion (required)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Please tell us why you want to delete your account..."
        value={reason}
        onChangeText={setReason}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onClose}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deleteButton, !reason.trim() && styles.deleteButtonDisabled]}
          onPress={handleRequestDeletion}
          disabled={loading || !reason.trim()}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <FontAwesome name="trash" size={16} color="white" />
              <Text style={styles.deleteButtonText}>Request Deletion</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderConfirmStep = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Confirm Deletion</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <FontAwesome name="times" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <Text style={styles.warning}>
        ⚠️ Your account deletion request has been submitted.
      </Text>

      <Text style={styles.description}>
        You can now confirm the deletion to permanently delete your account and all associated data.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelDeletion}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleConfirmDeletion}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <FontAwesome name="trash" size={16} color="white" />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPendingStep = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Pending Deletion</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <FontAwesome name="times" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <Text style={styles.warning}>
        ⚠️ You have a pending account deletion request.
      </Text>

      <Text style={styles.description}>
        Reason: {deletionStatus?.request?.reason}
      </Text>

      <Text style={styles.description}>
        Requested on: {new Date(deletionStatus?.request?.createdAt).toLocaleDateString()}
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancelDeletion}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleConfirmDeletion}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <FontAwesome name="trash" size={16} color="white" />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {step === 'reason' && renderReasonStep()}
          {step === 'confirm' && renderConfirmStep()}
          {step === 'pending' && renderPendingStep()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  closeButton: {
    padding: 4,
  },
  warning: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 100,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonDisabled: {
    backgroundColor: '#FCA5A5',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});

export default DeleteAccountModal; 