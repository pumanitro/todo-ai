import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  Typography, 
  Container,
  Divider,
  TextField,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  Stack
} from '@mui/material';
import { Google, Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  AuthError
} from 'firebase/auth';
import { auth } from '../firebase/config';

const Login: React.FC = () => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log('User signed in:', result.user);
    } catch (error: any) {
      console.error('Error signing in:', error);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (isRegisterMode && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      
      if (isRegisterMode) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        console.log('User registered:', result.user);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        console.log('User signed in:', result.user);
      }
    } catch (error: any) {
      console.error('Error with email auth:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Handle specific Firebase auth errors
      const authError = error as AuthError;
      switch (authError.code) {
        case 'auth/email-already-in-use':
          setError('An account with this email already exists.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        case 'auth/user-not-found':
          setError('No account found with this email.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        case 'auth/invalid-credential':
          setError('Invalid email or password.');
          break;
        case 'auth/operation-not-allowed':
          setError('Email authentication is not enabled. Please contact support.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        default:
          setError(`Authentication failed: ${authError.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset email sent! Check your inbox.');
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      
      const authError = error as AuthError;
      switch (authError.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/invalid-email':
          setError('Please enter a valid email address.');
          break;
        case 'auth/too-many-requests':
          setError('Too many password reset attempts. Please try again later.');
          break;
        default:
          setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    setIsForgotPassword(false);
    resetForm();
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setIsRegisterMode(false);
    resetForm();
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card sx={{ p: 4 }}>
        <CardContent>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            {/* Logo with blue gradient */}
            <Box 
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 120,
                height: 120,
                borderRadius: '0%',

                mb: 3
              }}
            >
              <img 
                src="/icon-512.png" 
                alt="todo-flow logo" 
                style={{ 
                  width: '86px', 
                  height: '86px',
                  borderRadius: '10%',
                  objectFit: 'contain'
                }}
              />
            </Box>
            
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 1 }}>
              {isForgotPassword 
                ? 'Reset your password' 
                : isRegisterMode 
                ? 'Create your account' 
                : 'Welcome back!'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isForgotPassword 
                ? 'Enter your email to receive reset instructions' 
                : isRegisterMode 
                ? 'Please fill in your details to create an account' 
                : 'Please enter your details to sign in.'}
            </Typography>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          {/* Google Sign In at top */}
          {!isForgotPassword && (
            <>
              <Button
                variant="outlined"
                fullWidth
                size="large"
                startIcon={<Google />}
                onClick={handleGoogleSignIn}
                disabled={loading}
                sx={{ 
                  py: 1.5,
                  mb: 3,
                  borderColor: '#4285F4',
                  color: '#4285F4',
                  '&:hover': {
                    borderColor: '#3367D6',
                    backgroundColor: 'rgba(66, 133, 244, 0.04)'
                  }
                }}
              >
                Continue with Google
              </Button>
              
              <Divider sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>
            </>
          )}

          {/* Email Authentication Form */}
          <Box component="form" onSubmit={isForgotPassword ? handleForgotPassword : handleEmailAuth} sx={{ mb: 3 }}>
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant="outlined"
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
              
              {!isForgotPassword && (
                <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant="outlined"
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              )}

              {!isRegisterMode && !isForgotPassword && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="checkbox" 
                      id="remember-me" 
                      style={{ marginRight: '8px' }}
                    />
                    <Typography variant="body2" color="text.secondary" component="label" htmlFor="remember-me" sx={{ cursor: 'pointer' }}>
                      Remember me
                    </Typography>
                  </Box>
                  <Link 
                    component="button" 
                    variant="body2" 
                    onClick={toggleForgotPassword}
                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Forgot password?
                  </Link>
                </Box>
              )}

              {isRegisterMode && !isForgotPassword && (
                <TextField
                  fullWidth
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  variant="outlined"
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                sx={{ 
                  py: 1.5, 
                  mt: 3
                }}
              >
                {loading ? 'Please wait...' : (
                  isForgotPassword ? 'Send Reset Email' :
                  isRegisterMode ? 'Create Account' : 'Sign in'
                )}
              </Button>
            </Stack>
          </Box>

          {/* Toggle for forgot password mode */}
          {isForgotPassword && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Remember your password?{' '}
                <Link 
                  component="button" 
                  variant="body2" 
                  onClick={toggleForgotPassword}
                  sx={{ cursor: 'pointer' }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          )}
          
                    {/* Toggle between login and register */}
          {!isForgotPassword && !isRegisterMode && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account yet?{' '}
                <Link 
                  component="button" 
                  variant="body2" 
                  onClick={toggleMode}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          )}

          {isRegisterMode && (
            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link 
                  component="button" 
                  variant="body2" 
                  onClick={toggleMode}
                  sx={{ cursor: 'pointer', fontWeight: 600 }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Login; 