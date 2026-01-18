import React, { useState } from 'react';
import { Box, Avatar, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Badge, Chip, Tooltip } from '@mui/material';
import { Logout, CloudOff, Sync } from '@mui/icons-material';
import { User, signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import UltraFocus from './UltraFocus';

interface UserHeaderProps {
  user: User;
  isConnected: boolean;
  isOnline?: boolean;
  hasPendingSync?: boolean;
  onSyncNow?: () => void;
}

const UserHeader: React.FC<UserHeaderProps> = ({ 
  user, 
  isConnected, 
  isOnline = true, 
  hasPendingSync = false,
  onSyncNow 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

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

  // Determine connection status for badge
  const getBadgeColor = () => {
    if (!isOnline) return '#f44336'; // red - offline
    if (hasPendingSync) return '#ff9800'; // orange - has pending changes
    if (isConnected) return '#44b700'; // green - connected
    return '#ff9800'; // orange - connecting
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <UltraFocus user={user} />
        
        {/* Offline indicator chip */}
        {!isOnline && (
          <Tooltip title="You're offline. Changes will sync when you're back online.">
            <Chip
              icon={<CloudOff sx={{ fontSize: 16 }} />}
              label="Offline"
              size="small"
              sx={{
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                color: '#f44336',
                borderColor: 'rgba(244, 67, 54, 0.3)',
                border: '1px solid',
                fontSize: '0.75rem',
                height: 24,
                '& .MuiChip-icon': {
                  color: '#f44336',
                },
              }}
            />
          </Tooltip>
        )}
        
        {/* Pending sync indicator */}
        {isOnline && hasPendingSync && (
          <Tooltip title="Syncing pending changes...">
            <Chip
              icon={<Sync sx={{ fontSize: 16, animation: 'spin 1s linear infinite' }} />}
              label="Syncing..."
              size="small"
              onClick={onSyncNow}
              sx={{
                backgroundColor: 'rgba(255, 152, 0, 0.1)',
                color: '#ff9800',
                borderColor: 'rgba(255, 152, 0, 0.3)',
                border: '1px solid',
                fontSize: '0.75rem',
                height: 24,
                cursor: 'pointer',
                '& .MuiChip-icon': {
                  color: '#ff9800',
                },
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
          </Tooltip>
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
              backgroundColor: getBadgeColor(),
              color: getBadgeColor(),
              boxShadow: '0 0 0 2px white',
              '&::after': {
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                animation: (!isOnline || hasPendingSync) ? 'ripple 1.2s infinite ease-in-out' : 'none',
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
