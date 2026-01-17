import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { User } from 'firebase/auth';
import { ref, set, onValue, remove } from 'firebase/database';
import { database } from '../../firebase/config';

interface UltraFocusProps {
  user: User;
}

const UltraFocus: React.FC<UltraFocusProps> = ({ user }) => {
  const [ultraFocus, setUltraFocus] = useState<string>('');
  const [isEditingFocus, setIsEditingFocus] = useState<boolean>(false);
  const [focusInputValue, setFocusInputValue] = useState<string>('');

  // Load ultrafocus from Firebase
  useEffect(() => {
    if (user?.uid) {
      const ultraFocusRef = ref(database, `users/${user.uid}/ultraFocus`);
      const unsubscribe = onValue(ultraFocusRef, (snapshot) => {
        const value = snapshot.val();
        if (value) {
          setUltraFocus(value);
          setFocusInputValue(value);
        } else {
          setUltraFocus('');
          setFocusInputValue('');
        }
      });

      return () => unsubscribe();
    }
  }, [user?.uid]);

  const handleFocusClick = () => {
    setIsEditingFocus(true);
  };

  const handleFocusBlur = async () => {
    setIsEditingFocus(false);
    const capitalizedValue = focusInputValue.toUpperCase().trim();
    
    if (user?.uid && capitalizedValue !== ultraFocus) {
      try {
        const ultraFocusRef = ref(database, `users/${user.uid}/ultraFocus`);
        if (capitalizedValue) {
          await set(ultraFocusRef, capitalizedValue);
        } else {
          await remove(ultraFocusRef);
        }
      } catch (error) {
        console.error('Error saving ultra focus:', error);
      }
    }
  };

  const handleFocusKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleFocusBlur();
    } else if (event.key === 'Escape') {
      setFocusInputValue(ultraFocus);
      setIsEditingFocus(false);
    }
  };

  const handleFocusInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFocusInputValue(e.target.value.toUpperCase());
  };

  return (
    <Box sx={{ flex: 1, mr: 2 }}>
      {isEditingFocus ? (
        <TextField
          value={focusInputValue}
          onChange={handleFocusInputChange}
          onBlur={handleFocusBlur}
          onKeyDown={handleFocusKeyPress}
          placeholder="ULTRAFOCUS"
          variant="standard"
          fullWidth
          autoFocus
          sx={{
            '& .MuiInput-root': {
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'uppercase',
            },
            '& .MuiInput-input::placeholder': {
              opacity: 0.6,
              fontWeight: 500,
              textTransform: 'uppercase',
            }
          }}
        />
      ) : (
        <Typography
          variant="h6"
          onClick={handleFocusClick}
          sx={{
            cursor: 'pointer',
            opacity: ultraFocus ? 1 : 0.6,
            fontWeight: ultraFocus ? 600 : 500,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            '&:hover': {
              opacity: ultraFocus ? 0.8 : 0.8,
            },
            minHeight: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            color: ultraFocus ? 'primary.main' : 'text.secondary',
          }}
        >
          {ultraFocus || 'ULTRAFOCUS'}
        </Typography>
      )}
    </Box>
  );
};

export default UltraFocus; 