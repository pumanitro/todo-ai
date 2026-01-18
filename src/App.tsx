import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import 'animate.css';
import { theme } from './theme/theme';
import { auth } from './firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import TodoList from './components/TodoList';
import Login from './components/Login';
import { queryClient, persistOptions } from './services/queryClient';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh' 
          }}
        >
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={persistOptions}
      onSuccess={() => {
        // Resume any paused mutations after restore
        queryClient.resumePausedMutations();
      }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {user ? <TodoList user={user} /> : <Login />}
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
