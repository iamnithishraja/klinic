import { create } from 'zustand';
import { Address } from '@/types/profileTypes';

// USER PROFILE STORE
interface UserProfileState {
  // Personal details
  profilePicture: string;
  age: string;
  gender: string;
  medicalHistory: string;
  medicalHistoryPdf: string;
  address: string;
  pinCode: string;
  city: string;
  
  // Saved values for tracking changes
  savedValues: {
    age: string;
    gender: string;
    medicalHistory: string;
    address: string;
    pinCode: string;
    city: string;
    medicalHistoryPdf: string;
  };

  // Actions
  setProfilePicture: (url: string) => void;
  setAge: (age: string) => void;
  setGender: (gender: string) => void;
  setMedicalHistory: (history: string) => void;
  setMedicalHistoryPdf: (url: string) => void;
  setAddress: (address: string) => void;
  setPinCode: (pinCode: string) => void;
  setCity: (city: string) => void;
  setSavedValues: (values: UserProfileState['savedValues']) => void;
  updateFromApiResponse: (data: any) => void;
  reset: () => void;
}

export const useUserProfileStore = create<UserProfileState>((set) => ({
  // Initial state
  profilePicture: '',
  age: '',
  gender: '',
  medicalHistory: '',
  medicalHistoryPdf: '',
  address: '',
  pinCode: '',
  city: '',
  
  savedValues: {
    age: '',
    gender: '',
    medicalHistory: '',
    address: '',
    pinCode: '',
    city: '',
    medicalHistoryPdf: ''
  },

  // Actions
  setProfilePicture: (url) => set({ profilePicture: url }),
  setAge: (age) => set({ age }),
  setGender: (gender) => set({ gender }),
  setMedicalHistory: (medicalHistory) => set({ medicalHistory }),
  setMedicalHistoryPdf: (url) => set({ medicalHistoryPdf: url }),
  setAddress: (address) => set({ address }),
  setPinCode: (pinCode) => set({ pinCode }),
  setCity: (city) => set({ city }),
  
  setSavedValues: (values) => set({ savedValues: values }),
  
  updateFromApiResponse: (data) => {
    if (!data) return;
    
    set((state) => {
      // Handle different API response formats
      const newAge = data.age?.toString() || '';
      
      // Handle gender with title case
      let newGender = '';
      if (data.gender) {
        newGender = data.gender.charAt(0).toUpperCase() + data.gender.slice(1);
      }
      
      const newMedicalHistory = data.medicalHistory || '';
      
      let newAddress = '';
      let newPinCode = '';
      
      // Handle address object structure
      if (data.address) {
        newAddress = data.address.address || '';
        newPinCode = data.address.pinCode || '';
      }
      
      // Handle city as a top-level property
      const newCity = data.city || '';
      
      // Update saved values
      const savedValues = {
        age: newAge,
        gender: newGender,
        medicalHistory: newMedicalHistory,
        address: newAddress,
        pinCode: newPinCode,
        city: newCity,
        medicalHistoryPdf: data.medicalHistoryPdf || ''
      };
      
      return {
        profilePicture: data.profilePicture || '',
        age: newAge,
        gender: newGender,
        medicalHistory: newMedicalHistory,
        medicalHistoryPdf: data.medicalHistoryPdf || '',
        address: newAddress,
        pinCode: newPinCode,
        city: newCity,
        savedValues
      };
    });
  },
  
  reset: () => set({
    profilePicture: '',
    age: '',
    gender: '',
    medicalHistory: '',
    medicalHistoryPdf: '',
    address: '',
    pinCode: '',
    city: '',
    savedValues: {
      age: '',
      gender: '',
      medicalHistory: '',
      address: '',
      pinCode: '',
      city: '',
      medicalHistoryPdf: ''
    }
  })
}));

// DOCTOR PROFILE STORE
interface DoctorProfileState {
  // Professional details
  description: string;
  experience: string;
  specializations: string[];
  availableSpecializations: string[];
  qualifications: string[];
  availableQualifications: string[];
  consultationFee: string;
  consultationType: string;
  
  // Personal details
  coverImage: string;
  age: string;
  gender: string;
  
  // Clinic details
  clinicName: string;
  clinicPhone: string;
  clinicEmail: string;
  clinicWebsite: string;
  clinicAddress: string;
  clinicPinCode: string;
  clinicCity: string;
  
  // Saved values for tracking changes
  savedValues: {
    description: string;
    experience: string;
    specializations: string[];
    qualifications: string[];
    consultationFee: string;
    age: string;
    gender: string;
    consultationType: string;
    coverImage: string;
    clinicName: string;
    clinicPhone: string;
    clinicEmail: string;
    clinicWebsite: string;
    clinicAddress: string;
    clinicPinCode: string;
    clinicCity: string;
  };

  // Actions
  setDescription: (description: string) => void;
  setExperience: (experience: string) => void;
  addSpecialization: (specialization: string) => void;
  removeSpecialization: (index: number) => void;
  setAvailableSpecializations: (specializations: string[]) => void;
  addQualification: (qualification: string) => void;
  removeQualification: (index: number) => void;
  setAvailableQualifications: (qualifications: string[]) => void;
  setConsultationFee: (fee: string) => void;
  setConsultationType: (type: string) => void;
  setCoverImage: (url: string) => void;
  setAge: (age: string) => void;
  setGender: (gender: string) => void;
  setClinicName: (name: string) => void;
  setClinicPhone: (phone: string) => void;
  setClinicEmail: (email: string) => void;
  setClinicWebsite: (website: string) => void;
  setClinicAddress: (address: string) => void;
  setClinicPinCode: (pinCode: string) => void;
  setClinicCity: (city: string) => void;
  setSavedValues: (values: DoctorProfileState['savedValues']) => void;
  updateFromApiResponse: (data: any) => void;
  prepareProfileData: () => any;
  reset: () => void;
}

export const useDoctorProfileStore = create<DoctorProfileState>((set, get) => ({
  // Initial state
  description: '',
  experience: '',
  specializations: [],
  availableSpecializations: [],
  qualifications: [],
  availableQualifications: [],
  consultationFee: '',
  consultationType: '',
  coverImage: '',
  age: '',
  gender: '',
  clinicName: '',
  clinicPhone: '',
  clinicEmail: '',
  clinicWebsite: '',
  clinicAddress: '',
  clinicPinCode: '',
  clinicCity: '',
  
  savedValues: {
    description: '',
    experience: '',
    specializations: [],
    qualifications: [],
    consultationFee: '',
    age: '',
    gender: '',
    consultationType: '',
    coverImage: '',
    clinicName: '',
    clinicPhone: '',
    clinicEmail: '',
    clinicWebsite: '',
    clinicAddress: '',
    clinicPinCode: '',
    clinicCity: ''
  },

  // Actions
  setDescription: (description) => set({ description }),
  setExperience: (experience) => set({ experience }),
  addSpecialization: (specialization) => set((state) => ({
    specializations: [...state.specializations, specialization]
  })),
  removeSpecialization: (index) => set((state) => ({
    specializations: state.specializations.filter((_, i) => i !== index)
  })),
  setAvailableSpecializations: (specializations) => set({ availableSpecializations: specializations }),
  addQualification: (qualification) => set((state) => ({
    qualifications: [...state.qualifications, qualification]
  })),
  removeQualification: (index) => set((state) => ({
    qualifications: state.qualifications.filter((_, i) => i !== index)
  })),
  setAvailableQualifications: (qualifications) => set({ availableQualifications: qualifications }),
  setConsultationFee: (consultationFee) => set({ consultationFee }),
  setConsultationType: (consultationType) => set({ consultationType }),
  setCoverImage: (url) => set({ coverImage: url }),
  setAge: (age) => set({ age }),
  setGender: (gender) => set({ gender }),
  setClinicName: (clinicName) => set({ clinicName }),
  setClinicPhone: (clinicPhone) => set({ clinicPhone }),
  setClinicEmail: (clinicEmail) => set({ clinicEmail }),
  setClinicWebsite: (clinicWebsite) => set({ clinicWebsite }),
  setClinicAddress: (clinicAddress) => set({ clinicAddress }),
  setClinicPinCode: (clinicPinCode) => set({ clinicPinCode }),
  setClinicCity: (clinicCity) => set({ clinicCity }),
  
  setSavedValues: (values) => set({ savedValues: values }),
  
  updateFromApiResponse: (data) => {
    if (!data) return;
    
    set((state) => {
      // Handle different API response formats
      const newAge = data.age?.toString() || '';
      
      // Handle gender with title case
      let newGender = '';
      if (data.gender) {
        newGender = data.gender.charAt(0).toUpperCase() + data.gender.slice(1);
      }
      
      // Update saved values and current state
      return {
        description: data.description || '',
        experience: data.experience?.toString() || '',
        specializations: data.specializations || [],
        qualifications: data.qualifications || [],
        consultationFee: data.consultationFee?.toString() || '',
        consultationType: data.consultationType || '',
        coverImage: data.profilePicture || '',
        age: newAge,
        gender: newGender,
        clinicName: data.clinicName || '',
        clinicPhone: data.clinicPhone || '',
        clinicEmail: data.clinicEmail || '',
        clinicWebsite: data.clinicWebsite || '',
        clinicAddress: data.clinicAddress?.address || '',
        clinicPinCode: data.clinicAddress?.pinCode || '',
        clinicCity: data.city || '',
        
        savedValues: {
          description: data.description || '',
          experience: data.experience?.toString() || '',
          specializations: data.specializations || [],
          qualifications: data.qualifications || [],
          consultationFee: data.consultationFee?.toString() || '',
          age: newAge,
          gender: newGender,
          consultationType: data.consultationType || '',
          coverImage: data.profilePicture || '',
          clinicName: data.clinicName || '',
          clinicPhone: data.clinicPhone || '',
          clinicEmail: data.clinicEmail || '',
          clinicWebsite: data.clinicWebsite || '',
          clinicAddress: data.clinicAddress?.address || '',
          clinicPinCode: data.clinicAddress?.pinCode || '',
          clinicCity: data.city || ''
        }
      };
    });
  },
  
  prepareProfileData: () => {
    const state = get();
    
    // Convert gender to lowercase as per backend model
    const genderValue = state.gender ? state.gender.toLowerCase() : undefined;
    
    // Format clinic address as per backend model
    const clinicAddressData: Address = {
      address: state.clinicAddress,
      pinCode: state.clinicPinCode,
      latitude: null,
      longitude: null
    };
    
    return {
      description: state.description,
      experience: state.experience ? parseInt(state.experience) : undefined,
      specializations: state.specializations,
      qualifications: state.qualifications,
      consultationFee: state.consultationFee ? parseInt(state.consultationFee) : undefined,
      profilePicture: state.coverImage,
      age: state.age ? parseInt(state.age) : undefined,
      gender: genderValue,
      consultationType: state.consultationType as 'online' | 'in-person' | 'both',
      clinicName: state.clinicName,
      clinicPhone: state.clinicPhone,
      clinicEmail: state.clinicEmail,
      clinicWebsite: state.clinicWebsite,
      clinicAddress: clinicAddressData,
      city: state.clinicCity // City as a top-level property
    };
  },
  
  reset: () => set({
    description: '',
    experience: '',
    specializations: [],
    availableSpecializations: [],
    qualifications: [],
    availableQualifications: [],
    consultationFee: '',
    consultationType: '',
    coverImage: '',
    age: '',
    gender: '',
    clinicName: '',
    clinicPhone: '',
    clinicEmail: '',
    clinicWebsite: '',
    clinicAddress: '',
    clinicPinCode: '',
    clinicCity: '',
    savedValues: {
      description: '',
      experience: '',
      specializations: [],
      qualifications: [],
      consultationFee: '',
      age: '',
      gender: '',
      consultationType: '',
      coverImage: '',
      clinicName: '',
      clinicPhone: '',
      clinicEmail: '',
      clinicWebsite: '',
      clinicAddress: '',
      clinicPinCode: '',
      clinicCity: ''
    }
  })
}));

// UI STATE STORE
interface ProfileUIState {
  loading: boolean;
  updating: boolean;
  uploadingImage: boolean;
  uploadingPdf: boolean;
  uploadingCoverImage: boolean;
  showDatePicker: boolean;
  showImageOptions: boolean;
  cities: string[];
  filteredCities: string[];
  
  // Actions
  setLoading: (loading: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setUploadingImage: (uploading: boolean) => void;
  setUploadingPdf: (uploading: boolean) => void;
  setUploadingCoverImage: (uploading: boolean) => void;
  setShowDatePicker: (show: boolean) => void;
  setShowImageOptions: (show: boolean) => void;
  setCities: (cities: string[]) => void;
  setFilteredCities: (cities: string[]) => void;
  filterCities: (query: string) => void;
  reset: () => void;
}

export const useProfileUIStore = create<ProfileUIState>((set, get) => ({
  // Initial state
  loading: false,
  updating: false,
  uploadingImage: false,
  uploadingPdf: false,
  uploadingCoverImage: false,
  showDatePicker: false,
  showImageOptions: false,
  cities: [],
  filteredCities: [],
  
  // Actions
  setLoading: (loading) => set({ loading }),
  setUpdating: (updating) => set({ updating }),
  setUploadingImage: (uploading) => set({ uploadingImage: uploading }),
  setUploadingPdf: (uploading) => set({ uploadingPdf: uploading }),
  setUploadingCoverImage: (uploading) => set({ uploadingCoverImage: uploading }),
  setShowDatePicker: (show) => set({ showDatePicker: show }),
  setShowImageOptions: (show) => set({ showImageOptions: show }),
  setCities: (cities) => set({ cities, filteredCities: cities }),
  setFilteredCities: (filteredCities) => set({ filteredCities }),
  
  filterCities: (query) => {
    const cities = get().cities;
    const regexp = new RegExp(query, 'i');
    const filtered = cities.filter(city => regexp.test(city));
    set({ filteredCities: filtered });
  },
  
  reset: () => set({
    loading: false,
    updating: false,
    uploadingImage: false,
    uploadingPdf: false,
    uploadingCoverImage: false,
    showDatePicker: false,
    showImageOptions: false,
    filteredCities: get().cities
  })
})); 