import type { Request, Response } from 'express';
import User from '../models/userModel';
import { UserProfile, DoctorProfile, LaboratoryProfile, DeliveryBoyProfile } from '../models/profileModel';
import DoctorAppointments from '../models/doctorAppointments';
import LabAppointments from '../models/labAppointments';

export const getAllData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type = 'users', role, page = 1, limit = 20, search = '' } = req.query;

    // Validate input parameters
    const validTypes = ['users', 'doctors', 'laboratories', 'deliverypartners'];
    if (!validTypes.includes(type as string)) {
      res.status(400).json({ message: 'Invalid type', validTypes });
      return;
    }

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

    let Model: any;
    let filter: any = {};
    let populateOptions: any = null;

    switch (type) {
      case 'users':
        Model = User;
        if (search) {
          filter.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } }
          ];
        }
        break;

      case 'doctors':
        Model = DoctorProfile;
        populateOptions = { path: 'user', select: 'name email phone role' };
        if (search) {
          // Only use RegExp if search is a string
          const searchStr = typeof search === 'string' ? search : '';
          filter.$or = [
            { 'user.name': { $regex: searchStr, $options: 'i' } },
            { 'user.email': { $regex: searchStr, $options: 'i' } },
            { specializations: { $regex: searchStr, $options: 'i' } },
            { qualifications: { $regex: searchStr, $options: 'i' } },
            { city: { $regex: searchStr, $options: 'i' } }
          ];
        }
        break;

      case 'laboratories':
        Model = LaboratoryProfile;
        populateOptions = { path: 'user', select: 'name email phone role' };
        if (search) {
          const searchStr = typeof search === 'string' ? search : '';
          filter.$or = [
            { 'user.name': { $regex: searchStr, $options: 'i' } },
            { 'user.email': { $regex: searchStr, $options: 'i' } },
            { laboratoryName: { $regex: searchStr, $options: 'i' } },
            { city: { $regex: searchStr, $options: 'i' } }
          ];
        }
        break;

      case 'deliverypartners':
        Model = DeliveryBoyProfile;
        populateOptions = { path: 'user', select: 'name email phone role' };
        if (search) {
          const searchStr = typeof search === 'string' ? search : '';
          filter.$or = [
            { 'user.name': { $regex: searchStr, $options: 'i' } },
            { 'user.email': { $regex: searchStr, $options: 'i' } },
            { city: { $regex: searchStr, $options: 'i' } }
          ];
        }
        break;

      default:
        res.status(400).json({ message: 'Invalid type. Use: users, doctors, laboratories, or deliverypartners' });
        return;
    }

    let query = Model.find(filter)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    if (populateOptions) {
      query = query.populate(populateOptions);
    }

    const data = await query.exec();
    const total = await Model.countDocuments(filter);

    // Return appropriate response format
    if (type === 'users') {
      res.json({ users: data, total });
    } else {
      res.json({ profiles: data, total });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err instanceof Error ? err.message : err });
  }
};

export const getProfileById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type = 'doctors' } = req.query;
    const { id } = req.params;

    // Validate type parameter
    const validTypes = ['users', 'doctors', 'laboratories', 'deliverypartners'];
    if (!validTypes.includes(type as string)) {
      res.status(400).json({
        message: 'Invalid type. Use: users, doctors, laboratories, or deliverypartners',
        validTypes
      });
      return;
    }

    // Validate profile ID
    if (!id || id.length !== 24) {
      res.status(400).json({ message: 'Invalid profile ID format' });
      return;
    }

    let Model: any;
    let populateOptions: any = null;

    switch (type) {
      case 'users':
        Model = User;
        break;
      case 'doctors':
        Model = DoctorProfile;
        populateOptions = { path: 'user', select: 'name email phone role' };
        break;
      case 'laboratories':
        Model = LaboratoryProfile;
        populateOptions = { path: 'user', select: 'name email phone role' };
        break;
      case 'deliverypartners':
        Model = DeliveryBoyProfile;
        populateOptions = { path: 'user', select: 'name email phone role' };
        break;
    }

    let profile;
    if (type === 'users') {
      profile = await Model.findById(id);
    } else {
      profile = await Model.findById(id).populate(populateOptions);
    }

    if (!profile) {
      res.status(404).json({
        message: 'Profile not found',
        profileId: id,
        type: type
      });
      return;
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};

export const verifyProfileById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type = 'doctors' } = req.body;

    // Validate type parameter
    const validTypes = ['doctors', 'laboratories', 'deliverypartners'];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        message: 'Invalid type. Use: doctors, laboratories, or deliverypartners',
        validTypes
      });
      return;
    }

    let Model: any;
    let populateOptions: any = null;

    switch (type) {
      case 'doctors':
        Model = DoctorProfile;
        populateOptions = { path: 'user', select: 'name email phone role' };
        break;
      case 'laboratories':
        Model = LaboratoryProfile;
        populateOptions = { path: 'user', select: 'name email phone role' };
        break;
      case 'deliverypartners':
        Model = DeliveryBoyProfile;
        populateOptions = { path: 'user', select: 'name email phone role' };
        break;
    }

    // Validate profile ID
    if (!req.params.id || req.params.id.length !== 24) {
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }

    const profile = await Model.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).populate(populateOptions);

    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err instanceof Error ? err.message : err });
  }
};

export const unverifyProfileById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type = 'doctors' } = req.body;

    // Validate type parameter
    const validTypes = ['doctors', 'laboratories', 'deliverypartners'];
    if (!validTypes.includes(type)) {
      res.status(400).json({
        message: 'Invalid type. Use: doctors, laboratories, or deliverypartners',
        validTypes
      });
      return;
    }

    let Model: any;
    let populateOptions: any = null;

    switch (type) {
      case 'doctors':
        Model = DoctorProfile;
        populateOptions = { path: 'user', select: 'name email phone role' };
        break;
      case 'laboratories':
        Model = LaboratoryProfile;
        populateOptions = { path: 'user', select: 'name email phone role' };
        break;
      case 'deliverypartners':
        Model = DeliveryBoyProfile;
        populateOptions = { path: 'user', select: 'name email phone role' };
        break;
    }

    // Validate profile ID
    if (!req.params.id || req.params.id.length !== 24) {
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }

    const profile = await Model.findByIdAndUpdate(
      req.params.id,
      { isVerified: false },
      { new: true }
    ).populate(populateOptions);

    if (!profile) {
      res.status(404).json({ message: 'Profile not found' });
      return;
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err instanceof Error ? err.message : err });
  }
};

// Get user profile by user ID (for admin)
export const getUserProfileByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!userId || userId.length !== 24) {
      res.status(400).json({ message: 'Invalid user ID format' });
      return;
    }
    const profile = await UserProfile.findOne({ user: userId });
    if (!profile) {
      res.status(404).json({ message: 'Profile not found for user', userId });
      return;
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err instanceof Error ? err.message : err });
  }
};

// Fetch all doctor appointments for admin
export const getAllDoctorAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.query;
    let filter: any = {};
    
    if (doctorId) {
      filter.doctor = doctorId;
    }
    
    console.log('Doctor appointments filter:', filter);
    
    const appointments = await DoctorAppointments.find(filter)
      .populate({
        path: 'doctor',
        select: 'name email phone',
        model: 'User'
      })
      .populate({
        path: 'patient',
        select: 'name email phone',
        model: 'User'
      })
      .populate('clinic', 'clinicName clinicAddress');
    
    console.log('Found appointments:', appointments.length);
    console.log('Sample appointment doctor data:', appointments[0]?.doctor);
    console.log('Sample appointment patient data:', appointments[0]?.patient);
    console.log('Sample appointment clinic data:', appointments[0]?.clinic);
    
    // Check for appointments without doctor data
    const appointmentsWithoutDoctor = appointments.filter(apt => !apt.doctor);
    console.log('Appointments without doctor data:', appointmentsWithoutDoctor.length);
    
    res.json({ appointments });
  } catch (err) {
    console.error('Error fetching doctor appointments:', err);
    res.status(500).json({ message: 'Server error', error: err instanceof Error ? err.message : err });
  }
};

// Fetch all lab appointments for admin
export const getAllLabAppointments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { labId } = req.query;
    let filter: any = {};
    
    if (labId) {
      filter.lab = labId;
    }
    
    console.log('Lab appointments filter:', filter);
    
    const appointments = await LabAppointments.find(filter)
      .populate({
        path: 'lab',
        select: 'name email phone',
        model: 'User'
      })
      .populate({
        path: 'patient',
        select: 'name email phone',
        model: 'User'
      })
      .populate('laboratoryService', 'name description price');
    
    console.log('Found lab appointments:', appointments.length);
    console.log('Sample appointment lab data:', appointments[0]?.lab);
    console.log('Sample appointment patient data:', appointments[0]?.patient);
    console.log('Sample appointment service data:', appointments[0]?.laboratoryService);
    
    // Check for appointments without lab data
    const appointmentsWithoutLab = appointments.filter(apt => !apt.lab);
    console.log('Appointments without lab data:', appointmentsWithoutLab.length);
    
    res.json({ appointments });
  } catch (err) {
    console.error('Error fetching lab appointments:', err);
    res.status(500).json({ message: 'Server error', error: err instanceof Error ? err.message : err });
  }
};

// Role management functions
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;

    // Validate user ID
    if (!userId || userId.length !== 24) {
      res.status(400).json({ message: 'Invalid user ID format' });
      return;
    }

    // Validate new role
    const validRoles = ['admin', 'user', 'doctor', 'laboratory', 'deliverypartner'];
    if (!validRoles.includes(newRole)) {
      res.status(400).json({ 
        message: 'Invalid role. Use: admin, user, doctor, laboratory, or deliverypartner',
        validRoles 
      });
      return;
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Prevent admin from removing their own admin role
    const currentAdminId = (req as any).user?._id;
    if (userId === currentAdminId && newRole !== 'admin') {
      res.status(403).json({ message: 'Cannot remove your own admin privileges' });
      return;
    }

    // Update user role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: newRole },
      { new: true, select: 'name email phone role isPhoneEmailVerified createdAt updatedAt' }
    );

    res.json({
      message: `User role updated successfully to ${newRole}`,
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server error', 
      error: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
};

export const getAllUsersWithRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, search = '', role = '' } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

    // Build filter
    let filter: any = {};
    
    if (role && role !== 'all') {
      filter.role = role;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Get users with pagination
    const users = await User.find(filter)
      .select('name email phone role isPhoneEmailVerified createdAt updatedAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    // Get role counts for statistics
    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      users,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
      roleStats
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server error', 
      error: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
};

export const removeAdminRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!userId || userId.length !== 24) {
      res.status(400).json({ message: 'Invalid user ID format' });
      return;
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user is actually an admin
    if (user.role !== 'admin') {
      res.status(400).json({ message: 'User is not an admin' });
      return;
    }

    // Prevent admin from removing their own admin role
    const currentAdminId = (req as any).user?._id;
    if (userId === currentAdminId) {
      res.status(403).json({ message: 'Cannot remove your own admin privileges' });
      return;
    }

    // Remove admin role (set to user)
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: 'user' },
      { new: true, select: 'name email phone role isPhoneEmailVerified createdAt updatedAt' }
    );

    res.json({
      message: 'Admin privileges removed successfully',
      user: updatedUser
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Server error', 
      error: err instanceof Error ? err.message : 'Unknown error' 
    });
  }
};