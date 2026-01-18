/// <reference types="cypress" />

// Custom command declarations
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with test credentials from environment variables
       * @example cy.login()
       */
      login(): Chainable<void>;
      
      /**
       * Custom command to logout
       * @example cy.logout()
       */
      logout(): Chainable<void>;
      
      /**
       * Custom command to add a new todo task
       * @param text - The task text
       * @param dueDate - Optional due date in YYYY-MM-DD format
       * @example cy.addTodo('My new task')
       * @example cy.addTodo('My task', '2024-12-25')
       */
      addTodo(text: string, dueDate?: string): Chainable<void>;
      
      /**
       * Custom command to delete all todos for clean test state (UI-based, slow)
       * @example cy.deleteAllTodos()
       */
      deleteAllTodos(): Chainable<void>;
      
      /**
       * Fast cleanup - deletes all todos directly from Firebase (no UI)
       * @example cy.cleanupFirebase()
       */
      cleanupFirebase(): Chainable<void>;
      
      /**
       * Delete specific tasks by their text content (for isolated cleanup)
       * @param taskNames - Array of task names to delete
       * @example cy.deleteTasksByName(['Task 1', 'Task 2'])
       */
      deleteTasksByName(taskNames: string[]): Chainable<void>;
      
      /**
       * Custom command to wait for the app to be fully loaded
       * @example cy.waitForAppLoad()
       */
      waitForAppLoad(): Chainable<void>;
    }
  }
}

// Login command - uses email/password from environment variables
Cypress.Commands.add('login', () => {
  const email = Cypress.env('TEST_EMAIL');
  const password = Cypress.env('TEST_PASSWORD');
  
  if (!email || !password) {
    throw new Error(
      'Test credentials not found. Please set CYPRESS_TEST_EMAIL and CYPRESS_TEST_PASSWORD environment variables.'
    );
  }
  
  cy.visit('/');
  
  // Wait for page to load - either login form or app should be visible
  cy.wait(1000);
  
  cy.get('body').then(($body) => {
    // Check if already logged in by looking for app elements
    if ($body.find('[aria-haspopup="true"]').length > 0) {
      // Already logged in - just wait for Today section
      cy.contains('Today', { timeout: 15000 }).should('be.visible');
    } else {
      // Not logged in - perform login
      cy.get('input[type="email"]', { timeout: 10000 }).should('be.visible');
      cy.get('input[type="email"]').clear().type(email);
      cy.get('input[type="password"]').clear().type(password);
      cy.contains('button', 'Sign in').click();
      
      // Wait for successful login
      cy.contains('Today', { timeout: 20000 }).should('be.visible');
    }
  });
});

// Logout command
Cypress.Commands.add('logout', () => {
  // Click on the user avatar to open menu
  cy.get('[aria-haspopup="true"]').click();
  
  // Click logout option
  cy.contains('Logout').click();
  
  // Wait for login screen to appear
  cy.get('input[type="email"]', { timeout: 10000 }).should('be.visible');
});

// Add todo command
Cypress.Commands.add('addTodo', (text: string, dueDate?: string) => {
  // Find and fill the task input
  cy.get('input[placeholder="Enter a new task..."]').clear().type(text);
  
  // If due date provided, click date icon and set date
  if (dueDate) {
    // Click date icon to show date input
    cy.get('[data-testid="EventIcon"]').first().click();
    
    // Set the due date
    cy.get('input[type="date"]').first().type(dueDate);
  }
  
  // Click Add Task button
  cy.contains('button', 'Add Task').click();
  
  // Wait for task to appear
  cy.contains(text, { timeout: 5000 }).should('be.visible');
});

// Delete all todos command - deletes up to specified number of tasks
Cypress.Commands.add('deleteAllTodos', () => {
  const MAX_DELETE = 100; // Maximum tasks to delete
  
  const deleteTask = (remaining: number) => {
    if (remaining <= 0) return;
    
    cy.get('body').then(($body) => {
      const checkboxes = $body.find('[type="checkbox"]');
      if (checkboxes.length > 0) {
        // Click on the task text (not checkbox) to open drawer
        cy.get('[type="checkbox"]')
          .first()
          .parents('.MuiListItem-root')
          .first()
          .find('p')
          .first()
          .click({ force: true });
        
        // Wait for drawer to open
        cy.wait(500);
        
        // Click delete if drawer opened
        cy.get('body').then(($body2) => {
          if ($body2.find('[data-testid="DeleteIcon"]').length > 0) {
            cy.get('[data-testid="DeleteIcon"]').first().click({ force: true });
            cy.wait(500);
          } else {
            // Close any potential overlay and try again
            cy.get('body').type('{esc}');
            cy.wait(300);
          }
          
          // Continue with next
          deleteTask(remaining - 1);
        });
      }
    });
  };
  
  deleteTask(MAX_DELETE);
});

// Wait for app to fully load
Cypress.Commands.add('waitForAppLoad', () => {
  // Wait for either the login form or the Today section to be visible
  cy.get('body', { timeout: 15000 }).should(($body) => {
    const hasLoginForm = $body.find('input[type="email"]').length > 0;
    const hasTodoList = $body.text().includes('Today') || $body.text().includes('Backlog');
    expect(hasLoginForm || hasTodoList).to.be.true;
  });
});

// Fast cleanup - directly deletes from Firebase (no UI interaction needed)
Cypress.Commands.add('cleanupFirebase', () => {
  cy.task('deleteAllTodosFromFirebase').then((result) => {
    if (result) {
      cy.log('✅ Firebase cleanup complete');
    } else {
      cy.log('⚠️ Firebase cleanup skipped or failed');
    }
  });
});

// Delete specific tasks by name - for isolated test cleanup
Cypress.Commands.add('deleteTasksByName', (taskNames: string[]) => {
  cy.task('deleteTasksByName', taskNames).then((result) => {
    if (result) {
      cy.log(`✅ Deleted ${taskNames.length} tasks`);
    } else {
      cy.log('⚠️ Task deletion skipped or failed');
    }
  });
});

export {};
