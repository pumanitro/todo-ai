import React from 'react';
import { Snackbar, Alert, Button, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

interface NotificationPermissionPromptProps {
  open: boolean;
  onRequest: () => Promise<void>;
  onDismiss: () => void;
}

const NotificationPermissionPrompt: React.FC<NotificationPermissionPromptProps> = ({
  open,
  onRequest,
  onDismiss
}) => {
  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: 8 }} // Add margin to avoid overlapping with FAB
    >
      <Alert
        severity="info"
        action={
          <>
            <Button
              color="inherit"
              size="small"
              onClick={onRequest}
              sx={{ mr: 1 }}
            >
              Enable
            </Button>
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={onDismiss}
            >
              <Close fontSize="small" />
            </IconButton>
          </>
        }
      >
        Enable notifications to see your task count on the app icon
      </Alert>
    </Snackbar>
  );
};

export default NotificationPermissionPrompt; 