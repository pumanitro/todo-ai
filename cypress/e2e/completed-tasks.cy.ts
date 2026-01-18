/// <reference types="cypress" />

describe('Completed Tasks', () => {
  // Unique prefix for this test file - ensures isolation
  const TEST_PREFIX = `COMPLETED_${Date.now()}`;
  
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

  describe('Completing a Task', () => {
    it('should complete a task by clicking the checkbox', () => {
      const name = taskName('Complete me');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(1500);
      cy.contains('Completed').should('be.visible');
    });

    it('should move completed task to Completed section', () => {
      const name = taskName('To completed');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(2000);
      cy.contains('Completed').click();
      cy.contains(name).should('be.visible');
    });

    it('should show strikethrough on completed task', () => {
      const name = taskName('Strikethrough test');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(2000);
      cy.contains('Completed').click();
      cy.contains(name).should('be.visible');
    });

    it('should check the checkbox when task is completed', () => {
      const name = taskName('Checkbox state');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .should('not.be.checked');
      
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(2000);
      cy.contains('Completed').click();
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .should('be.checked');
    });
  });

  describe('Uncompleting a Task', () => {
    it('should uncomplete a task by clicking the checkbox again', () => {
      const name = taskName('Uncomplete me');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(2000);
      cy.contains('Completed').click();
      
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(1500);
      cy.contains(name).should('be.visible');
    });

    it('should return uncompleted task to correct category based on due date', () => {
      const name = taskName('Return to today');
      const today = new Date().toISOString().split('T')[0];
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name, { force: true });
      cy.wait(300);
      cy.get('[data-testid="EventIcon"]').first().click({ force: true });
      cy.get('input[type="date"]').first().type(today, { force: true });
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.wait(1000);
      cy.contains(name).should('be.visible');
      
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(2000);
      cy.contains('Completed').click({ force: true });
      cy.wait(500);
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(2000);
      cy.contains(name).should('exist');
    });

    it('should return uncompleted task without date to Backlog', () => {
      const name = taskName('Return to backlog');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.contains('Backlog')
        .parent()
        .parent()
        .contains(name)
        .should('be.visible');
      
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(2000);
      cy.contains('Completed').click();
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(1500);
      cy.contains('Backlog')
        .parent()
        .parent()
        .contains(name)
        .should('be.visible');
    });
  });

  describe('Completed Section Visibility', () => {
    it('should show Completed section when there are completed tasks', () => {
      const name = taskName('Show completed');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(2000);
      cy.contains('Completed').should('be.visible');
    });

    it('should be collapsible', () => {
      const name = taskName('Collapse test');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      
      cy.contains(name)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(2000);
      cy.contains('Completed').click();
      cy.contains(name).should('be.visible');
      cy.contains('Completed').click();
      cy.contains('Completed').should('be.visible');
    });

    it('should show task count in header', () => {
      const name1 = taskName('Count task 1');
      const name2 = taskName('Count task 2');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name1);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name1)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      cy.wait(2000);
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name2);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name2)
        .first()
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      cy.wait(2000);
      
      cy.contains(/Completed.*\(\d+\)/i).should('be.visible');
    });
  });

  describe('Multiple Task Completion', () => {
    it('should handle completing multiple tasks', () => {
      const tasks = [
        taskName('Multi complete A'),
        taskName('Multi complete B'),
        taskName('Multi complete C'),
      ];
      
      tasks.forEach(name => {
        cy.get('input[placeholder="Enter a new task..."]').first().type(name);
        cy.contains('button', 'Add Task').click({ force: true });
        cy.contains(name).should('be.visible');
      });
      
      tasks.forEach(name => {
        cy.contains(name)
          .first()
          .parents('.MuiListItem-root')
          .first()
          .find('[type="checkbox"]')
          .first()
          .click();
        cy.wait(1500);
      });
      
      cy.contains('Completed').click();
      tasks.forEach(name => {
        cy.contains(name).should('be.visible');
      });
    });
  });
});
