/// <reference types="cypress" />

describe('Todo CRUD Operations', () => {
  // Unique prefix for this test file - ensures isolation
  const TEST_PREFIX = `CRUD_${Date.now()}`;
  
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

  describe('Add Todo', () => {
    it('should add a new task to the backlog', () => {
      const name = taskName('New Task');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
    });

    it('should add a task with due date', () => {
      const name = taskName('Task with date');
      const today = new Date().toISOString().split('T')[0];
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.wait(300);
      cy.get('[data-testid="EventIcon"]').first().click({ force: true });
      cy.get('input[type="date"]').first().should('be.visible').type(today);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.wait(500);
      cy.contains(name).should('be.visible');
    });

    it('should not add empty task', () => {
      cy.contains('button', 'Add Task').should('be.disabled');
    });

    it('should clear input after adding task', () => {
      const name = taskName('Clear test');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.get('input[placeholder="Enter a new task..."]').first().should('have.value', '');
    });
  });

  describe('View Todo Details', () => {
    it('should open drawer when clicking on a task', () => {
      const name = taskName('Drawer test');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.wait(1000);
      cy.contains(name).first().click({ force: true });
      cy.wait(500);
      cy.get('.MuiDrawer-root').should('be.visible');
    });

    it('should close drawer when clicking outside or close button', () => {
      const name = taskName('Close drawer test');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.wait(1000);
      cy.contains(name).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(300);
      
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.contains(name).should('be.visible');
    });
  });

  describe('Edit Todo', () => {
    it('should edit task name', () => {
      const name = taskName('Original name');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name, { force: true });
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.wait(1500);
      cy.contains(name).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(1000);
      
      cy.get('.MuiDrawer-root input[type="text"]').first().should('exist');
      cy.get('.MuiDrawer-root textarea').first().should('exist');
      cy.get('body').type('{esc}');
    });

    it('should edit task description', () => {
      const name = taskName('Desc test');
      const description = 'This is a test description';
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.wait(1000);
      cy.contains(name).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root').find('textarea').first().type(description, { force: true }).blur();
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(1500);
      
      cy.contains(name).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      cy.get('.MuiDrawer-root').find('textarea').first().should('have.value', description);
    });
  });

  describe('Delete Todo', () => {
    it('should delete a task', () => {
      const name = taskName('Delete test');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.wait(1000);
      cy.contains(name).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root').find('[data-testid="DeleteIcon"]').first().click({ force: true });
      cy.wait(1500);
      cy.contains(name).should('not.exist');
      
      // Remove from tracking since it's deleted
      const index = createdTasks.indexOf(name);
      if (index > -1) createdTasks.splice(index, 1);
    });
  });

  describe('Due Date Changes', () => {
    it('should update due date in drawer', () => {
      const name = taskName('Due date test');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.wait(1000);
      cy.contains(name).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root').find('input[type="date"]').first().type(tomorrowStr, { force: true }).blur();
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(1500);
      
      cy.contains(name).should('exist');
    });
  });
});
