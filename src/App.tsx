import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { theme } from './theme/theme';
import HelloWorld from './components/HelloWorld';

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <HelloWorld />
    </ThemeProvider>
  );
};

export default App; 