import { Router } from 'express';
import { isAuthenticatedUser } from '../middlewares/auth';
import { searchDoctors, searchLaboratories } from '../controllers/searchController';

const searchRouter = Router();

// Search doctors with filters
// Query params: city, pinCode, specialization, gender, consultationType, minFee, maxFee, minRating, date, search, page, limit
searchRouter.get('/doctors', isAuthenticatedUser, searchDoctors);

// Search laboratories with filters  
// Query params: city, pinCode, category, collectionType, minPrice, maxPrice, minRating, date, search, page, limit
searchRouter.get('/laboratories', isAuthenticatedUser, searchLaboratories);

export default searchRouter;