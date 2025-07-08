import natural from 'natural';
import { removeStopwords, eng } from 'stopword';
import compromise from 'compromise';
import similarity from 'similarity';
import NodeCache from 'node-cache';
import Conversation from '../models/conversationModel';

interface IndexedConversation {
    id: string;
    userId: string;
    title: string;
    keywords: string[];
    medicalTerms: string[];
    entities: {
        symptoms: string[];
        conditions: string[];
        medications: string[];
        doctors: string[];
        labs: string[];
    };
    summary: string;
    messageCount: number;
    lastMessageAt: Date;
    createdAt: Date;
}

interface ConversationSearchResult {
    conversation: IndexedConversation;
    score: number;
    relevantMessages: any[];
    reason: string;
}

class ConversationIndex {
    private conversations: Map<string, IndexedConversation> = new Map();
    private cache = new NodeCache({ stdTTL: 1800, checkperiod: 300 }); // 30 min cache
    private tokenizer = new natural.WordTokenizer();
    private stemmer = natural.PorterStemmer;

    constructor() {
        console.log('💬 ConversationIndex initialized');
    }

    private extractMedicalEntities(text: string) {
        const doc = compromise(text);
        
        // Extract medical-related entities
        const entities = {
            symptoms: [] as string[],
            conditions: [] as string[],
            medications: [] as string[],
            doctors: [] as string[],
            labs: [] as string[]
        };

        // Medical patterns
        const symptomPatterns = /\b(pain|ache|fever|cough|nausea|vomiting|dizziness|fatigue|headache|rash|swelling|bleeding|shortness|breath|chest|abdominal)\b/gi;
        const conditionPatterns = /\b(diabetes|hypertension|asthma|arthritis|depression|anxiety|cancer|infection|flu|cold|pneumonia|bronchitis|migraine)\b/gi;
        const medicationPatterns = /\b(mg|ml|tablet|capsule|syrup|injection|prescribed|medicine|medication|drug|dose|dosage)\b/gi;
        const doctorPatterns = /\b(dr|doctor|physician|specialist|cardiologist|neurologist|oncologist|psychiatrist|surgeon|radiologist)\b/gi;
        const labPatterns = /\b(test|blood|urine|scan|x-ray|mri|ct|ultrasound|biopsy|report|result|analysis|laboratory)\b/gi;

        // Extract using patterns
        const symptomMatches = text.match(symptomPatterns) || [];
        const conditionMatches = text.match(conditionPatterns) || [];
        const medicationMatches = text.match(medicationPatterns) || [];
        const doctorMatches = text.match(doctorPatterns) || [];
        const labMatches = text.match(labPatterns) || [];

        entities.symptoms = [...new Set(symptomMatches.map(m => m.toLowerCase()))];
        entities.conditions = [...new Set(conditionMatches.map(m => m.toLowerCase()))];
        entities.medications = [...new Set(medicationMatches.map(m => m.toLowerCase()))];
        entities.doctors = [...new Set(doctorMatches.map(m => m.toLowerCase()))];
        entities.labs = [...new Set(labMatches.map(m => m.toLowerCase()))];

        return entities;
    }

    private extractKeywords(text: string): string[] {
        const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
        const filtered = removeStopwords(tokens, eng)
            .filter(token => token.length > 2)
            .filter(token => /^[a-zA-Z]+$/.test(token));
        
        return [...new Set(filtered.map(token => this.stemmer.stem(token)))];
    }

    private generateSummary(messages: any[]): string {
        if (messages.length === 0) return 'No messages';
        
        // Get user messages (questions/concerns)
        const userMessages = messages
            .filter(msg => msg.role === 'user')
            .map(msg => msg.content)
            .join(' ');

        // Get AI responses for context
        const aiMessages = messages
            .filter(msg => msg.role === 'assistant')
            .map(msg => msg.content)
            .join(' ');

        // Use compromise to extract key sentences
        const userDoc = compromise(userMessages);
        const aiDoc = compromise(aiMessages);

        const userSentences = userDoc.sentences().out('array').slice(0, 2);
        const aiKeyPoints = aiDoc.match('#Noun').out('array').slice(0, 5);

        return `User concerns: ${userSentences.join('. ')}. Key topics: ${aiKeyPoints.join(', ')}`.substring(0, 200);
    }

    async indexConversation(conversationId: string): Promise<IndexedConversation | null> {
        try {
            const cacheKey = `conv_index_${conversationId}`;
            const cached = this.cache.get<IndexedConversation>(cacheKey);
            
            if (cached) {
                this.conversations.set(conversationId, cached);
                return cached;
            }

            console.log('📇 Indexing conversation:', conversationId);

            const conversation = await Conversation.findById(conversationId).lean();
            if (!conversation) {
                console.log('❌ Conversation not found:', conversationId);
                return null;
            }

            // Extract text from all messages
            const allText = conversation.messages
                .map((msg: any) => msg.content)
                .join(' ');

            // Extract keywords and entities
            const keywords = this.extractKeywords(allText);
            const entities = this.extractMedicalEntities(allText);
            const medicalTerms = [
                ...entities.symptoms,
                ...entities.conditions,
                ...entities.medications,
                ...entities.doctors,
                ...entities.labs
            ];

            // Generate summary
            const summary = this.generateSummary(conversation.messages);

            // Generate title if not exists
            const title = conversation.title || this.generateTitle(conversation.messages);

            const indexed: IndexedConversation = {
                id: conversationId,
                userId: conversation.user.toString(),
                title,
                keywords,
                medicalTerms,
                entities,
                summary,
                messageCount: conversation.messages.length,
                lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
                createdAt: conversation.createdAt
            };

            this.conversations.set(conversationId, indexed);
            this.cache.set(cacheKey, indexed);

            console.log(`✅ Conversation indexed: ${conversationId} (${keywords.length} keywords, ${medicalTerms.length} medical terms)`);
            return indexed;

        } catch (error) {
            console.error('❌ Error indexing conversation:', error);
            return null;
        }
    }

    private generateTitle(messages: any[]): string {
        if (messages.length === 0) return 'New Conversation';
        
        const firstUserMessage = messages.find(msg => msg.role === 'user')?.content || '';
        const doc = compromise(firstUserMessage);
        
        // Extract key phrases
        const keyPhrases = doc.match('#Noun+').out('array').slice(0, 3);
        
        if (keyPhrases.length > 0) {
            return keyPhrases.join(' ').substring(0, 50);
        }
        
        return firstUserMessage.substring(0, 50) || 'Health Consultation';
    }

    async indexUserConversations(userId: string): Promise<void> {
        try {
            console.log('📇 Indexing all conversations for user:', userId);

            const conversations = await Conversation.find({ user: userId })
                .select('_id')
                .lean();

            const indexPromises = conversations.map(conv => 
                this.indexConversation(conv._id.toString())
            );

            await Promise.allSettled(indexPromises);
            console.log(`✅ Indexed ${conversations.length} conversations for user ${userId}`);

        } catch (error) {
            console.error('❌ Error indexing user conversations:', error);
        }
    }

    searchConversations(
        userId: string, 
        query: string, 
        limit: number = 5
    ): ConversationSearchResult[] {
        const userConversations = Array.from(this.conversations.values())
            .filter(conv => conv.userId === userId);

        if (userConversations.length === 0) {
            return [];
        }

        console.log(`🔍 Searching ${userConversations.length} conversations for: "${query}"`);

        const queryKeywords = this.extractKeywords(query);
        const queryEntities = this.extractMedicalEntities(query);
        
        const results: ConversationSearchResult[] = [];

        userConversations.forEach(conv => {
            let score = 0;
            let reasons: string[] = [];

            // 1. Title similarity
            const titleSim = similarity(query.toLowerCase(), conv.title.toLowerCase());
            score += titleSim * 0.3;
            if (titleSim > 0.2) {
                reasons.push(`title match (${(titleSim * 100).toFixed(1)}%)`);
            }

            // 2. Summary similarity
            const summarySim = similarity(query.toLowerCase(), conv.summary.toLowerCase());
            score += summarySim * 0.2;
            if (summarySim > 0.1) {
                reasons.push(`summary match (${(summarySim * 100).toFixed(1)}%)`);
            }

            // 3. Keyword overlap
            const keywordOverlap = conv.keywords.filter(keyword =>
                queryKeywords.some(qKeyword => 
                    keyword.includes(qKeyword) || qKeyword.includes(keyword)
                )
            ).length;
            
            if (keywordOverlap > 0) {
                score += (keywordOverlap / Math.max(queryKeywords.length, 1)) * 0.3;
                reasons.push(`${keywordOverlap} keyword matches`);
            }

            // 4. Medical entity matching
            const allQueryMedical = [
                ...queryEntities.symptoms,
                ...queryEntities.conditions,
                ...queryEntities.medications,
                ...queryEntities.doctors,
                ...queryEntities.labs
            ];

            const medicalMatches = conv.medicalTerms.filter(medTerm =>
                allQueryMedical.some(qMed => 
                    medTerm.includes(qMed) || qMed.includes(medTerm)
                )
            ).length;

            if (medicalMatches > 0) {
                score += medicalMatches * 0.15;
                reasons.push(`${medicalMatches} medical term matches`);
            }

            // 5. Recency boost (more recent conversations get higher scores)
            const daysSinceLastMessage = (Date.now() - new Date(conv.lastMessageAt).getTime()) / (1000 * 60 * 60 * 24);
            const recencyBoost = Math.max(0, (30 - daysSinceLastMessage) / 30) * 0.05;
            score += recencyBoost;

            if (score > 0.1) { // Minimum threshold
                results.push({
                    conversation: conv,
                    score,
                    relevantMessages: [], // Could be populated with specific messages
                    reason: reasons.join(', ') || 'general relevance'
                });
            }
        });

        const sortedResults = results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        console.log(`📊 Found ${sortedResults.length} relevant conversations`);
        return sortedResults;
    }

    getIndexStats(userId?: string): any {
        const allConversations = Array.from(this.conversations.values());
        const userConversations = userId ? 
            allConversations.filter(conv => conv.userId === userId) : 
            allConversations;

        return {
            totalConversations: allConversations.length,
            userConversations: userConversations.length,
            totalKeywords: userConversations.reduce((total, conv) => total + conv.keywords.length, 0),
            totalMedicalTerms: userConversations.reduce((total, conv) => total + conv.medicalTerms.length, 0),
            cacheSize: this.cache.keys().length
        };
    }

    clearUserCache(userId: string): void {
        const userConversations = Array.from(this.conversations.values())
            .filter(conv => conv.userId === userId);
        
        userConversations.forEach(conv => {
            this.conversations.delete(conv.id);
            this.cache.del(`conv_index_${conv.id}`);
        });

        console.log(`🧹 Cleared cache for ${userConversations.length} conversations of user ${userId}`);
    }
}

export default new ConversationIndex();
export type { IndexedConversation, ConversationSearchResult }; 