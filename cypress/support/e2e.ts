// ***********************************************************
// This file is processed and loaded automatically before test files.
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands';

// Suppress uncaught exceptions from the app (Firebase, etc.)
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test
  // This is useful for third-party errors we can't control
  if (err.message.includes('ResizeObserver') || 
      err.message.includes('Firebase') ||
      err.message.includes('Network Error')) {
    return false;
  }
  return true;
});

// Clear localStorage before each test to ensure clean state
beforeEach(() => {
  cy.clearLocalStorage();
});
