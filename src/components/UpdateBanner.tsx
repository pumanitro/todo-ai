import React from 'react';
import { Snackbar, Button, Box, Typography } from '@mui/material';
import SystemUpdateAltIcon from '@mui/icons-material/SystemUpdateAlt';

interface UpdateBannerProps {
  open: boolean;
  onUpdate: () => void;
}

/**
 * Banner that appears when a new version of the app is available.
 * Shows a non-intrusive snackbar at the bottom with a refresh button.
 */
export const UpdateBanner: React.FC<UpdateBannerProps> = ({ open, onUpdate }) => {
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        '& .MuiSnackbarContent-root': {
          backgroundColor: '#1976d2',
          color: 'white',
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        },
      }}
      message={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SystemUpdateAltIcon fontSize="small" />
          <Typography variant="body2">
            A new version is available!
          </Typography>
        </Box>
      }
      action={
        <Button
          color="inherit"
          size="small"
          onClick={onUpdate}
          sx={{
            fontWeight: 600,
            backgroundColor: 'rgba(255,255,255,0.15)',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.25)',
            },
          }}
        >
          Update Now
        </Button>
      }
    />
  );
};

export default UpdateBanner;
