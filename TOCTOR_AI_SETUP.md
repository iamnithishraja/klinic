# Toctor AI Setup Guide

## Overview

Toctor AI is an advanced medical AI assistant integrated into the Klinic healthcare platform. It provides personalized medical guidance, symptom analysis, and healthcare recommendations based on comprehensive patient data.

## Features

- 🩺 **Medical Assessment**: Analyzes symptoms and provides preliminary health assessments
- 💊 **Medication Guidance**: Offers medication recommendations and interaction warnings
- 🧪 **Lab Test Recommendations**: Suggests appropriate lab tests based on symptoms and history
- 📊 **Health Trend Analysis**: Reviews patient medical history and identifies patterns
- 🏥 **Provider Recommendations**: Suggests specific doctors and labs from the platform
- 💬 **Beautiful Chat Interface**: XML-parsed responses with rich formatting
- 🔄 **Context Awareness**: Maintains conversation context and medical history

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install @google/generative-ai
```

### 2. Environment Configuration

Add your Google Gemini API key to your `.env` file:

```env
# Google Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Database Schema

The system automatically creates the following collections:
- `conversations`: Stores AI chat conversations
- `messages`: Individual chat messages with timestamps

### 4. API Endpoints

The following endpoints are available:

- `POST /api/v1/ai/chat` - Send a message to Toctor AI
- `POST /api/v1/ai/chat/stream` - Stream AI responses (for real-time typing)
- `GET /api/v1/ai/conversations` - Get user's conversation history
- `GET /api/v1/ai/conversations/:id` - Get specific conversation
- `GET /api/v1/ai/health-summary` - Get user's health summary

## Frontend Features

### 1. Floating Action Button

- Animated floating button in bottom-right corner
- Pulse and glow effects
- AI badge indicator
- Tooltip on hover

### 2. Chat Interface

- Beautiful bottom sheet modal
- XML-parsed AI responses with rich formatting
- Message history with timestamps
- Typing indicators
- Medical-themed color scheme

### 3. XML Response Parsing

The AI responses are formatted using XML tags that are parsed into beautiful UI components:

- `<medical_assessment>` - Medical analysis sections
- `<recommendations type="immediate|followup|lifestyle">` - Categorized recommendations
- `<test name="..." priority="high|medium|low" reason="...">` - Lab test suggestions
- `<medication name="..." dosage="..." duration="...">` - Medication recommendations
- `<warnings>` - Important health warnings
- `<next_steps>` - Clear action items

## Medical Context Integration

Toctor AI has access to comprehensive patient data:

### User Profile Data
- Age, gender, location
- Medical history
- Contact information

### Recent Medical Activity (6 months)
- Doctor appointments and prescriptions
- Lab appointments and results
- Consultation notes
- Treatment outcomes

### Contextual Recommendations
- Location-based provider suggestions
- History-aware medication recommendations
- Trend analysis from lab results
- Personalized preventive care

## Usage

1. **Access**: Tap the purple floating AI button on the user dashboard
2. **Welcome**: Toctor AI introduces itself with available capabilities
3. **Chat**: Ask health questions, describe symptoms, or request recommendations
4. **Responses**: Receive beautifully formatted, context-aware medical guidance
5. **History**: Conversations are saved and can be resumed later

## Sample Interactions

### Symptom Analysis
```
User: "I've been having headaches for the past week"
AI: Analyzes symptoms considering user's medical history and provides:
- Medical assessment
- Immediate recommendations
- Suggested lab tests
- When to see a doctor
```

### Lab Test Questions
```
User: "What do my recent blood test results mean?"
AI: Reviews stored lab results and provides:
- Result interpretation
- Trend analysis
- Follow-up recommendations
- Lifestyle suggestions
```

### Medication Guidance
```
User: "Can I take ibuprofen with my current medications?"
AI: Checks user's prescription history and provides:
- Interaction warnings
- Dosage recommendations
- Alternative suggestions
- Safety guidelines
```

## Safety Features

- **No Definitive Diagnoses**: AI suggests consulting healthcare professionals
- **Emergency Detection**: Flags urgent symptoms requiring immediate care
- **Professional Guidance**: Encourages medical consultation for serious issues
- **Context Awareness**: Uses patient history to provide personalized advice
- **Warning Systems**: Highlights important safety information

## Technical Architecture

### AI Service (`aiService.ts`)
- Gemini 2.5 Flash integration
- Context gathering from multiple data sources
- Conversation management
- Medical data formatting

### Controllers (`aiController.ts`)
- REST API endpoints
- Server-sent events for streaming
- Error handling
- Response formatting

### Database Models
- Conversation schema with message history
- Context snapshots for performance
- User relationship management

### Frontend Components
- `ToctorAIChat`: Main chat interface with XML parsing
- `ToctorFloatingButton`: Animated floating action button
- Rich UI components for different response types

## Security & Privacy

- All conversations are associated with authenticated users
- Medical context is gathered securely from existing patient data
- No external data sharing - all processing happens within your infrastructure
- Conversation history is stored encrypted
- Access control through existing authentication middleware

## Customization

### System Prompt
Modify the `getSystemPrompt()` method in `aiService.ts` to customize AI behavior.

### UI Styling
Update component styles in `ToctorAIChat.tsx` and `ToctorFloatingButton.tsx`.

### Response Format
Add new XML tags and parsing logic in the `parseXMLContent()` function.

### Context Data
Extend the `gatherUserMedicalContext()` method to include additional data sources.

## Troubleshooting

### Common Issues

1. **API Key Error**: Ensure GEMINI_API_KEY is set in environment variables
2. **Context Loading**: Check database connections and user authentication
3. **UI Rendering**: Verify Tailwind CSS classes are properly configured
4. **Response Parsing**: Check XML format compliance in AI responses

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## Future Enhancements

- Voice-to-text input
- Real-time streaming responses
- Multi-language support
- Integration with wearable devices
- Appointment booking from chat
- Prescription refill requests
- Health goal tracking
- Family medical history integration

---

Toctor AI brings cutting-edge AI assistance to your healthcare platform, providing users with intelligent, personalized medical guidance while maintaining the highest standards of safety and privacy. 