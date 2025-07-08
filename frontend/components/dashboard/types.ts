export interface Appointment {
  _id: string;
  type: 'doctor' | 'laboratory';
  timeSlot: string;
  timeSlotDisplay: string;
  status: string;
  consultationType?: 'in-person' | 'online';
  collectionType?: 'lab' | 'home';
  providerName: string;
  serviceName: string;
  prescription?: string;
  reportResult?: string;
  feedbackRequested?: boolean;
  clinic?: any;
  laboratoryService?: any;
  doctor?: any;
  lab?: any;
  packageCoverImage?: string;
  createdAt: string;
}

export interface DashboardData {
  upcomingAppointments: Appointment[];
  totalUpcoming: number;
}

export interface PreviousData {
  appointments?: Appointment[];
  labTests?: Appointment[];
  pagination: {
    current: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CollectedData {
  labTests?: Appointment[];
  pagination: {
    current: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
} 