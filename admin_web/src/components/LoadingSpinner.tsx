import React from 'react';
import { FaSpinner } from 'react-icons/fa';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-5xl',
    xl: 'text-7xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center py-8 ${className}`}>
      <FaSpinner className={`animate-spin text-tint ${sizeClasses[size]}`} />
      {text && (
        <p className="mt-4 text-icon text-sm font-medium" style={{ color: '#687076' }}>
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner; 