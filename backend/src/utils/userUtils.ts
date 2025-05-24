import User from "../models/userModel";
import { UserProfile } from "../models/profileModel";

export const getUserCity = async (userId: string): Promise<string | null> => {
    try {
        const user = await UserProfile.findOne({ user: userId });
        return user?.city || null;
    } catch (error) {
        console.error(error);
        return null;
    }
};