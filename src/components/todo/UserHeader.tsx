import React, { useState, useEffect } from 'react';
import { Box, Avatar, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Badge, TextField, Typography } from '@mui/material';
import { Logout, Clear } from '@mui/icons-material';
import { User, signOut } from 'firebase/auth';
import { ref, set, onValue, remove } from 'firebase/database';
import { auth, database } from '../../firebase/config';

interface UserHeaderProps {
  user: User;
  isConnected: boolean;
}

const UserHeader: React.FC<UserHeaderProps> = ({ user, isConnected }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [ultraFocus, setUltraFocus] = useState<string>('');
  const [isEditingFocus, setIsEditingFocus] = useState<boolean>(false);
  const [focusInputValue, setFocusInputValue] = useState<string>('');
  const open = Boolean(anchorEl);

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

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      handleClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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

  const handleClearFocus = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (user?.uid) {
      try {
        const ultraFocusRef = ref(database, `users/${user.uid}/ultraFocus`);
        await remove(ultraFocusRef);
        setFocusInputValue('');
      } catch (error) {
        console.error('Error clearing ultra focus:', error);
      }
    }
  };

  const handleFocusInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFocusInputValue(e.target.value.toUpperCase());
  };

  const getPlaceholderText = () => {
    return ultraFocus ? ultraFocus : "✨ DEFINE YOUR ULTRAFOCUS AREA";
  };

  const getMotivationalText = () => {
    if (!ultraFocus && !isEditingFocus) {
      return "🎯 What's your main focus today? Click to set your ULTRAFOCUS area!";
    }
    return "";
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box sx={{ flex: 1, mr: 2 }}>
        {isEditingFocus ? (
          <TextField
            value={focusInputValue}
            onChange={handleFocusInputChange}
            onBlur={handleFocusBlur}
            onKeyDown={handleFocusKeyPress}
            placeholder="✨ DEFINE YOUR ULTRAFOCUS AREA"
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              title={getMotivationalText()}
            >
              {getPlaceholderText()}
            </Typography>
            {ultraFocus && (
              <IconButton
                size="small"
                onClick={handleClearFocus}
                sx={{ 
                  opacity: 0.5,
                  '&:hover': { opacity: 1 },
                  ml: 0.5
                }}
                title="Clear ULTRAFOCUS"
              >
                <Clear fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}
        {!ultraFocus && !isEditingFocus && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              opacity: 0.7,
              fontStyle: 'italic',
              mt: 0.5,
              color: 'text.secondary',
            }}
          >
            🎯 Click above to set your main focus area and boost productivity!
          </Typography>
        )}
      </Box>
      
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 2 }}
        aria-controls={open ? 'account-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: isConnected ? '#44b700' : '#ff9800',
              color: isConnected ? '#44b700' : '#ff9800',
              boxShadow: '0 0 0 2px white',
              '&::after': {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                animation: !isConnected ? 'ripple 1.2s infinite ease-in-out' : 'none',
                border: '1px solid currentColor',
                content: '""',
              },
            },
            '@keyframes ripple': {
              '0%': {
                transform: 'scale(.8)',
                opacity: 1,
              },
              '100%': {
                transform: 'scale(2.4)',
                opacity: 0,
              },
            },
          }}
        >
          <Avatar 
            src={user.photoURL || undefined} 
            alt={user.displayName || 'User'}
            sx={{ width: 32, height: 32 }}
          />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              overflow: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
      >
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserHeader; 