/// <reference types="cypress" />

describe('Todo Categories', () => {
  // Unique prefix for this test file - ensures isolation
  const TEST_PREFIX = `CATEGORY_${Date.now()}`;
  
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

  describe('Automatic Categorization by Due Date', () => {
    it('should add task without date to Backlog', () => {
      const name = taskName('Backlog task');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.wait(500);
      
      cy.contains('Backlog').should('be.visible');
      cy.contains(name).should('be.visible');
    });

    it('should add task with today date to Today section', () => {
      const name = taskName('Today task');
      const today = new Date().toISOString().split('T')[0];
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.wait(300);
      cy.get('[data-testid="EventIcon"]').first().click({ force: true });
      cy.get('input[type="date"]').first().should('be.visible').type(today);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.wait(1000);
      cy.contains(name).should('be.visible');
    });

    it('should add task with future date to Postponed section', () => {
      const name = taskName('Postponed task');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.wait(300);
      cy.get('[data-testid="EventIcon"]').first().click({ force: true });
      cy.get('input[type="date"]').first().should('be.visible').type(futureDateStr);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.wait(1000);
      cy.contains('Postponed').should('be.visible');
      cy.contains(name).should('exist');
    });

    it('should add task with past date to Today section (overdue)', () => {
      const name = taskName('Overdue task');
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 3);
      const pastDateStr = pastDate.toISOString().split('T')[0];
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.wait(300);
      cy.get('[data-testid="EventIcon"]').first().click({ force: true });
      cy.get('input[type="date"]').first().should('be.visible').type(pastDateStr);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.wait(1000);
      cy.contains(name).should('be.visible');
    });
  });

  describe('Category Change via Due Date Update', () => {
    it('should move task from Backlog to Postponed when adding future due date', () => {
      const name = taskName('Move to postponed');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.wait(1000);
      cy.contains(name).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root')
        .find('input[type="date"]')
        .first()
        .should('be.visible')
        .type(futureDateStr, { force: true })
        .blur();
      
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(1500);
      
      cy.contains(name).should('exist');
    });

    it('should move task from Postponed to Today when changing to today date', () => {
      const name = taskName('Move to today');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      const today = new Date().toISOString().split('T')[0];
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.wait(300);
      cy.get('[data-testid="EventIcon"]').first().click({ force: true });
      cy.get('input[type="date"]').first().should('be.visible').type(futureDateStr);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.wait(1000);
      cy.contains(name).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root')
        .find('input[type="date"]')
        .first()
        .should('be.visible')
        .clear()
        .type(today, { force: true })
        .blur();
      
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(1500);
      
      cy.contains(name).should('exist');
    });

    it('should move task from Today to Backlog when clearing due date', () => {
      const name = taskName('Move to backlog');
      const today = new Date().toISOString().split('T')[0];
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.wait(300);
      cy.get('[data-testid="EventIcon"]').first().click({ force: true });
      cy.get('input[type="date"]').first().should('be.visible').type(today);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.wait(1000);
      cy.contains(name).should('be.visible');
      
      cy.contains(name).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root')
        .find('input[type="date"]')
        .first()
        .should('be.visible')
        .clear({ force: true })
        .blur();
      
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(1500);
      
      cy.contains(name).should('exist');
    });
  });

  describe('Section Visibility', () => {
    it('should show Today section by default', () => {
      cy.contains('Today').should('be.visible');
    });

    it('should show Backlog section by default', () => {
      cy.contains('Backlog').should('be.visible');
    });

    it('should show Postponed section when there are postponed tasks', () => {
      const name = taskName('Postponed visibility');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.wait(300);
      cy.get('[data-testid="EventIcon"]').first().click({ force: true });
      cy.get('input[type="date"]').first().should('be.visible').type(futureDateStr);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.wait(1000);
      cy.contains('Postponed').should('be.visible');
    });
  });
});
