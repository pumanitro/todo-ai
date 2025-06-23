import React from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Container,
  Divider
} from '@mui/material';
import { Google } from '@mui/icons-material';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config';

const Login: React.FC = () => {
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('User signed in:', result.user);
    } catch (error: any) {
      console.error('Error signing in:', error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ p: 4 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              todo-flow
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to manage your tasks
            </Typography>
          </Box>
          
          <Divider sx={{ mb: 4 }} />
          
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={<Google />}
            onClick={handleGoogleSignIn}
            sx={{ 
              py: 1.5,
              backgroundColor: '#4285F4',
              '&:hover': {
                backgroundColor: '#3367D6',
              }
            }}
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login; 