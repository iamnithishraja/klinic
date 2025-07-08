import { Router } from 'express';
import { 
    sendChatMessage, 
    streamChatMessage, 
    getConversationHistory, 
    getUserConversations,
    getHealthSummary
} from '../controllers/aiController';
import { isAuthenticatedUser } from '../middlewares/auth';

const aiRouter = Router();

// All routes require authentication
aiRouter.use(isAuthenticatedUser);

// Chat endpoints
aiRouter.post('/chat', sendChatMessage);
aiRouter.post('/chat/stream', streamChatMessage);

// Conversation management
aiRouter.get('/conversations', getUserConversations);
aiRouter.get('/conversations/:conversationId', getConversationHistory);

// Health insights
aiRouter.get('/health-summary', getHealthSummary);

export default aiRouter; 