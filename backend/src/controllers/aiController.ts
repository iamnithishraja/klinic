import type { Response } from "express";
import type { CustomRequest } from "../types/userTypes";
import ToctorAIService from "../services/aiService";

export const sendChatMessage = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const { message, conversationId } = req.body;

        if (!message || typeof message !== 'string') {
            res.status(400).json({ message: 'Message is required' });
            return;
        }

        const result = await ToctorAIService.getChatResponse(userId, message, conversationId);

        res.status(200).json({
            success: true,
            response: result.response,
            conversationId: result.conversationId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get AI response', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};

export const streamChatMessage = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const { message, conversationId } = req.body;

        if (!message || typeof message !== 'string') {
            res.status(400).json({ message: 'Message is required' });
            return;
        }

        // Set up Server-Sent Events
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
        });

        try {
            // Send initial status
            res.write(`data: ${JSON.stringify({ type: 'status', content: 'Analyzing your medical context...' })}\n\n`);
            
            const result = await ToctorAIService.getChatResponse(userId, message, conversationId);
            
            // Send the complete response
            res.write(`data: ${JSON.stringify({ 
                type: 'message', 
                content: result.response,
                conversationId: result.conversationId,
                timestamp: new Date().toISOString()
            })}\n\n`);
            
            // Send end signal
            res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
            
        } catch (error) {
            // Send error
            res.write(`data: ${JSON.stringify({ 
                type: 'error', 
                content: 'Failed to get AI response',
                error: error instanceof Error ? error.message : 'Unknown error'
            })}\n\n`);
        }
        
        res.end();
    } catch (error) {
        console.error('Stream chat error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to stream AI response', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};

export const getConversationHistory = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const { conversationId } = req.params;

        if (!conversationId) {
            res.status(400).json({ message: 'Conversation ID is required' });
            return;
        }

        const conversation = await ToctorAIService.getConversationHistory(userId, conversationId);

        res.status(200).json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error('Get conversation error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get conversation history', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};

export const getUserConversations = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const result = await ToctorAIService.getUserConversations(userId, page, limit);

        res.status(200).json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get conversations', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
};

export const getHealthSummary = async (req: CustomRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user._id;
        
        // Get user's medical context for health summary
        const context = await ToctorAIService.gatherUserMedicalContext(userId);
        
        res.status(200).json({
            success: true,
            healthSummary: {
                userProfile: {
                    age: context.userProfile?.age,
                    gender: context.userProfile?.gender,
                    medicalHistory: context.medicalHistory
                },
                recentAppointments: context.recentAppointments.slice(0, 3),
                recentPrescriptions: context.recentPrescriptions.slice(0, 3),
                recentLabResults: context.recentLabResults.slice(0, 3),
                lastUpdated: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Get health summary error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to get health summary', 
            error: error instanceof Error ? error.message : 'Unknown error' 
        });
    }
}; 