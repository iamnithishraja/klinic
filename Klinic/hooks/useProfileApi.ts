import { useState } from 'react';
import { Alert } from 'react-native';
import apiClient from '@/api/client';

interface ProfileApiProps {
  endpoint: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

interface UseProfileApi {
  loading: boolean;
  error: any;
  data: any;
  setData: (data: any) => void;
  fetchData: () => Promise<void>;
  updateData: (data: any) => Promise<boolean>;
  uploadFile: (fileType: string, fileName: string, fileUri: string) => Promise<string | null>;
}

const useProfileApi = ({ endpoint, onSuccess, onError }: ProfileApiProps): UseProfileApi => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);
  const [data, setData] = useState<any>(null);

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Making GET request to ${endpoint}`);
      const response = await apiClient.get(endpoint);
      console.log(`Response from ${endpoint}:`, response.data);
      setData(response.data);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err: any) {
      console.error(`Error fetching data from ${endpoint}:`, err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      setError(err);
      
      if (onError) {
        onError(err);
      } else if (err.response?.status !== 404) { // Don't alert on 404 as it might be expected
        Alert.alert('Error', `Failed to load data: ${err.response?.data?.message || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateData = async (newData: any): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Making POST request to ${endpoint} with data:`, newData);
      const response = await apiClient.post(endpoint, newData);
      console.log('Update response:', response.data);
      setData(response.data);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
      
      return true;
    } catch (err: any) {
      console.error(`Error updating data for ${endpoint}:`, err);
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
      }
      setError(err);
      
      if (onError) {
        onError(err);
      } else {
        Alert.alert('Error', `Failed to update profile: ${err.response?.data?.message || err.message}`);
      }
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  const uploadFile = async (fileType: string, fileName: string, fileUri: string): Promise<string | null> => {
    try {
      // Get upload URL
      const urlResponse = await apiClient.post('/api/v1/upload-url', {
        fileType,
        fileName
      });
      
      const { uploadUrl } = urlResponse.data;
      
      // Upload file
      const response = await fetch(fileUri);
      const blob = await response.blob();
      
      await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': fileType,
        },
      });
      
      // Extract the S3 URL from the uploadUrl (remove query parameters)
      const s3Url = uploadUrl.split('?')[0];
      return s3Url;
    } catch (err) {
      console.error('Error uploading file:', err);
      Alert.alert('Error', 'Failed to upload file');
      return null;
    }
  };

  return { loading, error, data, setData, fetchData, updateData, uploadFile };
};

export default useProfileApi; 