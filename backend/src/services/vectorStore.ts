import natural from 'natural';
import { removeStopwords, eng } from 'stopword';
import compromise from 'compromise';
import similarity from 'similarity';
import NodeCache from 'node-cache';
import { DocumentChunk } from './documentProcessor';

interface VectorDocument {
    id: string;
    content: string;
    metadata: any;
    keywords: string[];
    entities: {
        people: string[];
        places: string[];
        organizations: string[];
        dates: string[];
        medical: string[];
    };
    tfidfVector: number[];
    processed: boolean;
}

interface SearchResult {
    document: VectorDocument;
    score: number;
    reason: string;
}

class VectorStore {
    private documents: Map<string, VectorDocument> = new Map();
    private cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 }); // 1 hour cache
    private tokenizer = new natural.WordTokenizer();
    private stemmer = natural.PorterStemmer;
    private tfidf = new natural.TfIdf();
    private vocabulary: Set<string> = new Set();
    private documentIndexMap: Map<string, number> = new Map(); // Track TF-IDF document indices

    constructor() {
        console.log('🗄️ VectorStore initialized');
    }

    private extractMedicalEntities(text: string): string[] {
        // Use compromise to extract medical-related entities
        const doc = compromise(text);
        
        const medicalTerms: string[] = [];
        
        // Extract potential medical terms
        const nouns = doc.nouns().out('array');
        const adjectives = doc.adjectives().out('array');
        
        // Common medical patterns
        const medicalPatterns = [
            /\b(mg|ml|mcg|units?|dosage|dose|tablet|capsule|injection|surgery|treatment|therapy|diagnosis|symptom|condition|disease|infection|fever|pain|blood|pressure|diabetes|hypertension|cholesterol)\b/gi,
            /\b(test|report|result|analysis|examination|scan|x-ray|mri|ct|ultrasound|biopsy)\b/gi,
            /\b(doctor|dr|physician|specialist|cardiologist|neurologist|oncologist|surgeon)\b/gi,
            /\b(hospital|clinic|laboratory|lab|pharmacy|medical|health)\b/gi
        ];

        // Extract medical terms using patterns
        medicalPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                medicalTerms.push(...matches.map(m => m.toLowerCase()));
            }
        });

        // Add relevant nouns and adjectives that might be medical
        [...nouns, ...adjectives].forEach(term => {
            if (term.length > 3 && this.isMedicalTerm(term)) {
                medicalTerms.push(term.toLowerCase());
            }
        });

        return [...new Set(medicalTerms)];
    }

    private isMedicalTerm(term: string): boolean {
        const medicalKeywords = [
            'blood', 'heart', 'lung', 'liver', 'kidney', 'brain', 'pain', 'fever', 'cough',
            'pressure', 'sugar', 'cholesterol', 'vitamin', 'protein', 'infection', 'virus',
            'bacteria', 'cancer', 'tumor', 'chronic', 'acute', 'severe', 'mild', 'normal',
            'abnormal', 'positive', 'negative', 'high', 'low', 'elevated', 'decreased'
        ];
        
        return medicalKeywords.some(keyword => 
            term.toLowerCase().includes(keyword) || keyword.includes(term.toLowerCase())
        );
    }

    private extractEntities(text: string): VectorDocument['entities'] {
        const doc = compromise(text);
        
        return {
            people: doc.people().out('array'),
            places: doc.places().out('array'), 
            organizations: doc.organizations().out('array'),
            dates: this.extractDates(text),
            medical: this.extractMedicalEntities(text)
        };
    }

    private extractDates(text: string): string[] {
        // Extract dates using regex patterns since compromise.dates() is not available
        const datePatterns = [
            // MM/DD/YYYY, DD/MM/YYYY
            /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
            // YYYY-MM-DD
            /\b\d{4}-\d{1,2}-\d{1,2}\b/g,
            // Month DD, YYYY
            /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
            // DD Month YYYY
            /\b\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi,
            // Mon DD, YYYY (short month names)
            /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}\b/gi,
            // DD Mon YYYY
            /\b\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/gi,
            // Today, yesterday, etc.
            /\b(?:today|yesterday|tomorrow|last\s+week|next\s+week|last\s+month|next\s+month)\b/gi
        ];

        const dates: string[] = [];
        datePatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                dates.push(...matches.map(match => match.trim()));
            }
        });

        return [...new Set(dates)]; // Remove duplicates
    }

    private preprocessText(text: string): string[] {
        // Tokenize and clean text
        const tokens = this.tokenizer.tokenize(text.toLowerCase()) || [];
        
        // Remove stopwords and filter
        const filtered = removeStopwords(tokens, eng)
            .filter(token => token.length > 2)
            .filter(token => /^[a-zA-Z0-9]+$/.test(token));
        
        // Stem words
        return filtered.map(token => this.stemmer.stem(token));
    }

    private calculateTfIdf(documentId: string, terms: string[]): number[] {
        try {
            // Filter out empty terms
            const validTerms = terms.filter(term => term && term.length > 0);
            
            if (validTerms.length === 0) {
                return []; // Return empty vector for empty documents
            }
            
            // Add document to TF-IDF calculator and track its index
            const docIndex = this.tfidf.documents.length;
            this.tfidf.addDocument(validTerms);
            this.documentIndexMap.set(documentId, docIndex);
            
            // Build vocabulary
            validTerms.forEach(term => this.vocabulary.add(term));
            
            // Create TF-IDF vector
            const vocabularyArray = Array.from(this.vocabulary);
            const vector = new Array(vocabularyArray.length).fill(0);
            
            vocabularyArray.forEach((term, index) => {
                try {
                    vector[index] = this.tfidf.tfidf(term, docIndex);
                } catch (error) {
                    // If TF-IDF calculation fails for a term, set to 0
                    vector[index] = 0;
                }
            });
            
            return vector;
        } catch (error) {
            console.error(`❌ Error calculating TF-IDF for document ${documentId}:`, error);
            return []; // Return empty vector on error
        }
    }

    addDocument(chunk: DocumentChunk): VectorDocument {
        const cacheKey = `vector_${chunk.id}`;
        const cached = this.cache.get<VectorDocument>(cacheKey);
        
        if (cached) {
            this.documents.set(chunk.id, cached);
            return cached;
        }

        console.log('📝 Processing document for vector store:', chunk.id);

        try {
            // Extract entities and keywords
            const entities = this.extractEntities(chunk.content);
            const processedTerms = this.preprocessText(chunk.content);
            
            // Calculate TF-IDF vector
            const tfidfVector = this.calculateTfIdf(chunk.id, processedTerms);

            const vectorDoc: VectorDocument = {
                id: chunk.id,
                content: chunk.content,
                metadata: chunk.metadata,
                keywords: [...new Set([...chunk.keywords, ...processedTerms])],
                entities,
                tfidfVector,
                processed: true
            };

            this.documents.set(chunk.id, vectorDoc);
            this.cache.set(cacheKey, vectorDoc);

            console.log(`✅ Document ${chunk.id} added to vector store`);
            return vectorDoc;
        } catch (error) {
            console.error(`❌ Error processing document ${chunk.id} for vector store:`, error);
            
            // Create a minimal document without TF-IDF vector if processing fails
            const fallbackDoc: VectorDocument = {
                id: chunk.id,
                content: chunk.content,
                metadata: chunk.metadata,
                keywords: chunk.keywords,
                entities: {
                    people: [],
                    places: [],
                    organizations: [],
                    dates: [],
                    medical: []
                },
                tfidfVector: [],
                processed: false
            };

            this.documents.set(chunk.id, fallbackDoc);
            console.log(`⚠️ Document ${chunk.id} added with minimal processing due to error`);
            return fallbackDoc;
        }
    }

    addDocuments(chunks: DocumentChunk[]): VectorDocument[] {
        return chunks.map(chunk => this.addDocument(chunk));
    }

    search(query: string, limit: number = 5, filters?: any): SearchResult[] {
        if (this.documents.size === 0) {
            return [];
        }

        console.log(`🔍 Searching vector store for: "${query}" (${this.documents.size} documents)`);

        const queryTerms = this.preprocessText(query);
        const queryEntities = this.extractEntities(query);
        
        const scores: SearchResult[] = [];

        this.documents.forEach((doc, docId) => {
            let score = 0;
            let reasons: string[] = [];

            // 1. Content similarity using simple string similarity
            const contentSim = similarity(query.toLowerCase(), doc.content.toLowerCase());
            score += contentSim * 0.3;
            if (contentSim > 0.1) {
                reasons.push(`content match (${(contentSim * 100).toFixed(1)}%)`);
            }

            // 2. Keyword overlap
            const keywordOverlap = doc.keywords.filter(keyword => 
                queryTerms.some(qTerm => keyword.includes(qTerm) || qTerm.includes(keyword))
            ).length;
            
            const keywordScore = keywordOverlap / Math.max(queryTerms.length, 1);
            score += keywordScore * 0.3;
            if (keywordOverlap > 0) {
                reasons.push(`${keywordOverlap} keyword matches`);
            }

            // 3. Medical entity matching
            const medicalMatches = doc.entities.medical.filter(medTerm =>
                queryEntities.medical.some(qMed => 
                    medTerm.includes(qMed) || qMed.includes(medTerm)
                )
            ).length;
            
            if (medicalMatches > 0) {
                score += medicalMatches * 0.2;
                reasons.push(`${medicalMatches} medical term matches`);
            }

            // 4. Entity overlap (people, places, dates)
            const entityOverlap = [
                ...doc.entities.people,
                ...doc.entities.places,
                ...doc.entities.dates
            ].filter(entity => 
                query.toLowerCase().includes(entity.toLowerCase())
            ).length;

            if (entityOverlap > 0) {
                score += entityOverlap * 0.1;
                reasons.push(`${entityOverlap} entity matches`);
            }

            // 5. Document type relevance
            if (filters?.preferredType && doc.metadata.type === filters.preferredType) {
                score += 0.1;
                reasons.push('document type match');
            }

            if (score > 0.05) { // Minimum threshold
                scores.push({
                    document: doc,
                    score,
                    reason: reasons.join(', ') || 'general relevance'
                });
            }
        });

        // Sort by score and return top results
        const results = scores
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

        console.log(`📊 Found ${results.length} relevant documents`);
        return results;
    }

    getDocumentCount(): number {
        return this.documents.size;
    }

    getVocabularySize(): number {
        return this.vocabulary.size;
    }

    clearCache(): void {
        this.cache.flushAll();
        console.log('🧹 Vector store cache cleared');
    }

    getStats(): any {
        return {
            documentCount: this.getDocumentCount(),
            vocabularySize: this.getVocabularySize(),
            cacheSize: this.cache.keys().length,
            totalMedicalTerms: Array.from(this.documents.values())
                .reduce((total, doc) => total + doc.entities.medical.length, 0)
        };
    }
}

export default new VectorStore();
export type { VectorDocument, SearchResult }; 