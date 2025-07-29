import type { CustomRequest, UserRole } from "../types/userTypes";
import type { Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import User from "../models/userModel";

const isAuthenticatedUser = async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const token = authHeader?.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const decoded_data = jwt.verify(token, process.env.JWT_SECRET || '') as JwtPayload;

        const user = await User.findById(decoded_data.id);
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        // For admin routes, we might want to skip phone/email verification
        // if (!user.isPhoneEmailVerified) {
        //     res.status(408).json({ message: 'Please verify your phone number and email' });
        //     return;
        // }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
}

export async function canRequestOtp(req: CustomRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        const decoded_data = jwt.verify(token, process.env.JWT_SECRET || '') as JwtPayload;

        const user = await User.findById(decoded_data.id);
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        if (user.isPhoneEmailVerified) {
            res.status(400).json({ message: 'User is already verified' });
            return;
        }
        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Unauthorized' });
    }
}
export async function checkRole(req: CustomRequest, res: Response, next: NextFunction, roles: UserRole[]): Promise<void>    {
    console.log('CheckRole - User:', req.user);
    console.log('CheckRole - Required roles:', roles);
    console.log('CheckRole - User role:', req.user?.role);

    if (!req.user) {
        console.log('CheckRole - No user found');
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const user = req.user;
    if (!roles.includes(user.role)) {
        console.log('CheckRole - Role not allowed. User role:', user.role, 'Required roles:', roles);
        res.status(403).json({ message: 'Forbidden' });
        return;
    }
    console.log('CheckRole - Role check passed');
    next();
}

const isAdmin = (req: CustomRequest, res: Response, next: NextFunction): void => {
    if (!req.user || req.user.role !== 'admin') {
        res.status(403).json({ message: 'Forbidden: Admins only' });
        return;
    }
    next();
};

export { isAuthenticatedUser, isAdmin };
