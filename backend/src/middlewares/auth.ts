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
        if (!user.isPhoneEmailVerified) {
            res.status(408).json({ message: 'Please verify your phone number and email' });
            return;
        }
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

    if (!req.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const user = req.user;
    if (!roles.includes(user.role)) {
        res.status(403).json({ message: 'Forbidden' });
        return;
    }
    next();
}

export { isAuthenticatedUser };