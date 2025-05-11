import { Router } from 'express';
import { registerUser, loginUser, resendOtp, getUser, verifyOtp } from '../controllers/userController';
import { canRequestOtp, isAuthenticatedUser } from '../middlewares/auth';
const userRouter = Router();

userRouter.post('/register', registerUser);
userRouter.post('/login', loginUser);
userRouter.get('/user', isAuthenticatedUser, getUser);
userRouter.get('/resend-otp', canRequestOtp, resendOtp);
userRouter.post('/verify-otp',canRequestOtp ,verifyOtp);

export default userRouter;