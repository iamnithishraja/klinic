import { Platform } from 'react-native';

export interface VoiceRecordingResult {
  success: boolean;
  text?: string;
  error?: string;
  duration?: number;
}

class VoiceService {
  private recognition: any = null;
  private isRecording = false;
  private recordingStartTime: number = 0;
  private webSpeechResult: string = '';
  private webSpeechPromise: Promise<string> | null = null;
  private webSpeechResolve: ((value: string) => void) | null = null;
  private webSpeechReject: ((reason: any) => void) | null = null;

  // Check if Web Speech API is available
  isWebSpeechSupported(): boolean {
    return Platform.OS === 'web' && 
           typeof window !== 'undefined' && 
           ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'web') {
      return false;
    }
    
    // For web, we check if the browser supports speech recognition
    return this.isWebSpeechSupported();
  }

  async startRecording(): Promise<boolean> {
    if (Platform.OS !== 'web') {
      throw new Error('Voice recording is only supported on web');
    }

    if (!this.isWebSpeechSupported()) {
      throw new Error('Speech recognition not supported in this browser');
    }

    try {
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      this.webSpeechResult = '';

      return this.startWebSpeechRecording();
    } catch (error) {
      console.error('Error starting recording:', error);
      this.isRecording = false;
      return false;
    }
  }

  private startWebSpeechRecording(): boolean {
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      // Create a promise that will be resolved when speech recognition completes
      this.webSpeechPromise = new Promise((resolve, reject) => {
        this.webSpeechResolve = resolve;
        this.webSpeechReject = reject;
        
        // Add a timeout to prevent hanging
        setTimeout(() => {
          if (this.webSpeechResult.trim()) {
            resolve(this.webSpeechResult.trim());
          } else {
            reject(new Error('No speech detected. Please speak clearly and try again.'));
          }
        }, 5000); // 5 second timeout
      });

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          console.log('Speech result:', transcript, 'confidence:', confidence, 'isFinal:', event.results[i].isFinal);
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Store the final result
        if (finalTranscript.trim()) {
          this.webSpeechResult = finalTranscript.trim();
          console.log('Final transcript detected:', this.webSpeechResult);
        }
      };

      this.recognition.onend = () => {
        console.log('Web Speech API ended, final result:', this.webSpeechResult);
        if (this.webSpeechResult.trim()) {
          this.webSpeechResolve?.(this.webSpeechResult.trim());
        } else {
          this.webSpeechReject?.(new Error('No speech detected. Please speak clearly and try again.'));
        }
      };

      this.recognition.onerror = (event: any) => {
        console.error('Web Speech API error:', event.error);
        let errorMessage = 'Speech recognition failed.';
        
        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please speak clearly and try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not working. Please check your microphone and try again.';

            break;
          case 'language-not-supported':
            errorMessage = 'Language not supported. Please try speaking in English.';
            break;
          default:
            errorMessage = 'Speech recognition failed. Please try again.';
        }
        
        this.webSpeechReject?.(new Error(errorMessage));
      };

      this.recognition.onstart = () => {
        console.log('Web Speech API started successfully');
      };

      this.recognition.start();
      console.log('Web Speech API started');
      return true;
      
    } catch (error) {
      console.error('Failed to start Web Speech API:', error);
      return false;
    }
  }

  async stopRecording(): Promise<VoiceRecordingResult> {
    if (Platform.OS !== 'web') {
      return { success: false, error: 'Voice recording is only supported on web' };
    }

    try {
      if (!this.isRecording) {
        return { success: false, error: 'No active recording' };
      }

      const duration = Date.now() - this.recordingStartTime;
      this.isRecording = false;

      console.log('Stopping recording, duration:', duration);

      if (this.recognition) {
        console.log('Stopping Web Speech API recognition');
        this.recognition.stop();
      }
      
      if (this.webSpeechPromise) {
        try {
          console.log('Waiting for Web Speech API result...');
          const text = await this.webSpeechPromise;
          console.log('Web speech result received:', text);
          
          return {
            success: true,
            text: text,
            duration,
          };
        } catch (error: any) {
          console.error('Web speech recognition error:', error);
          
          return {
            success: false,
            error: error.message || 'Speech recognition failed',
            duration,
          };
        }
      } else {
        console.log('No Web Speech API promise found');
        return { success: false, error: 'Speech recognition not started', duration };
      }

    } catch (error) {
      console.error('Error stopping recording:', error);
      this.isRecording = false;
      return { success: false, error: 'Failed to stop recording' };
    }
  }

  async cancelRecording(): Promise<void> {
    try {
      if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
      }
      
      this.isRecording = false;
      this.webSpeechResult = '';
      this.webSpeechPromise = null;
      this.webSpeechResolve = null;
      this.webSpeechReject = null;
      
      console.log('Recording cancelled');
    } catch (error) {
      console.error('Error cancelling recording:', error);
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording;
  }

  getRecordingDuration(): number {
    if (!this.isRecording) return 0;
    return Date.now() - this.recordingStartTime;
  }

  // Cleanup method
  cleanup(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.isRecording = false;
    this.webSpeechResult = '';
    this.webSpeechPromise = null;
    this.webSpeechResolve = null;
    this.webSpeechReject = null;
  }
}

export const voiceService = new VoiceService(); 