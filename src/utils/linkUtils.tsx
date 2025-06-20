import React from 'react';
import { Link } from '@mui/material';

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export const renderTextWithLinks = (text: string): React.ReactNode => {
  if (!text) return text;
  
  const parts = text.split(URL_REGEX);
  
  return parts.map((part, index) => {
    if (URL_REGEX.test(part)) {
      // This is a URL
      const displayText = part.length > 65 ? `${part.substring(0, 65)}...` : part;
      
      return (
        <Link
          key={index}
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
    
    // Regular text
    return part;
  });
}; 