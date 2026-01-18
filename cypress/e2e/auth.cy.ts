/// <reference types="cypress" />

describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForAppLoad();
  });

  describe('Login Form Display', () => {
    it('should display the login form with all elements', () => {
      // Check logo
      cy.get('img[alt="todo-flow logo"]').should('be.visible');
      
      // Check welcome text
      cy.contains('Welcome back!').should('be.visible');
      
      // Check form fields
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      
      // Check buttons
      cy.contains('button', 'Continue with Google').should('be.visible');
      cy.contains('button', 'Sign in').should('be.visible');
      
      // Check links
      cy.contains('Forgot password?').should('be.visible');
      cy.contains('Sign Up').should('be.visible');
      
      // Check remember me checkbox
      cy.contains('Remember me').should('be.visible');
    });

    it('should toggle to register mode when clicking Sign Up', () => {
      cy.contains('Sign Up').click();
      
      // Check title changed
      cy.contains('Create your account').should('be.visible');
      
      // Check confirm password field appears
      cy.get('input[type="password"]').should('have.length', 2);
      
      // Check Sign In link appears
      cy.contains('Already have an account?').should('be.visible');
      cy.contains('Sign In').should('be.visible');
    });

    it('should toggle to forgot password mode', () => {
      cy.contains('Forgot password?').click();
      
      // Check title changed
      cy.contains('Reset your password').should('be.visible');
      
      // Password field should be hidden
      cy.get('input[type="password"]').should('not.exist');
      
      // Check send reset email button
      cy.contains('button', 'Send Reset Email').should('be.visible');
      
      // Check back link
      cy.contains('Remember your password?').should('be.visible');
    });
  });

  describe('Login Validation', () => {
    it('should show error for empty fields', () => {
      cy.contains('button', 'Sign in').click();
      
      cy.contains('Please fill in all fields').should('be.visible');
    });

    it('should show error for short password', () => {
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('123');
      
      cy.contains('button', 'Sign in').click();
      
      cy.contains('Password must be at least 6 characters').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.get('input[type="email"]').type('nonexistent@example.com');
      cy.get('input[type="password"]').type('wrongpassword123');
      
      cy.contains('button', 'Sign in').click();
      
      // Wait for Firebase error response
      cy.contains(/Invalid|No account|Incorrect/i, { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', () => {
      cy.get('input[type="password"]').type('mypassword');
      
      // Password should be hidden initially
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');
      
      // Click visibility toggle
      cy.get('[data-testid="VisibilityIcon"]').click();
      
      // Password should now be visible
      cy.get('input[type="text"]').should('have.value', 'mypassword');
      
      // Click again to hide
      cy.get('[data-testid="VisibilityOffIcon"]').click();
      
      // Password should be hidden again
      cy.get('input[type="password"]').should('have.value', 'mypassword');
    });
  });

  describe('Successful Login', () => {
    it('should login successfully with valid credentials', () => {
      cy.login();
      
      // Verify we're on the main app
      cy.contains('Today').should('be.visible');
      cy.contains('Backlog').should('be.visible');
      
      // User avatar should be visible
      cy.get('[aria-haspopup="true"]').should('be.visible');
    });
  });

  describe('Logout', () => {
    it('should logout successfully', () => {
      cy.login();
      
      // Verify logged in
      cy.contains('Today').should('be.visible');
      
      // Logout
      cy.logout();
      
      // Should be back on login page
      cy.contains('Welcome back!').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
    });
  });

  describe('Register Mode Validation', () => {
    beforeEach(() => {
      cy.contains('Sign Up').click();
    });

    it('should show error when passwords do not match', () => {
      cy.get('input[type="email"]').type('newuser@example.com');
      cy.get('input[type="password"]').first().type('password123');
      cy.get('input[type="password"]').last().type('differentpassword');
      
      cy.contains('button', 'Create Account').click();
      
      cy.contains('Passwords do not match').should('be.visible');
    });
  });
});
