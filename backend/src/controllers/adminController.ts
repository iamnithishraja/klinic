import type { Request, Response } from 'express';
import User from '../models/userModel';
import { UserProfile, DoctorProfile, LaboratoryProfile, DeliveryBoyProfile } from '../models/profileModel';
import DoctorAppointments from '../models/doctorAppointments';
import LabAppointments from '../models/labAppointments';
import SuspendedUser from '../models/suspendedUserModel';
import Product from '../models/productModel';
import Order from '../models/ordersModel';
import mongoose from 'mongoose';

export const getAllData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type = 'users', role, page = 1, limit = 20, search = '' } = req.query;

    // Validate input parameters
    const validTypes = ['users', 'doctors', 'laboratories', 'deliverypartners', 'products', 'orders'];
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
            { city: { $regex: searchStr, $options: 'i' } },
            { laboratoryEmail: { $regex: searchStr, $options: 'i' } },
            { laboratoryPhone: { $regex: searchStr, $options: 'i' } }
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

      case 'products':
        Model = Product;
        if (search) {
          const searchStr = typeof search === 'string' ? search : '';
          filter.$or = [
            { name: { $regex: searchStr, $options: 'i' } },
            { description: { $regex: searchStr, $options: 'i' } }
          ];
        }
        break;

      case 'orders':
        Model = Order;
        populateOptions = [
          { path: 'orderedBy', select: 'name email phone' },
          { path: 'laboratoryUser', select: 'name email phone' },
          { path: 'products.product', select: 'name price imageUrl' }
        ];
        if (search) {
          const searchStr = typeof search === 'string' ? search : '';
          filter.$or = [
            { orderId: { $regex: searchStr, $options: 'i' } },
            { 'orderedBy.name': { $regex: searchStr, $options: 'i' } },
            { 'orderedBy.email': { $regex: searchStr, $options: 'i' } }
          ];
        }
        break;

      default:
        res.status(400).json({ message: 'Invalid type. Use: users, doctors, laboratories, deliverypartners, products, or orders' });
        return;
    }

    let query = Model.find(filter)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    if (populateOptions) {
      if (Array.isArray(populateOptions)) {
        // Handle multiple populate options (for orders)
        populateOptions.forEach((populateOption: any) => {
          query = query.populate(populateOption);
        });
      } else {
        // Handle single populate option (for other types)
        query = query.populate(populateOptions);
      }
    }

    const data = await query.exec();
    const total = await Model.countDocuments(filter);

    // Return appropriate response format
    if (type === 'users') {
      res.json({ users: data, total });
    } else if (type === 'products') {
      res.json({ products: data, total });
    } else if (type === 'orders') {
      res.json({ orders: data, total });
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

    // Set isVerified and status
    const profile = await Model.findByIdAndUpdate(
      req.params.id,
      { isVerified: true, status: 'verified' },
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

    // Set isVerified and status
    const profile = await Model.findByIdAndUpdate(
      req.params.id,
      { isVerified: false, status: 'not_verified' },
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

// --- Admin Dashboard: Revenue Overview ---
export const getRevenueOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    // Doctor appointments: paid and unpaid
    const doctorPaid = await DoctorAppointments.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$consultationFee' } } }
    ]);
    const doctorUnpaid = await DoctorAppointments.aggregate([
      { $match: { isPaid: false } },
      { $group: { _id: null, total: { $sum: '$consultationFee' } } }
    ]);
    // Lab appointments: paid and unpaid (FIX: use serviceFee instead of totalPrice)
    const labPaid = await LabAppointments.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$serviceFee' } } }
    ]);
    const labUnpaid = await LabAppointments.aggregate([
      { $match: { isPaid: false } },
      { $group: { _id: null, total: { $sum: '$serviceFee' } } }
    ]);
    const totalRevenue = (doctorPaid[0]?.total || 0) + (labPaid[0]?.total || 0);
    const upcomingRevenue = (doctorUnpaid[0]?.total || 0) + (labUnpaid[0]?.total || 0);
    res.json({ totalRevenue, upcomingRevenue });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch revenue overview', error: err instanceof Error ? err.message : err });
  }
};

// 2. System Notifications
export const getSystemNotifications = async (req: Request, res: Response): Promise<void> => {
  // For now, return static notifications. You can enhance this to fetch from DB or system health checks.
  const notifications = [
    { title: 'System Healthy', message: 'API server, database, and file storage are operational.', type: 'success', time: new Date() },
    { title: 'No critical alerts', message: 'No issues detected in the last 24 hours.', type: 'info', time: new Date() }
  ];
  res.json({ notifications });
};

// 3. Recent Activity Feed
export const getRecentActivityFeed = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get latest users, doctors, labs, delivery partners (limit 5 each)
    const users = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt');
    const doctors = await DoctorProfile.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email').select('createdAt');
    const labs = await LaboratoryProfile.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email').select('createdAt');
    const deliveryPartners = await DeliveryBoyProfile.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name email').select('createdAt');
    // Get latest paid doctor/lab appointments (limit 5 each)
    const doctorPayments = await DoctorAppointments.find({ isPaid: true }).sort({ updatedAt: -1 }).limit(5).select('doctor patient consultationFee updatedAt');
    const labPayments = await LabAppointments.find({ isPaid: true }).sort({ updatedAt: -1 }).limit(5).select('lab patient totalPrice updatedAt');
    res.json({ users, doctors, labs, deliveryPartners, doctorPayments, labPayments });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch activity feed', error: err instanceof Error ? err.message : err });
  }
};

// --- User Suspension Management ---

// Suspend a user
export const suspendUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, reason, expiresAt, notes } = req.body;
    const adminId = (req as any).user?._id;

    if (!adminId) {
      res.status(401).json({ message: 'Admin authentication required' });
      return;
    }

    if (!userId || !reason) {
      res.status(400).json({ message: 'User ID and reason are required' });
      return;
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check if user is already suspended
    const existingSuspension = await SuspendedUser.findOne({
      $or: [
        { email: user.email },
        { phone: user.phone }
      ],
      isActive: true
    });

    if (existingSuspension) {
      res.status(400).json({ message: 'User is already suspended' });
      return;
    }

    // Create suspension record
    const suspensionData: any = {
      reason,
      suspendedBy: adminId,
      isActive: true
    };

    if (user.email) {
      suspensionData.email = user.email;
    }
    if (user.phone) {
      suspensionData.phone = user.phone;
    }
    if (expiresAt) {
      suspensionData.expiresAt = new Date(expiresAt);
    }
    if (notes) {
      suspensionData.notes = notes;
    }

    const suspendedUser = await SuspendedUser.create(suspensionData);

    res.status(200).json({
      message: 'User suspended successfully',
      suspension: suspendedUser
    });
  } catch (err) {
    console.error('Error suspending user:', err);
    res.status(500).json({ message: 'Server error', error: err instanceof Error ? err.message : err });
  }
};

// Unsuspend a user
export const unsuspendUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const adminId = (req as any).user?._id;

    if (!adminId) {
      res.status(401).json({ message: 'Admin authentication required' });
      return;
    }

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Find and deactivate suspension
    const suspension = await SuspendedUser.findOne({
      $or: [
        { email: user.email },
        { phone: user.phone }
      ],
      isActive: true
    });

    if (!suspension) {
      res.status(404).json({ message: 'No active suspension found for this user' });
      return;
    }

    suspension.isActive = false;
    await suspension.save();

    res.status(200).json({
      message: 'User unsuspended successfully',
      suspension
    });
  } catch (err) {
    console.error('Error unsuspending user:', err);
    res.status(500).json({ message: 'Server error', error: err instanceof Error ? err.message : err });
  }
};

// Get user suspension status
export const getUserSuspensionStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' });
      return;
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    // Check suspension status
    const suspension = await SuspendedUser.getSuspensionDetails(user.email, user.phone);

    res.status(200).json({
      isSuspended: !!suspension,
      suspension: suspension || null
    });
  } catch (err) {
    console.error('Error getting user suspension status:', err);
    res.status(500).json({ message: 'Server error', error: err instanceof Error ? err.message : err });
  }
};

// Get all suspensions
export const getAllSuspensions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

    let filter: any = {};
    if (search) {
      const searchStr = typeof search === 'string' ? search : '';
      filter.$or = [
        { email: { $regex: searchStr, $options: 'i' } },
        { phone: { $regex: searchStr, $options: 'i' } },
        { reason: { $regex: searchStr, $options: 'i' } }
      ];
    }

    const suspensions = await SuspendedUser.find(filter)
      .populate('suspendedBy', 'name email')
      .sort({ suspendedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const total = await SuspendedUser.countDocuments(filter);

    res.status(200).json({
      suspensions,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (err) {
    console.error('Error getting all suspensions:', err);
    res.status(500).json({ message: 'Server error', error: err instanceof Error ? err.message : err });
  }
};

// --- Admin Dashboard: Revenue Details ---
export const getRevenueDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    // Doctor Appointments
    const allDoctorAppointments = await DoctorAppointments.find()
      .populate('patient', 'name email phone')
      .populate('doctor', 'name email phone');
    const paidDoctorAppointments: any[] = [];
    const unpaidDoctorAppointments: any[] = [];
    let totalDoctorRevenue = 0;
    let upcomingDoctorRevenue = 0;
    for (const apt of allDoctorAppointments) {
      if (apt.consultationType === 'online') {
        if (apt.isPaid) {
          paidDoctorAppointments.push(apt);
          totalDoctorRevenue += apt.consultationFee || 0;
        } else {
          unpaidDoctorAppointments.push(apt);
          upcomingDoctorRevenue += apt.consultationFee || 0;
        }
      } else if (apt.consultationType === 'in-person') {
        if (apt.isPaid && apt.status === 'completed') {
          paidDoctorAppointments.push(apt);
          totalDoctorRevenue += apt.consultationFee || 0;
        } else {
          unpaidDoctorAppointments.push(apt);
          upcomingDoctorRevenue += apt.consultationFee || 0;
        }
      }
    }

    // Lab Appointments
    const allLabAppointments = await LabAppointments.find()
      .populate('patient', 'name email phone')
      .populate('lab', 'name email phone')
      .populate('laboratoryService', 'name price');
    const paidLabAppointments: any[] = [];
    const unpaidLabAppointments: any[] = [];
    let totalLabRevenue = 0;
    let upcomingLabRevenue = 0;
    for (const apt of allLabAppointments) {
      // Use serviceFee if present, else fallback to laboratoryService.price
      const price = apt.serviceFee != null ? apt.serviceFee : (apt.laboratoryService && typeof apt.laboratoryService === 'object' ? (apt.laboratoryService.price || 0) : 0);
      if (apt.collectionType === 'home') {
        if (apt.isPaid) {
          paidLabAppointments.push(apt);
          totalLabRevenue += price;
        } else {
          unpaidLabAppointments.push(apt);
          upcomingLabRevenue += price;
        }
      } else if (apt.collectionType === 'lab') {
        if (apt.isPaid && (apt.status === 'completed' || apt.status === 'marked-as-read')) {
          paidLabAppointments.push(apt);
          totalLabRevenue += price;
        } else {
          unpaidLabAppointments.push(apt);
          upcomingLabRevenue += price;
        }
      }
    }

    const totalRevenue = totalDoctorRevenue + totalLabRevenue;
    const upcomingRevenue = upcomingDoctorRevenue + upcomingLabRevenue;

    res.json({
      totalDoctorRevenue,
      totalLabRevenue,
      totalRevenue,
      upcomingDoctorRevenue,
      upcomingLabRevenue,
      upcomingRevenue,
      paidDoctorAppointments,
      unpaidDoctorAppointments,
      paidLabAppointments,
      unpaidLabAppointments
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch revenue details', error: err instanceof Error ? err.message : err });
  }
};

export const rejectDoctorProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!id || id.length !== 24) {
      res.status(400).json({ message: 'Invalid profile ID format' });
      return;
    }

    const profile = await DoctorProfile.findByIdAndUpdate(
      id,
      { 
        status: 'rejected',
        rejectionReason: reason || 'Profile rejected by admin'
      },
      { new: true }
    ).populate('user', 'name email phone role');

    if (!profile) {
      res.status(404).json({ message: 'Doctor profile not found' });
      return;
    }

    res.json({ 
      message: 'Doctor profile rejected successfully',
      profile 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err instanceof Error ? err.message : err });
  }
};

// Admin endpoints for products
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
    
    const filters: any = {};
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (minPrice) {
      filters.price = { $gte: Number(minPrice) };
    }
    if (maxPrice) {
      filters.price = { ...filters.price, $lte: Number(maxPrice) };
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));

    const products = await Product.find(filters)
      .populate('user', 'name email phone')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await Product.countDocuments(filters);

    res.json({
      success: true,
      data: {
        products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    if (!productId || productId.length !== 24) {
      res.status(400).json({ 
        success: false, 
        error: 'Invalid product ID format' 
      });
      return;
    }

    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      res.status(404).json({ 
        success: false, 
        error: 'Product not found' 
      });
      return;
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// Admin endpoints for orders
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, status, needAssignment, page = 1, limit = 10 } = req.query;
    
    const filters: any = {};
    if (search) {
      filters.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'orderedBy.name': { $regex: search, $options: 'i' } },
        { 'orderedBy.email': { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      filters.status = status;
    }
    if (needAssignment === 'true') {
      filters.needAssignment = true;
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 10));

    const orders = await Order.find(filters)
      .populate('orderedBy', 'name email phone')
      .populate('laboratoryUser', 'name email phone')
      .populate('deliveryPartner', 'name email phone')
      .populate('products.product', 'name price imageUrl user')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    // Transform orders to include comprehensive information
    const transformedOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Add user information
      orderObj.user = orderObj.orderedBy;
      
      // Add laboratory information
      if (orderObj.laboratoryUser) {
        orderObj.assignedLab = {
          _id: orderObj.laboratoryUser._id,
          name: orderObj.laboratoryUser.name,
          email: orderObj.laboratoryUser.email,
          phone: orderObj.laboratoryUser.phone
        };
      }
      
      // Add delivery partner information
      if (orderObj.deliveryPartner) {
        orderObj.assignedDeliveryPartner = {
          _id: orderObj.deliveryPartner._id,
          name: orderObj.deliveryPartner.name,
          email: orderObj.deliveryPartner.email,
          phone: orderObj.deliveryPartner.phone
        };
      }
      
      // Transform products to include laboratory information
      if (orderObj.products && orderObj.products.length > 0) {
        orderObj.products = orderObj.products.map((item: any) => ({
          _id: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          imageUrl: item.product.imageUrl,
          laboratory: item.product.user ? {
            _id: item.product.user._id,
            name: item.product.user.name,
            email: item.product.user.email,
            phone: item.product.user.phone
          } : null
        }));
      }
      
      return orderObj;
    });

    const total = await Order.countDocuments(filters);

    res.json({
      success: true,
      data: {
        orders: transformedOrders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

export const getOrderDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({ 
        success: false, 
        error: 'Order ID is required' 
      });
      return;
    }

    const order = await Order.findById(orderId)
      .populate('orderedBy', 'name email phone')
      .populate('laboratoryUser', 'name email phone')
      .populate('deliveryPartner', 'name email phone')
      .populate('products.product', 'name price imageUrl user');

    if (!order) {
      res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
      return;
    }

    const orderObj = order.toObject();
    
    // Add comprehensive user information
    orderObj.user = {
      _id: orderObj.orderedBy._id,
      name: orderObj.orderedBy.name,
      email: orderObj.orderedBy.email,
      phone: orderObj.orderedBy.phone
    };
    
    // Add comprehensive laboratory information
    if (orderObj.laboratoryUser) {
      orderObj.assignedLab = {
        _id: orderObj.laboratoryUser._id,
        name: orderObj.laboratoryUser.name,
        email: orderObj.laboratoryUser.email,
        phone: orderObj.laboratoryUser.phone
      };
    }
    
    // Add comprehensive delivery partner information
    if (orderObj.deliveryPartner) {
      orderObj.assignedDeliveryPartner = {
        _id: orderObj.deliveryPartner._id,
        name: orderObj.deliveryPartner.name,
        email: orderObj.deliveryPartner.email,
        phone: orderObj.deliveryPartner.phone
      };
    }
    
    // Transform products to include laboratory information
    if (orderObj.products && orderObj.products.length > 0) {
      orderObj.products = orderObj.products.map((item: any) => ({
        _id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        imageUrl: item.product.imageUrl,
        laboratory: item.product.user ? {
          _id: item.product.user._id,
          name: item.product.user.name,
          email: item.product.user.email,
          phone: item.product.user.phone
        } : null
      }));
    }

    res.json({
      success: true,
      data: orderObj
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

export const getOrderStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Simple aggregation to get all stats in one query
    const stats = await Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalPrice' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          outForDelivery: {
            $sum: { $cond: [{ $eq: ['$status', 'out_for_delivery'] }, 1, 0] }
          },
          delivered: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          needsAssignment: {
            $sum: { $cond: [{ $eq: ['$needAssignment', true] }, 1, 0] }
          }
        }
      }
    ]);

    // Get today's delivered orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = await Order.countDocuments({ 
      status: 'delivered', 
      updatedAt: { $gte: today } 
    });

    const result = stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      outForDelivery: 0,
      delivered: 0,
      needsAssignment: 0
    };

    res.json({
      success: true,
      data: {
        totalOrders: result.totalOrders,
        pendingOrders: result.pendingOrders,
        completedToday,
        outForDelivery: result.outForDelivery,
        needsAssignment: result.needsAssignment,
        totalRevenue: result.totalRevenue
      }
    });
  } catch (err) {
    console.error('Error in getOrderStats:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
};

export const assignLabToOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { labId } = req.body;

    console.log('Assigning lab to order:', { orderId, labId });

    // First check if order exists
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
      return;
    }

    // Check if labId is a profile ID or user ID
    let labUserId = labId;
    
    // First try to find if it's a profile ID
    const { LaboratoryProfile } = await import('../models/profileModel');
    const labProfile = await LaboratoryProfile.findById(labId).populate('user', '_id name email phone role');
    
    if (labProfile && labProfile.user) {
      // It's a profile ID, get the user ID
      labUserId = labProfile.user._id.toString();
      console.log('Found lab profile, using user ID:', labUserId);
    } else {
      // Check if it's already a user ID
      const labUser = await User.findById(labId);
      if (!labUser || labUser.role !== 'laboratory') {
        res.status(404).json({ 
          success: false, 
          error: 'Laboratory not found or invalid role' 
        });
        return;
      }
      console.log('Using provided ID as user ID:', labUserId);
    }

    const labObjectId = new mongoose.Types.ObjectId(labUserId);
    
    // Update the order
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        laboratoryUser: labObjectId,
        needAssignment: false,
        status: 'confirmed', // Update status to confirmed when lab is assigned
        updatedAt: new Date()
      },
      { new: true }
    ).populate('orderedBy', 'name email phone')
     .populate('laboratoryUser', 'name email phone')
     .populate('products.product', 'name price imageUrl');

    console.log('Order updated successfully:', {
      orderId: order?._id,
      laboratoryUser: order?.laboratoryUser,
      needAssignment: order?.needAssignment
    });

    res.json({
      success: true,
      data: order,
      message: 'Laboratory assigned to order successfully'
    });
  } catch (err) {
    console.error('Error assigning lab to order:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

export const assignDeliveryPartnerToOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { deliveryPartnerId } = req.body;

    // First check if order exists
    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
      return;
    }

    // Check if delivery partner exists
    const deliveryPartner = await User.findById(deliveryPartnerId);
    if (!deliveryPartner || deliveryPartner.role !== 'deliverypartner') {
      res.status(404).json({ 
        success: false, 
        error: 'Delivery partner not found' 
      });
      return;
    }

    const deliveryPartnerObjectId = new mongoose.Types.ObjectId(deliveryPartnerId);
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        deliveryPartner: deliveryPartnerObjectId,
        status: 'assigned_to_delivery',
        assignedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('orderedBy', 'name email phone')
     .populate('laboratoryUser', 'name email phone')
     .populate('deliveryPartner', 'name email phone')
     .populate('products.product', 'name price imageUrl');

    res.json({
      success: true,
      data: order,
      message: 'Delivery partner assigned to order successfully'
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

export const getAvailableDeliveryPartners = async (req: Request, res: Response): Promise<void> => {
  try {
    const deliveryPartners = await User.find({ 
      role: 'deliverypartner',
      isPhoneEmailVerified: true
    }).select('name email phone');

    // If no verified delivery partners, try to get all delivery partners
    let partners = deliveryPartners;
    if (deliveryPartners.length === 0) {
      partners = await User.find({ 
        role: 'deliverypartner'
      }).select('name email phone');
    }

    res.json({
      success: true,
      data: partners
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

export const getDeliveryPartnerDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { partnerId } = req.params;

    if (!partnerId) {
      res.status(400).json({ 
        success: false, 
        error: 'Delivery partner ID is required' 
      });
      return;
    }

    // Find the delivery partner profile
    const deliveryPartnerProfile = await DeliveryBoyProfile.findById(partnerId)
      .populate('user', 'name email phone role isPhoneEmailVerified createdAt updatedAt');

    if (!deliveryPartnerProfile) {
      res.status(404).json({ 
        success: false, 
        error: 'Delivery partner not found' 
      });
      return;
    }

    // Get delivery partner statistics
    const stats = await Order.aggregate([
      {
        $match: {
          deliveryPartner: deliveryPartnerProfile.user._id,
          status: { $in: ['delivered', 'out_for_delivery', 'delivery_accepted', 'assigned_to_delivery'] }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $in: ['$status', ['assigned_to_delivery', 'delivery_accepted', 'out_for_delivery']] }, 1, 0] }
          },
          totalRevenue: { $sum: '$totalPrice' }
        }
      }
    ]);

    // Get recent orders
    const recentOrders = await Order.find({ 
      deliveryPartner: deliveryPartnerProfile.user._id 
    })
      .populate('orderedBy', 'name email phone')
      .populate('laboratoryUser', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(10);

    const partnerData = {
      profile: deliveryPartnerProfile,
      user: deliveryPartnerProfile.user,
      stats: stats[0] || {
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        totalRevenue: 0
      },
      recentOrders: recentOrders
    };

    res.json({
      success: true,
      data: partnerData
    });
  } catch (err) {
    console.error('Error getting delivery partner details:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};