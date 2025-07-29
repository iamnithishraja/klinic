import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useProductStore } from '../../store/productStore';
import type { ProductSearchFilters } from '../../services/productService';

interface ProductFiltersProps {
  onApply: () => void;
  onCancel: () => void;
}

export default function ProductFilters({ onApply, onCancel }: ProductFiltersProps) {
  const { filters, setFilters } = useProductStore();

  // Local state for filters
  const [localFilters, setLocalFilters] = useState<ProductSearchFilters>({ ...filters });

  // Price range state
  const [minPrice, setMinPrice] = useState(localFilters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(localFilters.maxPrice?.toString() || '');

  // Error state for price validation
  const [priceError, setPriceError] = useState<string | null>(null);

  // Reset local filters when global filters change
  useEffect(() => {
    setLocalFilters({ ...filters });
    setMinPrice(filters.minPrice?.toString() || '');
    setMaxPrice(filters.maxPrice?.toString() || '');
    setPriceError(null);
  }, [filters]);

  const handleFilterChange = (key: keyof ProductSearchFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePriceInputChange = (type: 'min' | 'max', value: string) => {
    // Only allow numbers
    const sanitized = value.replace(/[^0-9]/g, '');
    if (type === 'min') setMinPrice(sanitized);
    else setMaxPrice(sanitized);
    setPriceError(null);
  };

  const validateAndSetPriceRange = () => {
    const min = minPrice && minPrice.trim() ? Number(minPrice) : undefined;
    const max = maxPrice && maxPrice.trim() ? Number(maxPrice) : undefined;

    if (
      (min !== undefined && isNaN(min)) ||
      (max !== undefined && isNaN(max)) ||
      (min !== undefined && min < 0) ||
      (max !== undefined && max < 0)
    ) {
      setPriceError('Please enter valid non-negative numbers.');
      return false;
    }
    if (min !== undefined && max !== undefined && min > max) {
      setPriceError('Minimum price cannot be greater than maximum price.');
      return false;
    }

    setLocalFilters(prev => ({
      ...prev,
      minPrice: min,
      maxPrice: max,
    }));
    setPriceError(null);
    return true;
  };

  const handleApplyFilters = () => {
    if (!validateAndSetPriceRange()) return;
    setFilters({
      ...localFilters,
      minPrice: minPrice && minPrice.trim() ? Number(minPrice) : undefined,
      maxPrice: maxPrice && maxPrice.trim() ? Number(maxPrice) : undefined,
    });
    onApply();
  };

  const handleResetFilters = () => {
    const resetFilters: ProductSearchFilters = {
      page: 1,
      limit: 10,
    };
    setLocalFilters(resetFilters);
    setMinPrice('');
    setMaxPrice('');
    setPriceError(null);
  };

  const hasActiveFilters = () => {
    return !!(
      (minPrice && minPrice !== '0') ||
      (maxPrice && maxPrice !== '')
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor: '#fff' }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
            <Text style={styles.headerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={handleApplyFilters} style={styles.headerButton}>
            <Text style={[styles.headerButtonText, { fontWeight: 'bold' }]}>Apply</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1, padding: 16 }}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Price Range */}
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>Price Range</Text>
            <View style={styles.priceRangeInlineContainer}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.inputLabel}>Min (₹)</Text>
                <TextInput
                  value={minPrice}
                  onChangeText={v => handlePriceInputChange('min', v)}
                  placeholder="0"
                  keyboardType="numeric"
                  style={styles.input}
                  maxLength={8}
                  returnKeyType="done"
                  inputMode="numeric"
                  accessibilityLabel="Minimum Price"
                />
              </View>
              <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, color: '#6B7280' }}>–</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.inputLabel}>Max (₹)</Text>
                <TextInput
                  value={maxPrice}
                  onChangeText={v => handlePriceInputChange('max', v)}
                  placeholder="No limit"
                  keyboardType="numeric"
                  style={styles.input}
                  maxLength={8}
                  returnKeyType="done"
                  inputMode="numeric"
                  accessibilityLabel="Maximum Price"
                />
              </View>
            </View>
            {priceError ? (
              <Text style={styles.errorText}>{priceError}</Text>
            ) : null}
          </View>

          {/* Reset Filters */}
          {hasActiveFilters() && (
            <TouchableOpacity
              onPress={handleResetFilters}
              style={styles.resetButton}
              activeOpacity={0.8}
            >
              <Text style={styles.resetButtonText}>Reset All Filters</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerButtonText: {
    color: '#2563EB',
    fontSize: 17,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#22223B',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
    color: '#22223B',
  },
  priceRangeInlineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  inputLabel: {
    color: '#6B7280',
    fontSize: 15,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#F3F4F6',
    color: '#22223B',
  },
  resetButton: {
    backgroundColor: '#FEE2E2',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginTop: 10,
  },
  resetButtonText: {
    color: '#DC2626',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 15,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
});