import React from 'react';
import {
  MedicalAssessment,
  RecommendationCard,
  TestCard,
  MedicationCard,
  DoctorRecommendationCard,
  WarningsCard,
  NextStepsCard,
  PlainText
} from './MessageComponents';

export const parseXMLContent = (content: string): JSX.Element[] => {
  const elements: JSX.Element[] = [];
  let processedContent = content;
  let elementCounter = 0;

  // Generate unique key for each element
  const getUniqueKey = (prefix: string) => `${prefix}-${Date.now()}-${elementCounter++}`;

  // First, remove empty wrapper tags and clean up content
  processedContent = processedContent
    .replace(/<recommendations>\s*<\/recommendations>/gs, '') // Remove empty recommendations wrapper
    .replace(/<recommendations>/gs, '') // Remove opening recommendations tag
    .replace(/<\/recommendations>/gs, '') // Remove closing recommendations tag
    .replace(/<lab_tests>\s*<\/lab_tests>/gs, '') // Remove empty lab_tests wrapper
    .replace(/<lab_tests>/gs, '') // Remove opening lab_tests tag
    .replace(/<\/lab_tests>/gs, '') // Remove closing lab_tests tag
    .replace(/<medications>\s*<\/medications>/gs, '') // Remove empty medications wrapper
    .replace(/<medications>/gs, '') // Remove opening medications tag
    .replace(/<\/medications>/gs, '') // Remove closing medications tag
    .trim();

  // Define XML tag patterns with their corresponding components
  const xmlPatterns = [
    {
      pattern: /<medical_assessment>(.*?)<\/medical_assessment>/gs,
      parser: (match: RegExpMatchArray) => {
        const content = match[1].trim();
        if (content) {
          return <MedicalAssessment key={getUniqueKey('medical-assessment')} content={content} />;
        }
        return null;
      }
    },
    {
      pattern: /<recommendation type="(.*?)">(.*?)<\/recommendation>/gs,
      parser: (match: RegExpMatchArray) => {
        const type = match[1];
        const content = match[2].trim();
        if (content) {
          return <RecommendationCard key={getUniqueKey('recommendation')} type={type} content={content} />;
        }
        return null;
      }
    },
    {
      pattern: /<test name="(.*?)" priority="(.*?)" reason="(.*?)">(.*?)<\/test>/gs,
      parser: (match: RegExpMatchArray) => {
        const name = match[1];
        const priority = match[2];
        const reason = match[3];
        const content = match[4].trim();
        if (name && content) {
          return <TestCard key={getUniqueKey('test')} name={name} priority={priority} reason={reason} content={content} />;
        }
        return null;
      }
    },
    {
      pattern: /<test name="(.*?)" priority="(.*?)">(.*?)<\/test>/gs,
      parser: (match: RegExpMatchArray) => {
        const name = match[1];
        const priority = match[2];
        const content = match[3].trim();
        if (name && content) {
          return <TestCard key={getUniqueKey('test-simple')} name={name} priority={priority} content={content} />;
        }
        return null;
      }
    },
    {
      pattern: /<medication name="(.*?)" dosage="(.*?)" duration="(.*?)" priority="(.*?)">(.*?)<\/medication>/gs,
      parser: (match: RegExpMatchArray) => {
        const name = match[1];
        const dosage = match[2];
        const duration = match[3];
        const priority = match[4];
        const content = match[5].trim();
        if (name && content) {
          return <MedicationCard key={getUniqueKey('medication-full')} name={name} dosage={dosage} duration={duration} priority={priority} content={content} />;
        }
        return null;
      }
    },
    {
      pattern: /<medication name="(.*?)" dosage="(.*?)" duration="(.*?)">(.*?)<\/medication>/gs,
      parser: (match: RegExpMatchArray) => {
        const name = match[1];
        const dosage = match[2];
        const duration = match[3];
        const content = match[4].trim();
        if (name && content) {
          return <MedicationCard key={getUniqueKey('medication')} name={name} dosage={dosage} duration={duration} content={content} />;
        }
        return null;
      }
    },
    {
      pattern: /<medication name="(.*?)" priority="(.*?)">(.*?)<\/medication>/gs,
      parser: (match: RegExpMatchArray) => {
        const name = match[1];
        const priority = match[2];
        const content = match[3].trim();
        if (name && content) {
          return <MedicationCard key={getUniqueKey('medication-priority')} name={name} priority={priority} content={content} />;
        }
        return null;
      }
    },
    {
      pattern: /<medication name="(.*?)">(.*?)<\/medication>/gs,
      parser: (match: RegExpMatchArray) => {
        const name = match[1];
        const content = match[2].trim();
        if (name && content) {
          return <MedicationCard key={getUniqueKey('medication-simple')} name={name} content={content} />;
        }
        return null;
      }
    },
    {
      pattern: /<doctor_rec name="(.*?)" specialization="(.*?)" city="(.*?)" fee="(.*?)" type="(.*?)" priority="(.*?)" reason="(.*?)">(.*?)<\/doctor_rec>/gs,
      parser: (match: RegExpMatchArray) => {
        const name = match[1];
        const specialization = match[2];
        const city = match[3];
        const fee = match[4];
        const type = match[5];
        const priority = match[6];
        const reason = match[7];
        const content = match[8].trim();
        if (name && specialization && content) {
          return <DoctorRecommendationCard key={getUniqueKey('doctor-rec-full')} name={name} specialization={specialization} city={city} fee={fee} type={type} priority={priority} reason={reason} content={content} />;
        }
        return null;
      }
    },
    {
      pattern: /<doctor_rec name="(.*?)" specialization="(.*?)" city="(.*?)" priority="(.*?)" reason="(.*?)">(.*?)<\/doctor_rec>/gs,
      parser: (match: RegExpMatchArray) => {
        const name = match[1];
        const specialization = match[2];
        const city = match[3];
        const priority = match[4];
        const reason = match[5];
        const content = match[6].trim();
        if (name && specialization && content) {
          return <DoctorRecommendationCard key={getUniqueKey('doctor-rec-priority')} name={name} specialization={specialization} city={city} priority={priority} reason={reason} content={content} />;
        }
        return null;
      }
    },
    {
      pattern: /<doctor_rec name="(.*?)" specialization="(.*?)" city="(.*?)">(.*?)<\/doctor_rec>/gs,
      parser: (match: RegExpMatchArray) => {
        const name = match[1];
        const specialization = match[2];
        const city = match[3];
        const content = match[4].trim();
        if (name && specialization && content) {
          return <DoctorRecommendationCard key={getUniqueKey('doctor-rec-simple')} name={name} specialization={specialization} city={city} content={content} />;
        }
        return null;
      }
    },
    {
      pattern: /<warnings>(.*?)<\/warnings>/gs,
      parser: (match: RegExpMatchArray) => {
        const content = match[1].trim();
        if (content) {
          return <WarningsCard key={getUniqueKey('warnings')} content={content} />;
        }
        return null;
      }
    },
    {
      pattern: /<next_steps>(.*?)<\/next_steps>/gs,
      parser: (match: RegExpMatchArray) => {
        const content = match[1].trim();
        if (content) {
          return <NextStepsCard key={getUniqueKey('next-steps')} content={content} />;
        }
        return null;
      }
    }
  ];

  // Process all XML patterns
  xmlPatterns.forEach(({ pattern, parser }) => {
    let match;
    while ((match = pattern.exec(processedContent)) !== null) {
      const element = parser(match);
      if (element) {
        elements.push(element);
      }
      
      // Remove the processed XML from content
      processedContent = processedContent.replace(match[0], '');
      pattern.lastIndex = 0; // Reset regex index
    }
  });

  // Clean up any remaining XML artifacts and empty lines
  const remainingText = processedContent
    .replace(/<[^>]*>/g, '') // Remove any remaining XML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (remainingText) {
    // Split by sentence-ending punctuation for better text formatting
    const sentences = remainingText.split(/(?<=[.!?])\s+/).filter(sentence => sentence.trim());
    sentences.forEach((sentence, index) => {
      if (sentence.trim().length > 3) { // Only add meaningful content
        elements.push(
          <PlainText key={getUniqueKey(`text-sentence-${index}`)} content={sentence.trim()} />
        );
      }
    });
  }

  // If no content was parsed, return the original content as plain text
  if (elements.length === 0 && content.trim()) {
    elements.push(
      <PlainText key={getUniqueKey('fallback-text')} content={content.trim()} />
    );
  }

  return elements;
};

// Helper function to extract and clean text content from XML for preview
export const extractTextContent = (xmlContent: string): string => {
  // Remove all XML tags and get plain text
  const textContent = xmlContent.replace(/<[^>]*>/g, ' ').trim();
  
  // Clean up multiple spaces and newlines
  const cleanText = textContent.replace(/\s+/g, ' ').trim();
  
  // Return first 100 characters for preview
  return cleanText.length > 100 ? `${cleanText.substring(0, 100)}...` : cleanText;
}; 