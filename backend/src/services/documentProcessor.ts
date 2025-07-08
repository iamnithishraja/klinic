import { readPdfText } from 'pdf-text-reader';
import axios from 'axios';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import NodeCache from 'node-cache';
import { removeStopwords, eng } from 'stopword';
import natural from 'natural';
import compromise from 'compromise';
import vectorStore from './vectorStore';
import type { VectorDocument, SearchResult } from './vectorStore';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import os from 'os';

// Use existing S3 client configuration
const s3Client = new S3Client({
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY || '',
        secretAccessKey: process.env.R2_SECRET_KEY || '',
    },
    region: 'auto'
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'klinic-bucket';

// Cache for parsed PDFs (cache for 24 hours)
const pdfCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

interface DocumentChunk {
    id: string;
    content: string;
    type: 'medical_history' | 'lab_report';
    metadata: {
        documentUrl: string;
        userId: string;
        extractedAt: Date;
        appointmentId?: string;
        chunkIndex: number;
        totalChunks: number;
    };
    keywords: string[];
}

interface ProcessedDocument {
    documentUrl: string;
    extractedText: string;
    chunks: DocumentChunk[];
    type: 'medical_history' | 'lab_report';
    metadata: any;
}

class DocumentProcessor {
    private tokenizer = new natural.WordTokenizer();
    private stemmer = natural.PorterStemmer;

    async downloadPdfFromUrl(url: string): Promise<Buffer> {
        try {
            // Check if it's an R2/S3 URL and extract key
            if (url.includes(process.env.R2_ENDPOINT || 'r2.dev')) {
                const urlObj = new URL(url);
                const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
                
                const command = new GetObjectCommand({
                    Bucket: BUCKET_NAME,
                    Key: key
                });
                
                const response = await s3Client.send(command);
                const chunks: Uint8Array[] = [];
                
                if (response.Body) {
                    const stream = response.Body as any;
                    for await (const chunk of stream) {
                        chunks.push(chunk);
                    }
                }
                
                return Buffer.concat(chunks);
            } else {
                // Fallback to direct HTTP download
                const response = await axios.get(url, { responseType: 'arraybuffer' });
                return Buffer.from(response.data);
            }
        } catch (error) {
            console.error('Error downloading PDF:', error);
            throw new Error(`Failed to download PDF from ${url}`);
        }
    }

    async extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
        try {
            // Create a temporary file since pdf-text-reader requires a file path
            const tempDir = os.tmpdir();
            const tempFilePath = path.join(tempDir, `temp_pdf_${Date.now()}.pdf`);
            
            // Write buffer to temporary file
            await fs.promises.writeFile(tempFilePath, pdfBuffer);
            
            try {
                // Extract text using pdf-text-reader
                const text = await readPdfText({ url: tempFilePath });
                return text || '';
            } finally {
                // Clean up temporary file
                try {
                    await fs.promises.unlink(tempFilePath);
                } catch (cleanupError) {
                    console.warn('Failed to cleanup temporary PDF file:', cleanupError);
                }
            }
        } catch (error) {
            console.error('Error parsing PDF:', error);
            throw new Error('Failed to extract text from PDF');
        }
    }

    private chunkText(text: string, maxChunkSize: number = 1000): string[] {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const chunks: string[] = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            if (currentChunk.length + sentence.length > maxChunkSize) {
                if (currentChunk.trim()) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = sentence;
            } else {
                currentChunk += sentence + '. ';
            }
        }

        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }

        return chunks.length > 0 ? chunks : [text];
    }

    private extractKeywords(text: string): string[] {
        // Tokenize and clean text
        const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
        
        // Remove stopwords
        const filteredTokens = removeStopwords(tokens, eng);
        
        // Stem words and filter by length
        const keywords = filteredTokens
            .map(token => this.stemmer.stem(token))
            .filter(word => word.length > 2)
            .filter(word => /^[a-zA-Z]+$/.test(word)); // Only alphabetic words

        // Return unique keywords
        return [...new Set(keywords)];
    }



    async processPdf(
        url: string, 
        type: 'medical_history' | 'lab_report', 
        userId: string,
        appointmentId?: string
    ): Promise<ProcessedDocument> {
        try {
            // Check cache first
            const cacheKey = `pdf_${url}_${type}`;
            const cached = pdfCache.get<ProcessedDocument>(cacheKey);
            if (cached) {
                console.log('📄 Using cached PDF data for:', url);
                return cached;
            }

            console.log('📄 Processing PDF:', url);

            // Download and extract text
            const pdfBuffer = await this.downloadPdfFromUrl(url);
            const extractedText = await this.extractTextFromPdf(pdfBuffer);

            if (!extractedText.trim()) {
                throw new Error('No text could be extracted from PDF');
            }

            // Create chunks
            const textChunks = this.chunkText(extractedText);
            const chunks: DocumentChunk[] = textChunks.map((chunk, index) => ({
                id: `${userId}_${type}_${Date.now()}_${index}`,
                content: chunk,
                type,
                metadata: {
                    documentUrl: url,
                    userId,
                    extractedAt: new Date(),
                    appointmentId,
                    chunkIndex: index,
                    totalChunks: textChunks.length
                },
                keywords: this.extractKeywords(chunk)
            }));

            // Add chunks to vector store
            vectorStore.addDocuments(chunks);

            const result: ProcessedDocument = {
                documentUrl: url,
                extractedText,
                chunks,
                type,
                metadata: {
                    userId,
                    appointmentId,
                    processedAt: new Date(),
                    totalChunks: chunks.length,
                    wordCount: extractedText.split(/\s+/).length
                }
            };

            // Cache the result
            pdfCache.set(cacheKey, result);
            console.log('✅ PDF processed successfully:', url, `(${chunks.length} chunks)`);

            return result;
        } catch (error) {
            console.error('❌ Error processing PDF:', url, error);
            throw error;
        }
    }

    async processMedicalHistoryPdfs(userId: string, pdfUrls: string[]): Promise<ProcessedDocument[]> {
        const results: ProcessedDocument[] = [];
        
        for (const url of pdfUrls) {
            try {
                const processed = await this.processPdf(url, 'medical_history', userId);
                results.push(processed);
            } catch (error) {
                console.error(`Failed to process medical history PDF ${url}:`, error);
                // Continue with other PDFs even if one fails
            }
        }

        return results;
    }

    async processLabReportPdfs(userId: string, pdfUrls: string[], appointmentId: string): Promise<ProcessedDocument[]> {
        const results: ProcessedDocument[] = [];
        
        for (const url of pdfUrls) {
            try {
                const processed = await this.processPdf(url, 'lab_report', userId, appointmentId);
                results.push(processed);
            } catch (error) {
                console.error(`Failed to process lab report PDF ${url}:`, error);
                // Continue with other PDFs even if one fails
            }
        }

        return results;
    }

    // Search through document chunks using vector store
    searchDocuments(query: string, limit: number = 5, filters?: any): DocumentChunk[] {
        console.log('🔍 Searching documents with vector store...');
        
        // Use vector store for intelligent search
        const searchResults = vectorStore.search(query, limit, filters);
        
        // Convert search results back to DocumentChunk format
        const chunks: DocumentChunk[] = searchResults.map(result => {
            const doc = result.document;
            return {
                id: doc.id,
                content: doc.content,
                type: doc.metadata.type || 'medical_history',
                metadata: doc.metadata,
                keywords: doc.keywords
            };
        });

        console.log(`📊 Found ${chunks.length} relevant document chunks`);
        return chunks;
    }

    // Get search statistics
    getSearchStats(): any {
        return vectorStore.getStats();
    }
}

export default new DocumentProcessor();
export type { DocumentChunk, ProcessedDocument }; 