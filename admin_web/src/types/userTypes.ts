export interface User {
  role: 'admin' | 'user' | 'doctor' | 'laboratory' | 'deliverypartner';
  isVerified?: boolean;
  // ...other properties as needed
} 