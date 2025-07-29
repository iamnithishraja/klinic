import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaFilter, FaTimes, FaSearch } from 'react-icons/fa';

export interface OrderFilters {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  needAssignment?: boolean;
}

interface OrderFiltersProps {
  onFiltersChange?: (filters: OrderFilters) => void;
}

const OrderFiltersComponent: React.FC<OrderFiltersProps> = ({ onFiltersChange }) => {
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
  const [searchTerm, setSearchTerm] = useState('');
  const filterOptions = [
    { id: 'all', label: 'All Orders', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { id: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: 'out-for-delivery', label: 'Out for Delivery', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { id: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-200' },
    { id: 'needs-assignment', label: 'Needs Assignment', color: 'bg-red-100 text-red-800 border-red-200' }
  ];

  const handleFilterClick = (filterId: string) => {
    if (filterId === 'all') {
      setActiveFilters(['all']);
    } else {
      setActiveFilters(prev => {
        const newFilters = prev.filter(f => f !== 'all');
        if (newFilters.includes(filterId)) {
          return newFilters.filter(f => f !== filterId);
        } else {
          return [...newFilters, filterId];
        }
      });
    }
  };

  const clearAllFilters = () => {
    setActiveFilters(['all']);
    setSearchTerm('');
  };

  const hasActiveFilters = activeFilters.length > 1 || searchTerm;

  // Build filters object and notify parent - Fixed to prevent infinite loop
  const buildFilters = useCallback((): OrderFilters => {
    const filters: OrderFilters = {};
    
    if (activeFilters.includes('pending')) filters.status = 'pending';
    if (activeFilters.includes('confirmed')) filters.status = 'confirmed';
    if (activeFilters.includes('out-for-delivery')) filters.status = 'out_for_delivery';
    if (activeFilters.includes('delivered')) filters.status = 'delivered';
    if (activeFilters.includes('needs-assignment')) filters.needAssignment = true;
    if (searchTerm) filters.search = searchTerm;
    
    return filters;
  }, [activeFilters, searchTerm]);

  const lastFilters = useRef<OrderFilters>({});

  // Use useEffect with proper dependencies to prevent infinite loop
  useEffect(() => {
    const filters = buildFilters();
    // Only call onFiltersChange if filters actually changed
    const filtersChanged = JSON.stringify(filters) !== JSON.stringify(lastFilters.current);
    if (filtersChanged && onFiltersChange) {
      onFiltersChange(filters);
      lastFilters.current = filters;
    }
  }, [buildFilters, onFiltersChange]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <FaFilter className="text-blue-600 text-sm" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            <FaTimes className="text-xs" />
            Clear All
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search orders by ID, customer name, or lab..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
      </div>

      {/* Filter Chips */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterClick(filter.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200 ${
                activeFilters.includes(filter.id)
                  ? `${filter.color} border-current shadow-sm`
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <span>{filter.label}</span>

            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderFiltersComponent; 