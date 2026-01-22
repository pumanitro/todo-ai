import React, { useState, useEffect } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import 'animate.css';
import { theme } from './theme/theme';
import { auth } from './firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import TodoList from './components/TodoList';
import Login from './components/Login';
import { queryClient, persistOptions } from './services/queryClient';
import { useServiceWorker } from './hooks/useServiceWorker';
import UpdateBanner from './components/UpdateBanner';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { updateAvailable, applyUpdate } = useServiceWorker();

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
        <UpdateBanner open={updateAvailable} onUpdate={applyUpdate} />
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
};

export default App;
