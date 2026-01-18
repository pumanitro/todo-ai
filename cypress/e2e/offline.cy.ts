/// <reference types="cypress" />

describe('Offline Mode', () => {
  // Unique prefix for this test file - ensures isolation
  const TEST_PREFIX = `OFFLINE_${Date.now()}`;
  
  // Track tasks created in this test run
  const createdTasks: string[] = [];
  
  // Helper to create unique task names
  const taskName = (name: string) => {
    const fullName = `${TEST_PREFIX}_${name}`;
    createdTasks.push(fullName);
    return fullName;
  };

  beforeEach(() => {
    cy.login();
  });

  after(() => {
    // Clean up only tasks created by THIS test file
    if (createdTasks.length > 0) {
      cy.deleteTasksByName(createdTasks);
    }
  });

  describe('Online Status Indicator', () => {
    it('should not show offline indicator when online', () => {
      cy.contains('Offline').should('not.exist');
    });

    it('should show user avatar', () => {
      cy.get('[aria-haspopup="true"]').should('be.visible');
    });
  });

  describe('Cached Data Display', () => {
    it('should display existing tasks when loaded', () => {
      const name = taskName('Cached task');
      cy.get('input[placeholder="Enter a new task..."]').first().type(name, { force: true });
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.wait(2000);
      cy.reload();
      
      cy.contains('Today', { timeout: 15000 }).should('be.visible');
      cy.contains(name, { timeout: 15000 }).should('be.visible');
    });
  });

  describe('App Sections', () => {
    it('should display Today section', () => {
      cy.contains('Today').should('be.visible');
    });

    it('should display Backlog section', () => {
      cy.contains('Backlog').should('be.visible');
    });

    it('should display user header', () => {
      cy.get('[aria-haspopup="true"]').should('be.visible');
    });
  });

  describe('Syncing Indicator', () => {
    it('should not show syncing indicator when all data is synced', () => {
      cy.contains('Syncing').should('not.exist');
    });
  });

  describe('Service Worker Status', () => {
    it('should have service worker API available', () => {
      cy.window().then((win) => {
        expect(win.navigator.serviceWorker).to.not.be.undefined;
      });
    });
  });
});
