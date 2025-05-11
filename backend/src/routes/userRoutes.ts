import { Router } from 'express';
import { registerUser, loginUser, resendOtp, getUser } from '../controllers/userController';
import { canRequestOtp, isAuthenticatedUser } from '../middlewares/auth';
const userRouter = Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/user', isAuthenticatedUser, getUser);
userRouter.get('/resend-otp', canRequestOtp, resendOtp);

export default userRouter;