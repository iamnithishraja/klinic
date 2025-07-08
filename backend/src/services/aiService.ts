import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import type { CustomRequest } from '../types/userTypes';
import User from '../models/userModel';
import { UserProfile, DoctorProfile, LaboratoryProfile } from '../models/profileModel';
import DoctorAppointment from '../models/doctorAppointments';
import LabAppointment from '../models/labAppointments';
import LaboratoryService from '../models/laboratoryServiceModel';
import Clinic from '../models/clinicModel';
import Conversation from '../models/conversationModel';
import DocumentProcessor from './documentProcessor';
import conversationIndex from './conversationIndex';
import type { DocumentChunk, ProcessedDocument } from './documentProcessor';

interface UserMedicalContext {
    userInfo: any;
    userProfile: any;
    recentAppointments: any[];
    recentPrescriptions: any[];
    recentLabResults: any[];
    medicalHistory: string;
    currentSymptoms?: string;
    availableDoctors: any[];
    availableLabs: any[];
    nearbyProviders: any[];
    
    // Enhanced document context
    allAppointments: any[]; // Extended beyond 6 months
    processedDocuments: ProcessedDocument[];
    relevantDocumentChunks: DocumentChunk[];
    documentSummary: string;
    
    // Context analysis results
    analysisResults?: {
        medicalConditions: string[];
        symptoms: string[];
        medications: string[];
        labValues: any[];
        riskFactors: string[];
        intent?: string;
        trends?: {
            patterns: string[];
            riskFactors: string[];
            improvements: string[];
            recommendations: string[];
        };
        extracted?: any;
    };
}

class ToctorAIService {
    private genAI: GoogleGenerativeAI | null = null;
    private model: GenerativeModel | null = null;
    private isConfigured: boolean = false;

    constructor() {
        try {
            const apiKey = process.env.GEMINI_API_KEY;
            
            if (!apiKey || apiKey.trim() === '' || apiKey === 'your-gemini-api-key') {
                console.error('⚠️  GEMINI_API_KEY is not properly configured in environment variables');
                console.error('Please set a valid Google Gemini API key in your .env file');
                this.isConfigured = false;
                return;
            }

            console.log('🤖 Initializing Toctor AI with Gemini API...');
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ 
                model: "gemini-2.0-flash",
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                },
            });
            this.isConfigured = true;
            console.log('✅ Toctor AI initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Toctor AI:', error);
            this.isConfigured = false;
        }
    }

    private getSystemPrompt(): string {
        return `You are Toctor AI, an advanced medical AI assistant integrated into the Klinic healthcare platform. You provide personalized medical guidance, symptom analysis, and healthcare recommendations based on comprehensive patient data.

CORE CAPABILITIES:
• Medical symptom analysis and preliminary diagnosis suggestions
• Personalized treatment recommendations based on medical history
• Lab test recommendations and interpretation of results
• Medication guidance and interaction warnings
• Preventive care suggestions
• Health trend analysis from patient data
• Doctor and laboratory recommendations from the platform

RESPONSE FORMAT:
Structure your responses using XML-like tags for better rendering:

<medical_assessment>
[Your medical analysis here]
</medical_assessment>

<recommendations>
<recommendation type="immediate">
[Urgent recommendations]
</recommendation>
<recommendation type="followup">
[Follow-up care suggestions]
</recommendation>
<recommendation type="lifestyle">
[Lifestyle modifications]
</recommendation>
</recommendations>

<doctor_recommendations>
<doctor_rec 
    name="Dr. [Doctor Name]" 
    specialization="[Specialization]" 
    city="[City]" 
    fee="[Consultation Fee]" 
    type="[online/in-person/both]"
    priority="high/medium/low"
    reason="Why this specific doctor is recommended">
[Additional details about the doctor and why they're suitable]
</doctor_rec>
</doctor_recommendations>

<lab_recommendations>
<lab_rec 
    name="[Laboratory Name]" 
    city="[City]" 
    verified="yes/no"
    priority="high/medium/low"
    reason="Why this specific lab is recommended">
[Additional details about the lab and services]
</lab_rec>
</lab_recommendations>

<lab_tests>
<test name="Test Name" priority="high/medium/low" reason="Why this test is recommended">
[Description of what the test checks and why it's important]
</test>
</lab_tests>

<medications>
<medication name="Medicine Name" dosage="Recommended dosage" duration="Treatment duration" priority="high/medium/low">
[Purpose, instructions, and when to start taking]
</medication>
</medications>

<warnings>
[Any important warnings or red flags]
</warnings>

<next_steps>
[Clear action items for the patient]
</next_steps>

IMPORTANT GUIDELINES:
1. Always base recommendations on the provided medical context, document excerpts, and analysis results
2. Never provide definitive diagnoses - suggest consulting doctors
3. Prioritize patient safety and encourage professional medical consultation for serious symptoms
4. Reference specific lab results, prescriptions, appointment history, and document content when available
5. Be empathetic and reassuring while maintaining medical accuracy
6. **MANDATORY: Use <doctor_recommendations> tags to recommend specific doctors from the "AVAILABLE DOCTORS" section**
7. **MANDATORY: Use <lab_recommendations> tags to recommend specific laboratories from the "AVAILABLE LABORATORIES" section**
8. Consider patient's location, medical history, symptoms, and document context when selecting providers
9. Prioritize verified doctors and labs when making recommendations
10. Match doctor specializations with patient symptoms/conditions from the analysis
11. Use the comprehensive medical history and document excerpts to provide personalized recommendations
12. Reference relevant document excerpts when explaining recommendations
13. Flag emergency situations clearly and recommend immediate care
14. Use the analysis results to inform your recommendations and explanations

CONTEXT AWARENESS:
- Use patient's complete medical history (not just recent) to personalize recommendations
- Reference ALL previous appointments and outcomes across the patient's entire history
- Consider ongoing treatments and medications from comprehensive records
- Analyze trends in lab results over time using document analysis
- Factor in patient demographics (age, gender, location)
- Leverage extracted text from medical PDFs and lab reports for deeper insights
- Use document search results to find relevant historical information
- Apply medical analysis results to understand patterns and risk factors
- Reference specific document excerpts to support recommendations
- Consider the full spectrum of the patient's health journey

Remember: You are not replacing medical professionals but providing intelligent guidance to help patients make informed healthcare decisions.`;
    }

    private async getAvailableDoctors(userCity?: string): Promise<any[]> {
        try {
            const query: any = { status: 'active' };
            if (userCity) {
                query.city = { $regex: userCity, $options: 'i' };
            }

            const doctors = await DoctorProfile.find(query)
                .populate('user', 'name email')
                .limit(10)
                .lean();

            return doctors.map(doctor => ({
                id: doctor._id,
                name: (doctor.user as any)?.name,
                specializations: doctor.specializations,
                experience: doctor.experience,
                city: doctor.city,
                consultationFee: doctor.consultationFee,
                rating: doctor.rating,
                isVerified: doctor.isVerified,
                consultationType: doctor.consultationType,
                type: 'doctor'
            }));
        } catch (error) {
            console.error('Error fetching available doctors:', error);
            return [];
        }
    }

    private async getAvailableLabs(userCity?: string): Promise<any[]> {
        try {
            const query: any = { status: 'active' };
            if (userCity) {
                query.city = { $regex: userCity, $options: 'i' };
            }

            const labs = await LaboratoryProfile.find(query)
                .populate('user', 'name email')
                .limit(10)
                .lean();

            return labs.map(lab => ({
                id: lab._id,
                name: lab.laboratoryName || (lab.user as any)?.name,
                city: lab.city,
                laboratoryPhone: lab.laboratoryPhone,
                laboratoryEmail: lab.laboratoryEmail,
                isVerified: lab.isVerified,
                type: 'laboratory'
            }));
        } catch (error) {
            console.error('Error fetching available labs:', error);
            return [];
        }
    }

    private generateDocumentSummary(documents: ProcessedDocument[]): string {
        if (documents.length === 0) {
            return 'No medical documents available';
        }

        const totalChunks = documents.reduce((sum, doc) => sum + doc.chunks.length, 0);
        const totalWords = documents.reduce((sum, doc) => sum + (doc.metadata.wordCount || 0), 0);
        
        const medicalHistoryDocs = documents.filter(doc => doc.type === 'medical_history');
        const labReportDocs = documents.filter(doc => doc.type === 'lab_report');

        return `
DOCUMENT SUMMARY:
- Total Documents: ${documents.length}
- Medical History Documents: ${medicalHistoryDocs.length}
- Lab Report Documents: ${labReportDocs.length}
- Total Text Chunks: ${totalChunks}
- Total Words Extracted: ${totalWords}

This comprehensive document collection contains detailed medical information extracted from patient PDFs, including historical medical records, lab results, prescriptions, and diagnostic reports that provide deep insights into the patient's health journey.
        `.trim();
    }

    async gatherUserMedicalContext(userId: string): Promise<UserMedicalContext> {
        try {
            // Index user conversations for better context retrieval
            await conversationIndex.indexUserConversations(userId);

            // Get user basic info
            const user = await User.findById(userId).select('name email phone role');
            
            // Get user profile with medical history
            const userProfile = await UserProfile.findOne({ user: userId });

            // Get ALL doctor appointments (not just 6 months) for comprehensive context
            const allDoctorAppointments = await DoctorAppointment.find({
                patient: userId
            })
            .populate('doctor', 'name email')
            .populate('clinic')
            .sort({ createdAt: -1 });

            // Get ALL lab appointments for comprehensive context
            const allLabAppointments = await LabAppointment.find({
                patient: userId
            })
            .populate('lab', 'name email')
            .populate('laboratoryService')
            .sort({ createdAt: -1 });

            // Get recent appointments (last 6 months) for immediate context
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            const recentDoctorAppointments = allDoctorAppointments.filter(apt => 
                new Date(apt.createdAt) >= sixMonthsAgo
            ).slice(0, 10);

            const recentLabAppointments = allLabAppointments.filter(apt => 
                new Date(apt.createdAt) >= sixMonthsAgo
            ).slice(0, 10);

            // Extract prescriptions from doctor appointments
            const recentPrescriptions = recentDoctorAppointments
                .filter(apt => apt.prescription)
                .map(apt => ({
                    doctorName: (apt.doctor as any)?.name,
                    prescription: apt.prescription,
                    date: apt.createdAt,
                    consultationType: apt.consultationType
                }));

            // Extract lab results
            const recentLabResults = recentLabAppointments
                .filter(apt => apt.reportResult)
                .map(apt => ({
                    labName: (apt.lab as any)?.name,
                    serviceName: (apt.laboratoryService as any)?.name,
                    result: apt.reportResult,
                    date: apt.createdAt,
                    collectionType: apt.collectionType
                }));

            // Combine all appointments for context
            const allRecentAppointments = [
                ...recentDoctorAppointments.map(apt => ({
                    type: 'doctor',
                    providerName: (apt.doctor as any)?.name,
                    date: apt.createdAt,
                    status: apt.status,
                    consultationType: apt.consultationType,
                    prescription: apt.prescription,
                    notes: apt.notes
                })),
                ...recentLabAppointments.map(apt => ({
                    type: 'laboratory',
                    providerName: (apt.lab as any)?.name,
                    serviceName: (apt.laboratoryService as any)?.name,
                    date: apt.createdAt,
                    status: apt.status,
                    collectionType: apt.collectionType,
                    reportResult: apt.reportResult,
                    notes: apt.notes
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Get available doctors and labs for recommendations
            const availableDoctors = await this.getAvailableDoctors(userProfile?.city);
            const availableLabs = await this.getAvailableLabs(userProfile?.city);
            const nearbyProviders = [...availableDoctors, ...availableLabs];

            // Process all medical documents
            const processedDocuments: ProcessedDocument[] = [];
            
            // Process medical history PDFs
            if (userProfile?.medicalHistoryPdfs && userProfile.medicalHistoryPdfs.length > 0) {
                try {
                    const medicalHistoryDocs = await DocumentProcessor.processMedicalHistoryPdfs(
                        userId, 
                        userProfile.medicalHistoryPdfs
                    );
                    processedDocuments.push(...medicalHistoryDocs);
                } catch (error) {
                    console.error('Error processing medical history PDFs:', error);
                }
            }

            // Process lab report PDFs from all appointments
            for (const labApt of allLabAppointments) {
                if (labApt.testReportPdfs && labApt.testReportPdfs.length > 0) {
                    try {
                        const labReportDocs = await DocumentProcessor.processLabReportPdfs(
                            userId,
                            labApt.testReportPdfs,
                            labApt._id.toString()
                        );
                        processedDocuments.push(...labReportDocs);
                    } catch (error) {
                        console.error('Error processing lab report PDFs:', error);
                    }
                }
            }

            // Create combined appointment list
            const allAppointments = [
                ...allDoctorAppointments.map(apt => ({
                    type: 'doctor',
                    providerName: (apt.doctor as any)?.name,
                    date: apt.createdAt,
                    status: apt.status,
                    consultationType: apt.consultationType,
                    prescription: apt.prescription,
                    notes: apt.notes
                })),
                ...allLabAppointments.map(apt => ({
                    type: 'laboratory',
                    providerName: (apt.lab as any)?.name,
                    serviceName: (apt.laboratoryService as any)?.name,
                    date: apt.createdAt,
                    status: apt.status,
                    collectionType: apt.collectionType,
                    reportResult: apt.reportResult,
                    notes: apt.notes,
                    testReportPdfs: apt.testReportPdfs
                }))
            ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Generate document summary
            const documentSummary = this.generateDocumentSummary(processedDocuments);

            return {
                userInfo: user,
                userProfile,
                recentAppointments: allRecentAppointments,
                recentPrescriptions,
                recentLabResults,
                medicalHistory: userProfile?.medicalHistory || 'No medical history available',
                availableDoctors,
                availableLabs,
                nearbyProviders,
                allAppointments,
                processedDocuments,
                relevantDocumentChunks: [], // Will be populated during context search
                documentSummary
            };
        } catch (error) {
            console.error('Error gathering medical context:', error);
            throw new Error('Failed to gather medical context');
        }
    }

    private formatContextForAI(context: UserMedicalContext): string {
        const { userInfo, userProfile, recentAppointments, recentPrescriptions, recentLabResults, medicalHistory, availableDoctors, availableLabs, allAppointments, documentSummary, relevantDocumentChunks, analysisResults } = context;
        
        return `
PATIENT PROFILE:
Name: ${userInfo?.name || 'N/A'}
Age: ${userProfile?.age || 'Not specified'}
Gender: ${userProfile?.gender || 'Not specified'}
Location: ${userProfile?.city || 'Not specified'}

MEDICAL HISTORY:
${medicalHistory}

RECENT APPOINTMENTS (Last 6 months):
${recentAppointments.length > 0 ? recentAppointments.map(apt => 
    `- ${apt.type.toUpperCase()}: ${apt.providerName} on ${new Date(apt.date).toLocaleDateString()}
      Status: ${apt.status}
      ${apt.type === 'doctor' ? `Consultation: ${apt.consultationType}` : `Service: ${apt.serviceName}`}
      ${apt.prescription ? `Prescription: ${apt.prescription}` : ''}
      ${apt.reportResult ? `Lab Result: ${apt.reportResult}` : ''}
      ${apt.notes ? `Notes: ${apt.notes}` : ''}
    `
).join('\n') : 'No recent appointments'}

RECENT PRESCRIPTIONS:
${recentPrescriptions.length > 0 ? recentPrescriptions.map(rx => 
    `- Dr. ${rx.doctorName} (${new Date(rx.date).toLocaleDateString()}): ${rx.prescription}`
).join('\n') : 'No recent prescriptions'}

RECENT LAB RESULTS:
${recentLabResults.length > 0 ? recentLabResults.map(result => 
    `- ${result.serviceName} at ${result.labName} (${new Date(result.date).toLocaleDateString()}): ${result.result}`
).join('\n') : 'No recent lab results'}

AVAILABLE DOCTORS IN YOUR AREA:
${availableDoctors.length > 0 ? availableDoctors.map(doctor => 
    `- Dr. ${doctor.name} (${doctor.city})
      Specializations: ${doctor.specializations?.join(', ') || 'General'}
      Experience: ${doctor.experience || 'N/A'} years
      Consultation Fee: ₹${doctor.consultationFee || 'N/A'}
      Consultation Type: ${doctor.consultationType || 'N/A'}
      Verified: ${doctor.isVerified ? 'Yes' : 'No'}
      Rating: ${doctor.rating || 'Not rated'}/5
    `
).join('\n') : 'No doctors found in your area'}

AVAILABLE LABORATORIES IN YOUR AREA:
${availableLabs.length > 0 ? availableLabs.map(lab => 
    `- ${lab.name} (${lab.city})
      Phone: ${lab.laboratoryPhone || 'N/A'}
      Email: ${lab.laboratoryEmail || 'N/A'}
      Verified: ${lab.isVerified ? 'Yes' : 'No'}
    `
).join('\n') : 'No laboratories found in your area'}

${documentSummary}

COMPREHENSIVE MEDICAL HISTORY (ALL TIME):
${allAppointments.length > 0 ? allAppointments.slice(0, 20).map((apt, index) => 
    `${index + 1}. ${apt.type.toUpperCase()}: ${apt.providerName} (${new Date(apt.date).toLocaleDateString()})
      Status: ${apt.status}
      ${apt.type === 'doctor' ? `Consultation: ${apt.consultationType}` : `Service: ${apt.serviceName}`}
      ${apt.prescription ? `Prescription: ${apt.prescription}` : ''}
      ${apt.reportResult ? `Lab Result: ${apt.reportResult}` : ''}
      ${apt.notes ? `Notes: ${apt.notes}` : ''}
    `
).join('\n') : 'No historical appointments found'}

RELEVANT DOCUMENT EXCERPTS:
${relevantDocumentChunks.length > 0 ? relevantDocumentChunks.map((chunk, index) => 
    `${index + 1}. ${chunk.type.toUpperCase()} Document (${new Date(chunk.metadata.extractedAt).toLocaleDateString()}):
    "${chunk.content.substring(0, 300)}${chunk.content.length > 300 ? '...' : ''}"
    Keywords: ${chunk.keywords.slice(0, 5).join(', ')}
    `
).join('\n') : 'No relevant document excerpts found for this query'}

MEDICAL ANALYSIS RESULTS:
${analysisResults ? `
Intent: ${analysisResults.intent || 'General consultation'}
Identified Symptoms: ${analysisResults.symptoms?.join(', ') || 'None identified'}
Medical Conditions: ${analysisResults.medicalConditions?.join(', ') || 'None identified'}
Current Medications: ${analysisResults.medications?.join(', ') || 'None identified'}
Risk Factors: ${analysisResults.riskFactors?.join(', ') || 'None identified'}
Health Patterns: ${analysisResults.trends?.patterns?.join(', ') || 'No patterns identified'}
Recommended Actions: ${analysisResults.trends?.recommendations?.join(', ') || 'No specific recommendations'}
` : 'Analysis not available'}
        `.trim();
    }

    private async performMedicalAnalysis(userMessage: string, context: UserMedicalContext): Promise<any> {
        try {
            if (!this.model) {
                throw new Error('AI model not initialized');
            }

                    // Step 1: Extract medical entities and symptoms from user message
        const entityExtractionPrompt = `
Analyze this patient message and extract medical information. Return ONLY a JSON object with the following structure:
{
    "symptoms": ["list of symptoms mentioned"],
    "conditions": ["list of medical conditions mentioned"],
    "medications": ["list of medications mentioned"],
    "concerns": ["list of health concerns"],
    "intent": "what the patient is looking for (consultation, lab test, medication, etc.)"
}

Patient message: "${userMessage}"

Recent medical context:
- Medical History: ${context.medicalHistory}
- Recent appointments: ${context.recentAppointments.length}
- Recent prescriptions: ${context.recentPrescriptions.length}

Return only valid JSON:`;

        // 🔍 LOG: Medical analysis prompts
        console.log('\n' + '='.repeat(80));
        console.log('🧬 MEDICAL ANALYSIS - ENTITY EXTRACTION');
        console.log('='.repeat(80));
        console.log('📝 ENTITY EXTRACTION PROMPT:');
        console.log(entityExtractionPrompt);
        console.log('='.repeat(80) + '\n');

            const entityResult = await this.model.generateContent(entityExtractionPrompt);
            let extractedData = {
                symptoms: [],
                conditions: [],
                medications: [],
                concerns: [],
                intent: 'general_consultation'
            };

            try {
                const entityText = entityResult.response.text();
                const jsonMatch = entityText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    extractedData = JSON.parse(jsonMatch[0]);
                }
            } catch (error) {
                console.log('Entity extraction parsing failed, using defaults');
            }

            // Step 2: Analyze historical patterns and trends
            const trendAnalysisPrompt = `
Based on this patient's complete medical history, identify patterns and trends. Return ONLY a JSON object:
{
    "patterns": ["list of recurring patterns"],
    "riskFactors": ["list of identified risk factors"],
    "improvements": ["list of health improvements noted"],
    "recommendations": ["list of preventive recommendations"]
}

Medical History Summary:
${context.allAppointments.slice(0, 10).map(apt => 
    `${apt.type}: ${apt.providerName} - ${apt.prescription || apt.reportResult || apt.notes || 'No details'}`
).join('\n')}

Document Summary: ${context.documentSummary}

Return only valid JSON:`;

            const trendResult = await this.model.generateContent(trendAnalysisPrompt);
            let trendData = {
                patterns: [],
                riskFactors: [],
                improvements: [],
                recommendations: []
            };

            try {
                const trendText = trendResult.response.text();
                const jsonMatch = trendText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    trendData = JSON.parse(jsonMatch[0]);
                }
            } catch (error) {
                console.log('Trend analysis parsing failed, using defaults');
            }

            return {
                medicalConditions: [...extractedData.conditions, ...trendData.patterns],
                symptoms: extractedData.symptoms,
                medications: extractedData.medications,
                labValues: [], // Could be extracted from documents
                riskFactors: trendData.riskFactors,
                intent: extractedData.intent,
                trends: trendData,
                extracted: extractedData
            };

        } catch (error) {
            console.error('Medical analysis failed:', error);
            return {
                medicalConditions: [],
                symptoms: [],
                medications: [],
                labValues: [],
                riskFactors: []
            };
        }
    }

    async getChatResponse(
        userId: string, 
        userMessage: string, 
        conversationId?: string
    ): Promise<{ response: string; conversationId: string; context: UserMedicalContext }> {
        try {
            // Check if AI service is properly configured
            if (!this.model) {
                throw new Error('Toctor AI is not properly configured. Please check your GEMINI_API_KEY environment variable.');
            }

            // Gather fresh medical context
            const context = await this.gatherUserMedicalContext(userId);
            
            // Search for relevant document chunks based on user message
            const relevantChunks = DocumentProcessor.searchDocuments(userMessage, 8, { preferredType: 'medical_history' });
            context.relevantDocumentChunks = relevantChunks;

            // Search relevant conversations for additional context
            const relevantConversations = conversationIndex.searchConversations(userId, userMessage, 3);
            if (relevantConversations.length > 0) {
                console.log(`📚 Found ${relevantConversations.length} relevant conversation(s) for context`);
            }
            
            // Perform medical analysis using chained LLM calls
            const analysisResults = await this.performMedicalAnalysis(userMessage, context);
            context.analysisResults = analysisResults;
            
            const contextString = this.formatContextForAI(context);

            // 🔍 LOG: Print complete medical context being sent to LLM
            console.log('\n' + '='.repeat(80));
            console.log('🧠 TOCTOR AI - FULL MEDICAL CONTEXT BEING SENT TO LLM');
            console.log('='.repeat(80));
            console.log('📋 User ID:', userId);
            console.log('💬 User Message:', userMessage);
            console.log('📄 Conversation ID:', conversationId || 'NEW CONVERSATION');
            console.log('\n📊 ANALYSIS RESULTS:');
            console.log(JSON.stringify(analysisResults, null, 2));
            console.log('\n📝 COMPLETE FORMATTED CONTEXT:');
            console.log(contextString);
            console.log('='.repeat(80) + '\n');

            // Get or create conversation
            let conversation: any;
            if (conversationId) {
                try {
                    conversation = await Conversation.findById(conversationId);
                    if (!conversation || conversation.user.toString() !== userId) {
                        console.log('Invalid or mismatched conversation, creating new one');
                        conversation = null;
                    }
                } catch (error) {
                    console.log('Error finding conversation, creating new one:', error);
                    conversation = null;
                }
            }
            
            if (!conversation) {
                conversation = new Conversation({
                    user: userId,
                    contextSnapshot: {
                        medicalHistory: context.medicalHistory,
                        recentAppointments: context.recentAppointments.slice(0, 5),
                        recentPrescriptions: context.recentPrescriptions.slice(0, 5),
                        recentLabResults: context.recentLabResults.slice(0, 5),
                        userProfile: context.userProfile,
                        lastUpdated: new Date()
                    }
                });
            }

            if (!conversation) {
                throw new Error('Failed to create or find conversation');
            }

            // Build chat history for context
            const chatHistory = conversation!.messages?.map((msg: any) => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            })) || [];

            // Prepare system message with context
            const systemMessage = `SYSTEM INSTRUCTIONS:\n${this.getSystemPrompt()}\n\nMEDICAL CONTEXT:\n${contextString}\n\nSystem: You are now ready to assist this patient. Please acknowledge that you have reviewed their medical context and understand your role as Toctor AI.`;
            const initialResponse = `I've reviewed your comprehensive medical profile and understand my role as Toctor AI, your advanced medical AI assistant. I have access to your medical history, recent appointments, prescriptions, and lab results to provide personalized healthcare guidance using the structured XML format you'll see in my responses. What health concern can I help you with today?`;

            // 🔍 LOG: Print chat session details
            console.log('\n' + '='.repeat(80));
            console.log('💬 CHAT SESSION SETUP');
            console.log('='.repeat(80));
            console.log('🎯 SYSTEM MESSAGE TO LLM:');
            console.log(systemMessage);
            console.log('\n🤖 INITIAL AI RESPONSE:');
            console.log(initialResponse);
            console.log('\n📚 CHAT HISTORY (' + chatHistory.length + ' messages):');
            chatHistory.forEach((msg: any, index: number) => {
                console.log(`${index + 1}. ${msg.role.toUpperCase()}: ${msg.parts[0].text.substring(0, 200)}${msg.parts[0].text.length > 200 ? '...' : ''}`);
            });
            console.log('='.repeat(80) + '\n');

            // Create chat session with history
            const chat = this.model.startChat({
                history: [
                    {
                        role: 'user',
                        parts: [{ text: systemMessage }]
                    },
                    {
                        role: 'model',
                        parts: [{ text: initialResponse }]
                    },
                    ...chatHistory
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            });

            // 🔍 LOG: Current user message being sent
            console.log('\n' + '='.repeat(80));
            console.log('📤 SENDING MESSAGE TO LLM');
            console.log('='.repeat(80));
            console.log('👤 USER MESSAGE:', userMessage);
            console.log('🔧 Generation Config:', {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            });
            console.log('='.repeat(80) + '\n');

            // Get AI response
            const result = await chat.sendMessage(userMessage);
            const response = result.response;
            const responseText = response.text();

            // 🔍 LOG: LLM Response received
            console.log('\n' + '='.repeat(80));
            console.log('📥 LLM RESPONSE RECEIVED');
            console.log('='.repeat(80));
            console.log('🤖 AI RESPONSE:');
            console.log(responseText);
            console.log('\n📊 RESPONSE METADATA:');
            console.log('- Length:', responseText.length, 'characters');
            console.log('- Contains XML tags:', /<[^>]+>/.test(responseText));
            console.log('- Contains priority tags:', /priority="(high|medium|low)"/.test(responseText));
            console.log('='.repeat(80) + '\n');

            // Save messages to conversation
            conversation!.messages.push({
                role: 'user',
                content: userMessage,
                timestamp: new Date()
            });

            conversation!.messages.push({
                role: 'assistant',
                content: responseText,
                timestamp: new Date()
            });

            conversation!.lastMessageAt = new Date();
            conversation!.updatedAt = new Date();

            await conversation!.save();

            return {
                response: responseText,
                conversationId: conversation!._id.toString(),
                context
            };

        } catch (error) {
            console.error('Error getting AI response:', error);
            
            // Provide more specific error messages
            if (error instanceof Error) {
                if (error.message.includes('GEMINI_API_KEY')) {
                    throw new Error('AI service is not properly configured. Please contact support.');
                } else if (error.message.includes('quota') || error.message.includes('limit')) {
                    throw new Error('AI service is temporarily unavailable due to usage limits. Please try again later.');
                } else if (error.message.includes('authentication') || error.message.includes('unauthorized')) {
                    throw new Error('AI service authentication failed. Please contact support.');
                } else {
                    throw new Error(`AI service error: ${error.message}`);
                }
            }
            
            throw new Error('Failed to get AI response. Please try again or contact support if the issue persists.');
        }
    }

    async getConversationHistory(userId: string, conversationId: string) {
        try {
            const conversation = await Conversation.findOne({
                _id: conversationId,
                user: userId
            });

            if (!conversation) {
                throw new Error('Conversation not found');
            }

            return conversation;
        } catch (error) {
            console.error('Error fetching conversation:', error);
            throw new Error('Failed to fetch conversation');
        }
    }

    async getUserConversations(userId: string, page: number = 1, limit: number = 10) {
        try {
            const skip = (page - 1) * limit;

            const conversations = await Conversation.find({ user: userId })
                .sort({ lastMessageAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('title lastMessageAt createdAt messages')
                .lean();

            // Add last message preview
            const conversationsWithPreview = conversations.map(conv => ({
                ...conv,
                lastMessage: conv.messages.length > 0 ? 
                    conv.messages[conv.messages.length - 1].content.substring(0, 100) + '...' : 
                    'New conversation',
                messageCount: conv.messages.length
            }));

            const total = await Conversation.countDocuments({ user: userId });

            return {
                conversations: conversationsWithPreview,
                pagination: {
                    current: page,
                    total: Math.ceil(total / limit),
                    hasNext: skip + limit < total,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw new Error('Failed to fetch conversations');
        }
    }
}

export default new ToctorAIService(); 