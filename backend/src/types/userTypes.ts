import type { Request } from "express";

export interface CustomRequest extends Request {
  user?: any | null;
}


export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  DOCTOR = 'doctor',
  LABORATORY = 'laboratory',
  DELIVERY_BOY = 'deliverypartner',
}