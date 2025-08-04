import apiClient from '../api/client';

export interface DeletionRequest {
  reason: string;
}

export interface DeletionStatus {
  hasPendingRequest: boolean;
  request?: {
    id: string;
    reason: string;
    createdAt: string;
  };
}

export const accountDeletionService = {
  // Request account deletion
  requestDeletion: async (reason: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post('/api/v1/account-deletion/request', { reason });
      return response.data;
    } catch (error: any) {
      console.error('Error requesting account deletion:', error);
      throw new Error(error.response?.data?.message || 'Failed to request account deletion');
    }
  },

  // Confirm account deletion
  confirmDeletion: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete('/api/v1/account-deletion/confirm');
      return response.data;
    } catch (error: any) {
      console.error('Error confirming account deletion:', error);
      throw new Error(error.response?.data?.message || 'Failed to confirm account deletion');
    }
  },

  // Cancel deletion request
  cancelDeletion: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete('/api/v1/account-deletion/cancel');
      return response.data;
    } catch (error: any) {
      console.error('Error cancelling deletion request:', error);
      throw new Error(error.response?.data?.message || 'Failed to cancel deletion request');
    }
  },

  // Get deletion status
  getDeletionStatus: async (): Promise<DeletionStatus> => {
    try {
      const response = await apiClient.get('/api/v1/account-deletion/status');
      return response.data.data;
    } catch (error: any) {
      console.error('Error getting deletion status:', error);
      throw new Error(error.response?.data?.message || 'Failed to get deletion status');
    }
  }
}; 