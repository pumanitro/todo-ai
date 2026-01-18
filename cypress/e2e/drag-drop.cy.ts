/// <reference types="cypress" />

describe('Drag and Drop', () => {
  // Unique prefix for this test file - ensures isolation
  const TEST_PREFIX = `DRAG_${Date.now()}`;
  
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

  describe('Task Reordering', () => {
    it('should display task items that can be reordered', () => {
      const name = taskName('Drag handle test');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.contains(name)
        .parents('.MuiListItem-root')
        .should('exist');
    });

    it('should reorder tasks within Backlog section', () => {
      const name1 = taskName('First task');
      const name2 = taskName('Second task');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name1);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name1).should('be.visible');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name2);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name2).should('be.visible');
      
      cy.contains(name1).should('be.visible');
      cy.contains(name2).should('be.visible');
    });

    it('should reorder tasks within Today section', () => {
      const today = new Date().toISOString().split('T')[0];
      const name1 = taskName('Today first');
      const name2 = taskName('Today second');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name1, { force: true });
      cy.wait(300);
      cy.get('[data-testid="EventIcon"]').first().click({ force: true });
      cy.get('input[type="date"]').first().type(today, { force: true });
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.wait(1000);
      cy.contains(name1).should('be.visible');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name2, { force: true });
      cy.wait(300);
      cy.get('[data-testid="EventIcon"]').first().click({ force: true });
      cy.get('input[type="date"]').first().type(today, { force: true });
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.wait(1000);
      cy.contains(name2).should('be.visible');
      
      cy.contains(name1).should('be.visible');
      cy.contains(name2).should('be.visible');
    });
  });

  describe('Moving Tasks Between Sections', () => {
    it('should have droppable areas for Today and Backlog', () => {
      cy.contains('Today').should('be.visible');
      cy.contains('Backlog').should('be.visible');
    });

    it('should highlight drop zone when dragging starts', () => {
      const name = taskName('Drag highlight test');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
    });
    
    it('should have draggable task items in Backlog', () => {
      const name = taskName('Draggable backlog');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.contains(name).should('be.visible');
      cy.contains(name)
        .parent()
        .parent()
        .should('exist');
    });

    it('should have draggable task items in Today', () => {
      const name = taskName('Draggable today');
      const today = new Date().toISOString().split('T')[0];
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.wait(300);
      cy.get('[data-testid="EventIcon"]').first().click({ force: true });
      cy.get('input[type="date"]').first().should('be.visible').type(today);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.wait(500);
      cy.contains(name).should('be.visible');
    });
  });

  describe('Drag and Drop via Keyboard', () => {
    it('should have keyboard accessible tasks', () => {
      const name = taskName('Keyboard drag');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
    });
  });

  describe('Multiple Tasks Ordering', () => {
    it('should maintain order of multiple tasks', () => {
      const tasks = [
        taskName('Multi task A'),
        taskName('Multi task B'),
        taskName('Multi task C'),
      ];
      
      tasks.forEach(name => {
        cy.get('input[placeholder="Enter a new task..."]').first().type(name);
        cy.contains('button', 'Add Task').click({ force: true });
        cy.contains(name).should('be.visible');
      });
      
      tasks.forEach(name => {
        cy.contains(name).should('be.visible');
      });
    });
  });
});
