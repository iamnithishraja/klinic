import React, { useState, Suspense } from 'react';
import OrderFiltersComponent from '../components/orders/OrderFilters';
import OrdersTable from '../components/orders/OrdersTable';
import OrderStats from '../components/orders/OrderStats';
import ErrorBoundary from '../components/ErrorBoundary';

export interface OrderFilters {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  needAssignment?: boolean;
}

const Orders: React.FC = () => {
  const [filters, setFilters] = useState<OrderFilters>({});

  const handleFiltersChange = (newFilters: OrderFilters) => {
    setFilters(newFilters);
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Orders Management</h1>
          {/* <AddOrderButton /> (if needed) */}
        </div>
        <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
          <OrderStats />
          <OrderFiltersComponent onFiltersChange={handleFiltersChange} />
          <OrdersTable filters={filters} />
        </Suspense>
        {/* Pagination controls placeholder */}
        <div className="flex justify-end pt-4">
          {/* PaginationControls component will go here */}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Orders; 