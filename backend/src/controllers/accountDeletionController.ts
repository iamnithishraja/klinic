import type { Request, Response } from "express";
import type { CustomRequest } from "../types/userTypes";
import AccountDeletion from "../models/accountDeletionModel";
import User from "../models/userModel";

interface DeleteAccountRequest {
    reason: string;
}

const requestAccountDeletion = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const { reason }: DeleteAccountRequest = req.body;
        const userId = req.user._id;

        if (!reason || reason.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: 'Reason is required for account deletion'
            });
            return;
        }

        // Check if user already has a pending deletion request
        const existingRequest = await AccountDeletion.findOne({
            userId: userId,
            status: 'pending'
        });

        if (existingRequest) {
            res.status(400).json({
                success: false,
                message: 'You already have a pending account deletion request'
            });
            return;
        }

        // Create deletion request
        const deletionRequest = new AccountDeletion({
            userId: userId,
            reason: reason.trim(),
            status: 'pending'
        });

        await deletionRequest.save();

        res.status(201).json({
            success: true,
            message: 'Account deletion request submitted successfully',
            data: {
                requestId: deletionRequest._id,
                status: deletionRequest.status,
                createdAt: deletionRequest.createdAt
            }
        });

    } catch (error) {
        console.error('Error requesting account deletion:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit account deletion request',
            error: (error as any)?.message || 'Unknown error'
        });
    }
};

const deleteAccount = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;

        // Find the user's pending deletion request
        const deletionRequest = await AccountDeletion.findOne({
            userId: userId,
            status: 'pending'
        });

        if (!deletionRequest) {
            res.status(404).json({
                success: false,
                message: 'No pending account deletion request found'
            });
            return;
        }

        // Update the deletion request status to deleted
        deletionRequest.status = 'deleted';
        deletionRequest.deletedAt = new Date();
        await deletionRequest.save();

        // Delete the user account
        await User.findByIdAndDelete(userId);

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting account:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete account',
            error: (error as any)?.message || 'Unknown error'
        });
    }
};

const cancelDeletionRequest = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;

        // Find and delete the pending deletion request
        const deletionRequest = await AccountDeletion.findOneAndDelete({
            userId: userId,
            status: 'pending'
        });

        if (!deletionRequest) {
            res.status(404).json({
                success: false,
                message: 'No pending account deletion request found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'Account deletion request cancelled successfully'
        });

    } catch (error) {
        console.error('Error cancelling deletion request:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel deletion request',
            error: (error as any)?.message || 'Unknown error'
        });
    }
};

const getDeletionStatus = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;

        const deletionRequest = await AccountDeletion.findOne({
            userId: userId,
            status: 'pending'
        });

        res.status(200).json({
            success: true,
            data: {
                hasPendingRequest: !!deletionRequest,
                request: deletionRequest ? {
                    id: deletionRequest._id,
                    reason: deletionRequest.reason,
                    createdAt: deletionRequest.createdAt
                } : null
            }
        });

    } catch (error) {
        console.error('Error getting deletion status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get deletion status',
            error: (error as any)?.message || 'Unknown error'
        });
    }
};

export {
    requestAccountDeletion,
    deleteAccount,
    cancelDeletionRequest,
    getDeletionStatus
}; 