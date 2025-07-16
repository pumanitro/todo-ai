import React from 'react';
import { Link } from '@mui/material';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
// Phone number regex to match various formats, but ensure it ends with a digit
const PHONE_REGEX = /(\+?[\d][\d\s\-\(\)]*[\d]|\+?[\d]{7,15})/g;

// More specific phone validation to avoid matching random numbers
const isValidPhoneNumber = (text: string): boolean => {
  // Clean up the text by removing trailing punctuation
  const cleaned = text.replace(/[^\d+]/g, '');
  
  // Must start with + (international) or be 7+ digits
  if (cleaned.startsWith('+')) {
    return cleaned.length >= 8; // +1234567 minimum
  }
  
  // For non-international numbers, require at least 7 digits and max 15
  return cleaned.length >= 7 && cleaned.length <= 15;
};

// Clean phone number text by removing trailing punctuation
const cleanPhoneNumberText = (text: string): string => {
  // Remove trailing punctuation (dashes, spaces, parentheses) but keep internal ones
  return text.replace(/[\s\-\(\)]+$/, '');
};

const processTextWithPhoneNumbers = (text: string, keyPrefix: string): React.ReactNode[] => {
  const parts = text.split(PHONE_REGEX);
  
  return parts.map((part, index) => {
    if (!part) return null;
    
    // Check if it's a phone number
    if (PHONE_REGEX.test(part) && isValidPhoneNumber(part)) {
      const cleanedNumber = part.replace(/[^\d+]/g, '');
      const displayText = cleanPhoneNumberText(part);
      return (
        <Link
          key={`${keyPrefix}-phone-${index}`}
          href={`tel:${cleanedNumber}`}
          onClick={(e) => e.stopPropagation()}
          sx={{
            color: 'primary.main',
            textDecoration: 'underline',
            fontWeight: 'medium',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          {displayText}
        </Link>
      );
    }
    
    // Regular text
    return part;
  }).filter(part => part !== null);
};

export const renderTextWithLinks = (text: string): React.ReactNode => {
  if (!text) return text;
  
  // First, split by URLs
  const urlParts = text.split(URL_REGEX);
  
  return urlParts.map((part, index) => {
    if (!part) return null;
    
    // Check if it's a URL
    if (URL_REGEX.test(part)) {
      const displayText = part.length > 65 ? `${part.substring(0, 65)}...` : part;
      return (
        <Link
          key={`url-${index}`}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          sx={{
            color: 'primary.main',
            textDecoration: 'underline',
            wordBreak: 'break-all',
            overflowWrap: 'break-word',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          {displayText}
        </Link>
      );
    }
    
    // For regular text parts, process phone numbers
    return processTextWithPhoneNumbers(part, `text-${index}`);
  }).filter(part => part !== null);
}; 