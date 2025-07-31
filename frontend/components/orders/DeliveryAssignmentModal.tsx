import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CustomModal from '@/components/ui/CustomModal';
import { Colors } from '@/constants/Colors';
import apiClient from '@/api/client';

interface DeliveryPartner {
  _id: string;
  name: string;
  email: string;
  phone: string;
}

interface DeliveryAssignmentModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  onAssignmentSuccess: () => void;
}

const DeliveryAssignmentModal: React.FC<DeliveryAssignmentModalProps> = ({
  visible,
  onClose,
  orderId,
  onAssignmentSuccess,
}) => {
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchDeliveryPartners();
    }
  }, [visible]);

  const fetchDeliveryPartners = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/v1/orders/available-delivery-partners');
      
      if (response.data.success) {
        setDeliveryPartners(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to fetch delivery partners');
      }
    } catch (error) {
      console.error('Error fetching delivery partners:', error);
      Alert.alert('Error', 'Failed to fetch delivery partners. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDelivery = async () => {
    if (!selectedPartner) {
      Alert.alert('Error', 'Please select a delivery partner.');
      return;
    }

    try {
      setAssigning(true);
      const response = await apiClient.post(`/api/v1/orders/${orderId}/assign-delivery`, {
        deliveryPartnerId: selectedPartner,
      });

      if (response.data.success) {
        const selectedPartnerName = deliveryPartners.find(p => p._id === selectedPartner)?.name || 'Delivery Partner';
        Alert.alert(
          'Success', 
          `${selectedPartnerName} has been assigned to this order successfully!`,
          [
            {
              text: 'OK',
              onPress: () => {
                onAssignmentSuccess();
                onClose();
              }
            }
          ]
        );
      } else {
        throw new Error(response.data.error || 'Failed to assign delivery partner');
      }
    } catch (error: any) {
      console.error('Error assigning delivery partner:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to assign delivery partner. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const renderDeliveryPartner = (partner: DeliveryPartner) => {
    const isSelected = selectedPartner === partner._id;
    
    return (
      <TouchableOpacity
        key={partner._id}
        style={[
          styles.partnerItem,
          isSelected && styles.selectedPartner,
        ]}
        onPress={() => setSelectedPartner(partner._id)}
      >
        <View style={styles.partnerInfo}>
          <View style={styles.partnerHeader}>
            <FontAwesome name="user" size={16} color={Colors.light.tint} />
            <Text style={styles.partnerName}>{partner.name}</Text>
            {isSelected && (
              <FontAwesome name="check-circle" size={16} color={Colors.light.tint} />
            )}
          </View>
          <View style={styles.partnerDetails}>
            <View style={styles.contactItem}>
              <FontAwesome name="phone" size={14} color="#6B7280" />
              <Text style={styles.contactText}>{partner.phone}</Text>
            </View>
            <View style={styles.contactItem}>
              <FontAwesome name="envelope" size={14} color="#6B7280" />
              <Text style={styles.contactText}>{partner.email}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      title="Assign Delivery Partner"
      size="full"
      animationType="slide"
      zIndex={1001}
      scrollable={true}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.description}>
            Select a delivery partner to assign to this order. The partner will be notified and can accept or reject the assignment.
          </Text>

          <View style={{ flex: 1 }}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={styles.loadingText}>Loading delivery partners...</Text>
              </View>
            ) : deliveryPartners.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome name="users" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No Delivery Partners Available</Text>
                <Text style={styles.emptySubtitle}>
                  There are no delivery partners available at the moment. Please try again later.
                </Text>
              </View>
            ) : (
              <View style={styles.partnersContainer}>
                <Text style={styles.sectionTitle}>Available Partners</Text>
                {deliveryPartners.map((partner) => (
                  <View key={partner._id}>
                    {renderDeliveryPartner(partner)}
                  </View>
                ))}
              </View>
            )}
          </View>

          {!loading && deliveryPartners.length > 0 && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.assignButton,
                  !selectedPartner && styles.assignButtonDisabled,
                ]}
                onPress={handleAssignDelivery}
                disabled={!selectedPartner || assigning}
              >
                {assigning ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <FontAwesome name="user-plus" size={16} color="white" />
                )}
                <Text style={styles.assignButtonText}>
                  {assigning ? 'Assigning...' : 'Assign Delivery Partner'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </CustomModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    minHeight: 0,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  partnersList: {
    flexGrow: 0,
    flexShrink: 1,
    minHeight: 0,
    maxHeight: 320,
  },
  partnersContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 16,
  },
  partnerItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedPartner: {
    backgroundColor: '#EBF4FF',
    borderColor: Colors.light.tint,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginLeft: 8,
    flex: 1,
  },
  partnerDetails: {
    gap: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  actionsContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  assignButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  assignButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
});

export default DeliveryAssignmentModal; 