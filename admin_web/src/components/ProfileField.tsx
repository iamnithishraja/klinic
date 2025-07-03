import React from 'react';

interface ProfileFieldProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

const ProfileField: React.FC<ProfileFieldProps> = ({ label, value, icon }) => (
  <div className="flex items-center gap-2 mb-2">
    {icon && <span>{icon}</span>}
    <span className="font-semibold">{label}:</span>
    <span>{value}</span>
  </div>
);

export default ProfileField; 