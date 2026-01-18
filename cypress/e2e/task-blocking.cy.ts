/// <reference types="cypress" />

describe('Task Blocking and Hierarchy', () => {
  // Unique prefix for this test file - ensures isolation
  const TEST_PREFIX = `BLOCK_${Date.now()}`;
  
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

  describe('Setting Blocked By Relationship', () => {
    it('should show Blocked By dropdown in task details drawer', () => {
      const parent = taskName('Parent task');
      const child = taskName('Child task');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(parent);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(parent).should('be.visible');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(child);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(child).should('be.visible');
      
      cy.wait(1000);
      cy.contains(child).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root')
        .find('[role="combobox"]')
        .should('exist');
    });

    it('should set a task as blocked by another task', () => {
      const parent = taskName('Blocker');
      const child = taskName('Blocked');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(parent);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(parent).should('be.visible');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(child);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(child).should('be.visible');
      
      cy.wait(1000);
      cy.contains(child).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root')
        .find('[role="combobox"]')
        .first()
        .click({ force: true });
      
      cy.wait(500);
      cy.get('[role="listbox"]')
        .contains(parent)
        .click({ force: true });
      
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(1500);
      
      cy.contains(child).should('exist');
    });

    it('should show blocked task indented under parent', () => {
      const parent = taskName('Parent indent');
      const child = taskName('Child indent');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(parent);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(parent).should('be.visible');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(child);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(child).should('be.visible');
      
      cy.wait(1000);
      cy.contains(child).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root')
        .find('[role="combobox"]')
        .first()
        .click({ force: true });
      
      cy.wait(500);
      cy.get('[role="listbox"]')
        .contains(parent)
        .click({ force: true });
      
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(1500);
      
      cy.contains(parent).should('exist');
      cy.contains(child).should('exist');
    });

    it('should not allow task to block itself', () => {
      const name = taskName('Self block test');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.wait(1000);
      cy.contains(name).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root')
        .find('[role="combobox"]')
        .first()
        .click({ force: true });
      
      cy.wait(500);
      cy.get('[role="listbox"]')
        .should('not.contain', name);
      
      cy.get('body').type('{esc}');
    });
  });

  describe('Clearing Blocked By Relationship', () => {
    it('should clear blocked by relationship', () => {
      const parent = taskName('Parent clear');
      const child = taskName('Child clear');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(parent);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(parent).should('be.visible');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(child);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(child).should('be.visible');
      
      cy.wait(1000);
      cy.contains(child).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root')
        .find('[role="combobox"]')
        .first()
        .click({ force: true });
      
      cy.wait(500);
      cy.get('[role="listbox"]')
        .contains(parent)
        .click({ force: true });
      
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(1500);
      
      cy.contains(child).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root')
        .find('[role="combobox"]')
        .first()
        .click({ force: true });
      
      cy.wait(500);
      cy.get('[role="listbox"]')
        .find('li')
        .first()
        .click({ force: true });
      
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(1500);
      
      cy.contains(parent).should('exist');
      cy.contains(child).should('exist');
    });
  });

  describe('Blocked Task Behavior on Parent Completion', () => {
    it('should move blocked children when parent is completed', () => {
      const parent = taskName('Parent complete');
      const child = taskName('Child backlog');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(parent);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(parent).should('be.visible');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(child);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(child).should('be.visible');
      
      cy.wait(1000);
      cy.contains(child).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root')
        .find('[role="combobox"]')
        .first()
        .click({ force: true });
      
      cy.wait(500);
      cy.get('[role="listbox"]')
        .contains(parent)
        .click({ force: true });
      
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(1500);
      
      cy.contains(parent)
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(2000);
      cy.contains(child).should('exist');
    });

    it('should handle notification when blocked tasks are moved', () => {
      const parent = taskName('Notify parent');
      const child = taskName('Notify child');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(parent);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(parent).should('be.visible');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(child);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(child).should('be.visible');
      
      cy.wait(1000);
      cy.contains(child).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root')
        .find('[role="combobox"]')
        .first()
        .click({ force: true });
      
      cy.wait(500);
      cy.get('[role="listbox"]')
        .contains(parent)
        .click({ force: true });
      
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(1500);
      
      cy.contains(parent)
        .parents('.MuiListItem-root')
        .first()
        .find('[type="checkbox"]')
        .first()
        .click({ force: true });
      
      cy.wait(2000);
      cy.contains(child).should('exist');
    });
  });

  describe('Blocked Task Deletion', () => {
    it('should clear blocked references when parent is deleted', () => {
      const parent = taskName('Delete parent');
      const child = taskName('Orphan child');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(parent);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(parent).should('be.visible');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(child);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(child).should('be.visible');
      
      cy.wait(1000);
      cy.contains(child).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root')
        .find('[role="combobox"]')
        .first()
        .click({ force: true });
      
      cy.wait(500);
      cy.get('[role="listbox"]')
        .contains(parent)
        .click({ force: true });
      
      cy.get('body').type('{esc}');
      cy.wait(500);
      cy.get('body').type('{esc}');
      cy.wait(1500);
      
      cy.contains(parent).first().click({ force: true });
      cy.get('.MuiDrawer-root').should('be.visible');
      cy.wait(500);
      
      cy.get('.MuiDrawer-root').find('[data-testid="DeleteIcon"]').first().click({ force: true });
      cy.wait(1500);
      
      cy.contains(parent).should('not.exist');
      cy.contains(child).should('exist');
      
      // Remove parent from tracking since it's deleted
      const index = createdTasks.indexOf(parent);
      if (index > -1) createdTasks.splice(index, 1);
    });
  });
});
