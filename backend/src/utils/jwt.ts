import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateToken = (id: string) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || '', { expiresIn: '1d' });
}

export const verifyToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_SECRET || '');
}

