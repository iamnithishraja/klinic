import { create } from 'zustand';
import { Address } from '@/types/profileTypes';

// USER PROFILE STORE
interface UserProfileState {
  // Personal details
  profilePicture: string;
  age: string;
  gender: string;
  medicalHistory: string;
  medicalHistoryPdfs: string[];
  address: string;
  pinCode: string;
  city: string;
  
  // Saved values for tracking changes
  savedValues: {
    age: string;
    gender: string;
    medicalHistory: string;
    medicalHistoryPdfs: string[];
    address: string;
    pinCode: string;
    city: string;
  };

  // Actions
  setProfilePicture: (url: string) => void;
  setAge: (age: string) => void;
  setGender: (gender: string) => void;
  setMedicalHistory: (history: string) => void;
  setMedicalHistoryPdfs: (pdfs: string[]) => void;
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
  medicalHistoryPdfs: [],
  address: '',
  pinCode: '',
  city: '',
  
  savedValues: {
    age: '',
    gender: '',
    medicalHistory: '',
    medicalHistoryPdfs: [],
    address: '',
    pinCode: '',
    city: '',
  },

  // Actions
  setProfilePicture: (url) => set({ profilePicture: url }),
  setAge: (age) => set({ age }),
  setGender: (gender) => set({ gender }),
  setMedicalHistory: (medicalHistory) => set({ medicalHistory }),
  setMedicalHistoryPdfs: (pdfs) => set({ medicalHistoryPdfs: pdfs }),
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
        medicalHistoryPdfs: data.medicalHistoryPdfs || [],
        address: newAddress,
        pinCode: newPinCode,
        city: newCity,
      };
      
      return {
        profilePicture: data.profilePicture || '',
        age: newAge,
        gender: newGender,
        medicalHistory: newMedicalHistory,
        medicalHistoryPdfs: data.medicalHistoryPdfs || [],
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
    medicalHistoryPdfs: [],
    address: '',
    pinCode: '',
    city: '',
    savedValues: {
      age: '',
      gender: '',
      medicalHistory: '',
      medicalHistoryPdfs: [],
      address: '',
      pinCode: '',
      city: '',
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
  availableDays: string[];
  availableSlots: string[];
  registrationNumber: string;
  
  // Personal details
  coverImage: string;
  age: string;
  gender: string;
  isAvailable: boolean;
  
  // Clinic details
  clinics: Array<{
    clinicName: string;
    clinicPhone: string;
    clinicEmail: string;
    clinicWebsite: string;
    clinicAddress: string;
    clinicPinCode: string;
    clinicCity: string;
    clinicGoogleMapsLink: string;
  }>;
  
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
    registrationNumber: string;
    clinics: Array<{
      clinicName: string;
      clinicPhone: string;
      clinicEmail: string;
      clinicWebsite: string;
      clinicAddress: string;
      clinicPinCode: string;
      clinicCity: string;
      clinicGoogleMapsLink: string;
    }>;
    isAvailable: boolean;
    availableDays: string[];
    availableSlots: string[];
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
  setIsAvailable: (isAvailable: boolean) => void;
  toggleAvailableDay: (day: string) => void;
  setAvailableDays: (days: string[]) => void;
  addAvailableSlot: (slot: string) => void;
  removeAvailableSlot: (slot: string) => void;
  setAvailableSlots: (slots: string[]) => void;
  setRegistrationNumber: (registrationNumber: string) => void;
  addClinic: () => void;
  removeClinic: (index: number) => void;
  updateClinic: (index: number, field: string, value: string) => void;
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
  availableDays: [],
  availableSlots: [],
  registrationNumber: '',
  coverImage: '',
  age: '',
  gender: '',
  isAvailable: false,
  clinics: [],
  
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
    registrationNumber: '',
    clinics: [],
    isAvailable: false,
    availableDays: [],
    availableSlots: []
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
  setAvailableSpecializations: (specializations) => set((state) => {
    // Only set if empty (first time) and the input array is not empty
    if (state.availableSpecializations.length === 0 && specializations.length > 0) {
      return { availableSpecializations: specializations };
    }
    return {}; // Return empty object to avoid unnecessary state updates
  }),
  addQualification: (qualification) => set((state) => ({
    qualifications: [...state.qualifications, qualification]
  })),
  removeQualification: (index) => set((state) => ({
    qualifications: state.qualifications.filter((_, i) => i !== index)
  })),
  setAvailableQualifications: (qualifications) => set((state) => {
    // Only set if empty (first time) and the input array is not empty
    if (state.availableQualifications.length === 0 && qualifications.length > 0) {
      return { availableQualifications: qualifications };
    }
    return {}; // Return empty object to avoid unnecessary state updates
  }),
  setConsultationFee: (consultationFee) => set({ consultationFee }),
  setConsultationType: (consultationType) => set({ consultationType }),
  setCoverImage: (url) => set({ coverImage: url }),
  setAge: (age) => set({ age }),
  setGender: (gender) => set({ gender }),
  setIsAvailable: (isAvailable) => set({ isAvailable }),
  
  // Day availability actions
  toggleAvailableDay: (day) => set((state) => {
    const currentDays = [...state.availableDays];
    const index = currentDays.indexOf(day);
    
    // If day exists, remove it; otherwise add it
    if (index !== -1) {
      currentDays.splice(index, 1);
    } else {
      currentDays.push(day);
    }
    
    return { availableDays: currentDays };
  }),
  
  setAvailableDays: (availableDays) => set({ availableDays }),
  
  // Time slot actions
  addAvailableSlot: (slot) => set((state) => {
    if (state.availableSlots.includes(slot)) {
      return state; // Slot already exists
    }
    return { availableSlots: [...state.availableSlots, slot].sort() };
  }),
  
  removeAvailableSlot: (slot) => set((state) => ({
    availableSlots: state.availableSlots.filter(s => s !== slot)
  })),
  
  setAvailableSlots: (availableSlots) => set({ availableSlots }),
  
  setRegistrationNumber: (registrationNumber) => set({ registrationNumber }),

  addClinic: () => set((state) => ({
    clinics: [...state.clinics, {
      clinicName: '',
      clinicPhone: '',
      clinicEmail: '',
      clinicWebsite: '',
      clinicAddress: '',
      clinicPinCode: '',
      clinicCity: '',
      clinicGoogleMapsLink: '',
    }]
  })),

  removeClinic: (index) => set((state) => ({
    clinics: state.clinics.filter((_, i) => i !== index)
  })),

  updateClinic: (index, field, value) => set((state) => ({
    clinics: state.clinics.map((clinic, i) => 
      i === index ? { ...clinic, [field]: value } : clinic
    )
  })),
  
  setSavedValues: (values) => set({ savedValues: values }),
  
  updateFromApiResponse: (data) => {
    if (!data) return;
    
    set((state) => {
      const clinics = data.clinics || [];
      return {
        description: data.description || '',
        experience: data.experience?.toString() || '',
        specializations: data.specializations || [],
        qualifications: data.qualifications || [],
        consultationFee: data.consultationFee?.toString() || '',
        age: data.age?.toString() || '',
        gender: data.gender || '',
        registrationNumber: data.registrationNumber || '',
        consultationType: data.consultationType || '',
        isAvailable: data.isAvailable || false,
        availableDays: data.availableDays || [],
        availableSlots: data.availableSlots || [],
        coverImage: data.coverImage || '',
        clinics: clinics.map((clinic: any) => ({
          clinicName: clinic.clinicName || '',
          clinicPhone: clinic.clinicPhone || '',
          clinicEmail: clinic.clinicEmail || '',
          clinicWebsite: clinic.clinicWebsite || '',
          clinicAddress: clinic.clinicAddress?.address || '',
          clinicPinCode: clinic.clinicAddress?.pinCode || '',
          clinicCity: clinic.clinicAddress?.city || '',
          clinicGoogleMapsLink: clinic.clinicAddress?.googleMapsLink || '',
        })),
        savedValues: {
          description: data.description || '',
          experience: data.experience?.toString() || '',
          specializations: data.specializations || [],
          qualifications: data.qualifications || [],
          consultationFee: data.consultationFee?.toString() || '',
          age: data.age?.toString() || '',
          gender: data.gender || '',
          registrationNumber: data.registrationNumber || '',
          consultationType: data.consultationType || '',
          isAvailable: data.isAvailable || false,
          availableDays: data.availableDays || [],
          availableSlots: data.availableSlots || [],
          coverImage: data.coverImage || '',
          clinics: clinics.map((clinic: any) => ({
            clinicName: clinic.clinicName || '',
            clinicPhone: clinic.clinicPhone || '',
            clinicEmail: clinic.clinicEmail || '',
            clinicWebsite: clinic.clinicWebsite || '',
            clinicAddress: clinic.clinicAddress?.address || '',
            clinicPinCode: clinic.clinicAddress?.pinCode || '',
            clinicCity: clinic.clinicAddress?.city || '',
            clinicGoogleMapsLink: clinic.clinicAddress?.googleMapsLink || '',
          }))
        }
      };
    });
  },
  
  prepareProfileData: () => {
    const state = get();
    return {
      description: state.description,
      experience: state.experience ? parseInt(state.experience) : undefined,
      specializations: state.specializations,
      qualifications: state.qualifications,
      consultationFee: state.consultationFee ? parseInt(state.consultationFee) : undefined,
      age: state.age ? parseInt(state.age) : undefined,
      gender: state.gender.toLowerCase(),
      registrationNumber: state.registrationNumber,
      consultationType: state.consultationType,
      isAvailable: state.isAvailable,
      availableDays: state.availableDays,
      availableSlots: state.availableSlots,
      coverImage: state.coverImage,
      clinics: state.clinics.map(clinic => ({
        clinicName: clinic.clinicName,
        clinicPhone: clinic.clinicPhone,
        clinicEmail: clinic.clinicEmail,
        clinicWebsite: clinic.clinicWebsite,
        clinicAddress: {
          address: clinic.clinicAddress,
          pinCode: clinic.clinicPinCode,
          googleMapsLink: clinic.clinicGoogleMapsLink,
          latitude: null,
          longitude: null
        }
      })),
      city: state.clinics[0]?.clinicCity || null
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
    availableDays: [],
    availableSlots: [],
    coverImage: '',
    age: '',
    gender: '',
    isAvailable: false,
    registrationNumber: '',
    clinics: [],
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
      registrationNumber: '',
      clinics: [],
      isAvailable: false,
      availableDays: [],
      availableSlots: []
    }
  })
}));

// LABORATORY PROFILE STORE
interface LaboratoryTest {
  id: string;
  name: string;
  description: string;
}

interface LaboratoryService {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  collectionType: 'home' | 'lab' | 'both';
  tests: LaboratoryTest[];
  price: string;
  category?: string;
}

interface LaboratoryProfileState {
  // Laboratory details
  laboratoryName: string;
  laboratoryPhone: string;
  laboratoryEmail: string;
  laboratoryWebsite: string;
  
  // Address details
  laboratoryAddress: string;
  laboratoryPinCode: string;
  laboratoryCity: string;
  laboratoryGoogleMapsLink: string;
  
  // Services
  laboratoryServices: LaboratoryService[];
  
  // Cover image
  coverImage: string;

  // Availability
  isAvailable: boolean;
  availableDays: string[];
  availableSlots: string[];
  
  // Saved values for tracking changes
  savedValues: {
    laboratoryName: string;
    laboratoryPhone: string;
    laboratoryEmail: string;
    laboratoryWebsite: string;
    laboratoryAddress: string;
    laboratoryPinCode: string;
    laboratoryCity: string;
    laboratoryGoogleMapsLink: string;
    laboratoryServices: LaboratoryService[];
    coverImage: string;
    isAvailable: boolean;
    availableDays: string[];
    availableSlots: string[];
  };
  
  // Actions
  setLaboratoryName: (name: string) => void;
  setLaboratoryPhone: (phone: string) => void;
  setLaboratoryEmail: (email: string) => void;
  setLaboratoryWebsite: (website: string) => void;
  setLaboratoryAddress: (address: string) => void;
  setLaboratoryPinCode: (pinCode: string) => void;
  setLaboratoryCity: (city: string) => void;
  setLaboratoryGoogleMapsLink: (link: string) => void;
  setCoverImage: (url: string) => void;
  
  // Availability actions
  setIsAvailable: (isAvailable: boolean) => void;
  toggleAvailableDay: (day: string) => void;
  setAvailableDays: (days: string[]) => void;
  addAvailableSlot: (slot: string) => void;
  removeAvailableSlot: (slot: string) => void;
  setAvailableSlots: (slots: string[]) => void;
  
  // Laboratory service actions
  addLaboratoryService: (service: Omit<LaboratoryService, 'id' | 'tests'>) => void;
  updateLaboratoryService: (serviceId: string, updates: Partial<Omit<LaboratoryService, 'id' | 'tests'>>) => void;
  removeLaboratoryService: (serviceId: string) => void;
  
  // Test actions
  addTest: (serviceId: string, test: Omit<LaboratoryTest, 'id'>) => void;
  updateTest: (serviceId: string, testId: string, updates: Partial<Omit<LaboratoryTest, 'id'>>) => void;
  removeTest: (serviceId: string, testId: string) => void;
  
  // Store management
  setSavedValues: (values: LaboratoryProfileState['savedValues']) => void;
  updateFromApiResponse: (data: any) => void;
  prepareProfileData: () => any;
  reset: () => void;
}

export const useLaboratoryProfileStore = create<LaboratoryProfileState>((set, get) => ({
  // Initial state
  laboratoryName: '',
  laboratoryPhone: '',
  laboratoryEmail: '',
  laboratoryWebsite: '',
  laboratoryAddress: '',
  laboratoryPinCode: '',
  laboratoryCity: '',
  laboratoryGoogleMapsLink: '',
  laboratoryServices: [],
  coverImage: '',
  isAvailable: false,
  availableDays: [],
  availableSlots: [],
  
  savedValues: {
    laboratoryName: '',
    laboratoryPhone: '',
    laboratoryEmail: '',
    laboratoryWebsite: '',
    laboratoryAddress: '',
    laboratoryPinCode: '',
    laboratoryCity: '',
    laboratoryGoogleMapsLink: '',
    laboratoryServices: [],
    coverImage: '',
    isAvailable: false,
    availableDays: [],
    availableSlots: []
  },
  
  // Basic field actions
  setLaboratoryName: (laboratoryName) => set({ laboratoryName }),
  setLaboratoryPhone: (laboratoryPhone) => set({ laboratoryPhone }),
  setLaboratoryEmail: (laboratoryEmail) => set({ laboratoryEmail }),
  setLaboratoryWebsite: (laboratoryWebsite) => set({ laboratoryWebsite }),
  setLaboratoryAddress: (laboratoryAddress) => set({ laboratoryAddress }),
  setLaboratoryPinCode: (laboratoryPinCode) => set({ laboratoryPinCode }),
  setLaboratoryCity: (laboratoryCity) => set({ laboratoryCity }),
  setLaboratoryGoogleMapsLink: (laboratoryGoogleMapsLink) => set({ laboratoryGoogleMapsLink }),
  setCoverImage: (url) => set({ coverImage: url }),
  
  // Availability actions
  setIsAvailable: (isAvailable) => set({ isAvailable }),
  
  toggleAvailableDay: (day) => set((state) => {
    const currentDays = [...state.availableDays];
    const index = currentDays.indexOf(day);
    
    if (index !== -1) {
      currentDays.splice(index, 1);
    } else {
      currentDays.push(day);
    }
    
    return { availableDays: currentDays };
  }),
  
  setAvailableDays: (availableDays) => set({ availableDays }),
  
  addAvailableSlot: (slot) => set((state) => {
    if (state.availableSlots.includes(slot)) {
      return state;
    }
    return { availableSlots: [...state.availableSlots, slot].sort() };
  }),
  
  removeAvailableSlot: (slot) => set((state) => ({
    availableSlots: state.availableSlots.filter(s => s !== slot)
  })),
  
  setAvailableSlots: (availableSlots) => set({ availableSlots }),
  
  // Laboratory service actions
  addLaboratoryService: (service) => set((state) => {
    const newService: LaboratoryService = {
      ...service,
      id: Date.now().toString(),
      tests: []
    };
    return { 
      laboratoryServices: [...state.laboratoryServices, newService]
    };
  }),
  
  updateLaboratoryService: (serviceId, updates) => set((state) => {
    const updatedServices = state.laboratoryServices.map(service => 
      service.id === serviceId ? { ...service, ...updates } : service
    );
    return { laboratoryServices: updatedServices };
  }),
  
  removeLaboratoryService: (serviceId) => set((state) => ({
    laboratoryServices: state.laboratoryServices.filter(service => service.id !== serviceId)
  })),
  
  // Test actions
  addTest: (serviceId, test) => set((state) => {
    const updatedServices = state.laboratoryServices.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          tests: [...service.tests, { ...test, id: Date.now().toString() }]
        };
      }
      return service;
    });
    return { laboratoryServices: updatedServices };
  }),
  
  updateTest: (serviceId, testId, updates) => set((state) => {
    const updatedServices = state.laboratoryServices.map(service => {
      if (service.id === serviceId) {
        const updatedTests = service.tests.map(test =>
          test.id === testId ? { ...test, ...updates } : test
        );
        return { ...service, tests: updatedTests };
      }
      return service;
    });
    return { laboratoryServices: updatedServices };
  }),
  
  removeTest: (serviceId, testId) => set((state) => {
    const updatedServices = state.laboratoryServices.map(service => {
      if (service.id === serviceId) {
        return {
          ...service,
          tests: service.tests.filter(test => test.id !== testId)
        };
      }
      return service;
    });
    return { laboratoryServices: updatedServices };
  }),
  
  // Store management
  setSavedValues: (values) => set({ savedValues: values }),
  
  updateFromApiResponse: (data) => {
    if (!data) return;
    
    set((state) => {
      // Extract laboratory data
      let services: LaboratoryService[] = [];
      
      // Parse laboratory services if available
      if (data.laboratoryServices && Array.isArray(data.laboratoryServices)) {
        services = data.laboratoryServices.map((service: any) => ({
          id: service._id || Date.now().toString(),
          name: service.name || '',
          description: service.description || '',
          coverImage: service.coverImage || '',
          collectionType: service.collectionType || 'both',
          price: service.price?.toString() || '',
          category: service.category || '',
          tests: Array.isArray(service.tests) 
            ? service.tests.map((test: any) => ({
                id: test._id || Date.now().toString(),
                name: test.name || '',
                description: test.description || ''
              }))
            : []
        }));
      }
      
      // Handle laboratory address
      let address = '';
      let pinCode = '';
      let googleMapsLink = '';
      
      if (data.laboratoryAddress) {
        address = data.laboratoryAddress.address || '';
        pinCode = data.laboratoryAddress.pinCode || '';
        googleMapsLink = data.laboratoryAddress.googleMapsLink || '';
      }
      
      const coverImage = data.coverImage || '';
      
      // Create values to save
      const savedValues = {
        laboratoryName: data.laboratoryName || '',
        laboratoryPhone: data.laboratoryPhone || '',
        laboratoryEmail: data.laboratoryEmail || '',
        laboratoryWebsite: data.laboratoryWebsite || '',
        laboratoryAddress: address,
        laboratoryPinCode: pinCode,
        laboratoryCity: data.city || '',
        laboratoryGoogleMapsLink: googleMapsLink,
        laboratoryServices: services,
        coverImage,
        isAvailable: data.isAvailable || false,
        availableDays: data.availableDays || [],
        availableSlots: data.availableSlots || []
      };
      
      // Return updated state
      return {
        laboratoryName: data.laboratoryName || '',
        laboratoryPhone: data.laboratoryPhone || '',
        laboratoryEmail: data.laboratoryEmail || '',
        laboratoryWebsite: data.laboratoryWebsite || '',
        laboratoryAddress: address,
        laboratoryPinCode: pinCode,
        laboratoryCity: data.city || '',
        laboratoryGoogleMapsLink: googleMapsLink,
        laboratoryServices: services,
        coverImage,
        isAvailable: data.isAvailable || false,
        availableDays: data.availableDays || [],
        availableSlots: data.availableSlots || [],
        savedValues
      };
    });
  },
  
  prepareProfileData: () => {
    const state = get();
    
    // Format laboratory address
    const laboratoryAddressData: Address = {
      address: state.laboratoryAddress,
      pinCode: state.laboratoryPinCode,
      googleMapsLink: state.laboratoryGoogleMapsLink,
      latitude: null,
      longitude: null
    };
    
    // Format laboratory services
    const laboratoryServices = state.laboratoryServices.map(service => ({
      name: service.name,
      description: service.description,
      coverImage: service.coverImage,
      collectionType: service.collectionType,
      price: service.price ? parseFloat(service.price) : undefined,
      category: service.category,
      tests: service.tests.map(test => ({
        name: test.name,
        description: test.description
      }))
    }));
    
    return {
      laboratoryName: state.laboratoryName,
      laboratoryPhone: state.laboratoryPhone,
      laboratoryEmail: state.laboratoryEmail,
      laboratoryWebsite: state.laboratoryWebsite,
      laboratoryAddress: laboratoryAddressData,
      city: state.laboratoryCity,
      laboratoryServices,
      coverImage: state.coverImage,
      isAvailable: state.isAvailable,
      availableDays: state.availableDays,
      availableSlots: state.availableSlots
    };
  },
  
  reset: () => set({
    laboratoryName: '',
    laboratoryPhone: '',
    laboratoryEmail: '',
    laboratoryWebsite: '',
    laboratoryAddress: '',
    laboratoryPinCode: '',
    laboratoryCity: '',
    laboratoryGoogleMapsLink: '',
    laboratoryServices: [],
    coverImage: '',
    isAvailable: false,
    availableDays: [],
    availableSlots: [],
    savedValues: {
      laboratoryName: '',
      laboratoryPhone: '',
      laboratoryEmail: '',
      laboratoryWebsite: '',
      laboratoryAddress: '',
      laboratoryPinCode: '',
      laboratoryCity: '',
      laboratoryGoogleMapsLink: '',
      laboratoryServices: [],
      coverImage: '',
      isAvailable: false,
      availableDays: [],
      availableSlots: []
    }
  })
}));

// UI STATE STORE
interface ProfileUIState {
  loading: boolean;
  uploading: boolean;
  updating: boolean;
  uploadingImage: boolean;
  uploadingPdf: boolean;
  uploadingCoverImage: boolean;
  showImageOptions: boolean;
  showCitiesPopup: boolean;
  cities: string[];
  labServiceCategories: string[];
  hasLoadedAvailableCities: boolean;
  hasLoadedAvailableSpecializations: boolean;
  hasLoadedAvailableQualifications: boolean;
  hasLoadedLabServiceCategories: boolean;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setUploading: (uploading: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setUploadingImage: (uploading: boolean) => void;
  setUploadingPdf: (uploading: boolean) => void;
  setUploadingCoverImage: (uploading: boolean) => void;
  setShowImageOptions: (show: boolean) => void;
  setShowCitiesPopup: (show: boolean) => void;
  setCities: (cities: string[]) => void;
  setLabServiceCategories: (categories: string[]) => void;
  setHasLoadedAvailableCities: (loaded: boolean) => void;
  setHasLoadedAvailableSpecializations: (loaded: boolean) => void;
  setHasLoadedAvailableQualifications: (loaded: boolean) => void;
  setHasLoadedLabServiceCategories: (loaded: boolean) => void;
  reset: () => void;
}

export const useProfileUIStore = create<ProfileUIState>((set) => ({
  // Initial state
  loading: false,
  uploading: false,
  updating: false,
  uploadingImage: false,
  uploadingPdf: false,
  uploadingCoverImage: false,
  showImageOptions: false,
  showCitiesPopup: false,
  cities: [],
  labServiceCategories: [],
  hasLoadedAvailableCities: false,
  hasLoadedAvailableSpecializations: false,
  hasLoadedAvailableQualifications: false,
  hasLoadedLabServiceCategories: false,
  
  // Actions
  setLoading: (loading) => set({ loading }),
  setUploading: (uploading) => set({ uploading }),
  setUpdating: (updating) => set({ updating }),
  setUploadingImage: (uploadingImage) => set({ uploadingImage }),
  setUploadingPdf: (uploadingPdf) => set({ uploadingPdf }),
  setUploadingCoverImage: (uploadingCoverImage) => set({ uploadingCoverImage }),
  setShowImageOptions: (showImageOptions) => set({ showImageOptions }),
  setShowCitiesPopup: (showCitiesPopup) => set({ showCitiesPopup }),
  setCities: (cities) => set((state) => {
    // Only set cities if they haven't been loaded yet
    if (!state.hasLoadedAvailableCities && cities.length > 0) {
      return { cities, hasLoadedAvailableCities: true };
    }
    return state;
  }),
  setLabServiceCategories: (categories) => set((state) => {
    // Only set categories if they haven't been loaded yet
    if (!state.hasLoadedLabServiceCategories && categories.length > 0) {
      return { labServiceCategories: categories, hasLoadedLabServiceCategories: true };
    }
    return state;
  }),
  setHasLoadedAvailableCities: (loaded) => set({ hasLoadedAvailableCities: loaded }),
  setHasLoadedAvailableSpecializations: (loaded) => set({ hasLoadedAvailableSpecializations: loaded }),
  setHasLoadedAvailableQualifications: (loaded) => set({ hasLoadedAvailableQualifications: loaded }),
  setHasLoadedLabServiceCategories: (loaded) => set({ hasLoadedLabServiceCategories: loaded }),
  reset: () => set({
    loading: false,
    uploading: false,
    updating: false,
    uploadingImage: false,
    uploadingPdf: false,
    uploadingCoverImage: false,
    showImageOptions: false,
    showCitiesPopup: false,
    cities: [],
    labServiceCategories: [],
    hasLoadedAvailableCities: false,
    hasLoadedAvailableSpecializations: false,
    hasLoadedAvailableQualifications: false,
    hasLoadedLabServiceCategories: false,
  })
})); 