import React from 'react';
import { Box, Typography, Avatar, IconButton, Tooltip, Button } from '@mui/material';
import { Logout, Wifi, WifiOff } from '@mui/icons-material';
import { User, signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';

interface UserHeaderProps {
  user: User;
  isConnected: boolean;
}

const UserHeader: React.FC<UserHeaderProps> = ({ user, isConnected }) => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar src={user.photoURL || undefined} alt={user.displayName || 'User'} />
        <Typography variant="h6">
          Hello, {user.displayName?.split(' ')[0] || 'User'}!
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Tooltip title={isConnected ? 'Connected' : 'Connecting...'}>
          <IconButton size="small" sx={{ color: isConnected ? 'success.main' : 'warning.main' }}>
            {isConnected ? <Wifi /> : <WifiOff />}
          </IconButton>
        </Tooltip>
        <Button
          variant="outlined"
          startIcon={<Logout />}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>
    </Box>
  );
};

export default UserHeader; 