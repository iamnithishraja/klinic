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
        filter.role = role || 'user';
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