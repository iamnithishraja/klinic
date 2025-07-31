import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { productService } from '@/services/productService';
import { Product } from '@/services/productService';
import apiClient from '@/api/client';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ImagePickerModal from '@/components/profile/ImagePickerModal';

export const AddProductTab: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    availableQuantity: '',
    imageUrl: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);
  // Remove validateForm, errors state, and all error display logic. Allow submission without any field checks.

  // Image picker handler - only gallery
  const openGallery = async () => {
    try {
      setUploadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadProductImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setUploadingImage(false);
      setShowImageOptions(false);
    }
  };

  const uploadProductImage = async (imageUri: string) => {
    try {
      console.log('Uploading product image from:', imageUri);

      // Get file details
      const fileName = `product-image-${Date.now()}.jpg`;
      const fileType = 'image/jpeg';

      // Get presigned URL and upload image
      const imageUrl = await uploadFile(fileType, fileName, imageUri);

      if (imageUrl) {
        console.log('Product image uploaded successfully, URL:', imageUrl);
        setFormData(prev => ({ ...prev, imageUrl }));
      } else {
        throw new Error('Failed to get URL for the uploaded image');
      }
    } catch (error) {
      console.error('Error uploading product image:', error);
      Alert.alert('Error', 'Failed to upload product image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Upload file function (same as in useProfileApi)
  const uploadFile = async (fileType: string, fileName: string, fileUri: string): Promise<string | null> => {
    try {
      // Get upload URL from the correct endpoint
      const urlResponse = await apiClient.post('/api/v1/upload-url', {
        fileType,
        fileName
      });
      
      const { uploadUrl, publicUrl } = urlResponse.data;
      
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
      
      // Return the public URL provided by the backend
      return publicUrl;
    } catch (err) {
      console.error('Error uploading file:', err);
      Alert.alert('Error', 'Failed to upload file');
      return null;
    }
  };

  const handleSubmit = async () => {
    // Remove validateForm() call
    // if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const productData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        availableQuantity: Number(formData.availableQuantity),
        imageUrl: formData.imageUrl || undefined,
      };

      await productService.createProduct(productData);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        availableQuantity: '',
        imageUrl: '',
      });

      // Show success message
      Alert.alert('Success', 'Product created successfully!');
      
      // Refresh products list
      // if (onProductCreated) {
      //   onProductCreated();
      // }
    } catch (error) {
      console.error('Error creating product:', error);
      Alert.alert('Error', 'Failed to create product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    // if (errors[field]) { // This line is no longer needed
    //   setErrors(prev => ({ ...prev, [field]: '' }));
    // }
  };

  const handleImagePress = () => {
    setShowImageOptions(true);
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={true}>
      <View style={styles.form}>
        {/* Product Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Medicine Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter medicine name"
            value={formData.name}
            onChangeText={(value) => updateFormData('name', value)}
            maxLength={100}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter product description"
            value={formData.description}
            onChangeText={(value) => updateFormData('description', value)}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Price (₹) *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter price"
            value={formData.price}
            onChangeText={(value) => updateFormData('price', value)}
            keyboardType="numeric"
          />
        </View>

        {/* Available Quantity */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Available Quantity *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter available quantity"
            value={formData.availableQuantity}
            onChangeText={(value) => updateFormData('availableQuantity', value)}
            keyboardType="numeric"
          />
        </View>

        {/* Product Image */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Image (Optional)</Text>
          <TouchableOpacity
            onPress={handleImagePress}
            disabled={uploadingImage}
            style={[styles.imageContainer, !formData.imageUrl && styles.inputError]}
          >
            {uploadingImage ? (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="large" color={Colors.light.tint} />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            ) : formData.imageUrl ? (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: formData.imageUrl }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={removeImage}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons
                  name="image-plus"
                  size={48}
                  color={Colors.light.tint}
                />
                <Text style={styles.imagePlaceholderText}>Upload product image</Text>
                <Text style={styles.imagePlaceholderSubtext}>Tap to select an image</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <IconSymbol name="plus" size={20} color="#FFFFFF" weight="medium" />
              <Text style={styles.submitButtonText}>Add Product</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImageOptions}
        onClose={() => setShowImageOptions(false)}
        onChooseFromGallery={openGallery}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  form: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  imageContainer: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContainer: {
    alignItems: 'center',
  },
  uploadingText: {
    color: '#6B7280',
    marginTop: 8,
    fontSize: 16,
  },
  imagePreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#EF4444',
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    alignItems: 'center',
    padding: 16,
  },
  imagePlaceholderText: {
    color: '#6B7280',
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  imagePlaceholderSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 