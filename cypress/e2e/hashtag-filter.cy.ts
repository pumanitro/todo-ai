/// <reference types="cypress" />

describe('Hashtag Filter', () => {
  // Unique prefix for this test file - ensures isolation
  const TEST_PREFIX = `HASHTAG_${Date.now()}`;
  
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

  describe('Hashtag Highlighting', () => {
    it('should display hashtags in blue color', () => {
      const name = taskName('Task with #test hashtag');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      // The hashtag should be rendered with primary color (blue)
      cy.contains('#test').should('be.visible');
      cy.contains('#test').should('have.css', 'color').and('not.equal', 'rgb(0, 0, 0)');
    });

    it('should handle multiple hashtags in one task', () => {
      const name = taskName('Task #work #urgent');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.contains('#work').should('be.visible');
      cy.contains('#urgent').should('be.visible');
    });
  });

  describe('Filter Button Display', () => {
    it('should show filter icon next to Today header when hashtags exist', () => {
      const name = taskName('Filter test #shopping');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      // Filter icon should be visible (FilterList icon)
      cy.get('[data-testid="FilterListIcon"]').should('be.visible');
    });
  });

  describe('Filter Functionality', () => {
    it('should open filter menu when clicking filter icon', () => {
      const name = taskName('Menu test #category');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.wait(500);
      cy.get('[data-testid="FilterListIcon"]').first().click({ force: true });
      
      // Menu should appear with the hashtag
      cy.get('.MuiMenu-root').should('be.visible');
      cy.contains('#category').should('be.visible');
    });

    it('should filter tasks by selected hashtag', () => {
      const taskWithTag = taskName('Tagged #filtertest');
      const taskWithoutTag = taskName('No tag here');
      
      // Add task with hashtag
      cy.get('input[placeholder="Enter a new task..."]').first().type(taskWithTag);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(taskWithTag).should('be.visible');
      
      cy.wait(500);
      
      // Add task without hashtag
      cy.get('input[placeholder="Enter a new task..."]').first().type(taskWithoutTag);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(taskWithoutTag).should('be.visible');
      
      cy.wait(500);
      
      // Click filter and select hashtag
      cy.get('[data-testid="FilterListIcon"]').first().click({ force: true });
      cy.get('.MuiMenu-root').should('be.visible');
      cy.contains('.MuiMenuItem-root', '#filtertest').click({ force: true });
      
      cy.wait(500);
      
      // Task with hashtag should be visible
      cy.contains(taskWithTag).should('be.visible');
      
      // Task without hashtag should not be visible
      cy.contains(taskWithoutTag).should('not.exist');
    });

    it('should show active filter chip when filter is applied', () => {
      const name = taskName('Chip test #active');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.wait(500);
      
      // Apply filter
      cy.get('[data-testid="FilterListIcon"]').first().click({ force: true });
      cy.contains('.MuiMenuItem-root', '#active').click({ force: true });
      
      // Chip with hashtag should appear
      cy.get('.MuiChip-root').contains('#active').should('be.visible');
    });

    it('should clear filter when clicking Clear filter option', () => {
      const taskWithTag = taskName('Clear test #clearable');
      const taskWithoutTag = taskName('Will reappear');
      
      // Add tasks
      cy.get('input[placeholder="Enter a new task..."]').first().type(taskWithTag);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(taskWithTag).should('be.visible');
      
      cy.wait(500);
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(taskWithoutTag);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(taskWithoutTag).should('be.visible');
      
      cy.wait(500);
      
      // Apply filter
      cy.get('[data-testid="FilterListIcon"]').first().click({ force: true });
      cy.contains('.MuiMenuItem-root', '#clearable').click({ force: true });
      
      cy.wait(500);
      
      // Task without tag should be hidden
      cy.contains(taskWithoutTag).should('not.exist');
      
      // Clear filter
      cy.get('[data-testid="FilterListIcon"]').first().click({ force: true });
      cy.contains('.MuiMenuItem-root', 'Clear filter').click({ force: true });
      
      cy.wait(500);
      
      // Both tasks should be visible again
      cy.contains(taskWithTag).should('be.visible');
      cy.contains(taskWithoutTag).should('be.visible');
    });

    it('should clear filter when clicking chip delete button', () => {
      const name = taskName('Delete chip #deletable');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(name);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(name).should('be.visible');
      
      cy.wait(500);
      
      // Apply filter
      cy.get('[data-testid="FilterListIcon"]').first().click({ force: true });
      cy.contains('.MuiMenuItem-root', '#deletable').click({ force: true });
      
      cy.wait(500);
      
      // Verify the filter chip appears (contains the hashtag)
      cy.get('.MuiChip-root').contains('#deletable').should('be.visible');
      
      // Click delete button on the filter chip specifically
      cy.get('.MuiChip-root').contains('#deletable').parent().find('[data-testid="CloseIcon"]').click({ force: true });
      
      cy.wait(500);
      
      // Filter chip should be removed (no chip containing hashtag)
      cy.get('.MuiChip-root').contains('#deletable').should('not.exist');
    });
  });

  describe('Multiple Hashtags', () => {
    it('should show all unique hashtags in filter menu', () => {
      const task1 = taskName('Task #alpha');
      const task2 = taskName('Task #beta');
      const task3 = taskName('Task #gamma');
      
      // Add multiple tasks with different hashtags
      cy.get('input[placeholder="Enter a new task..."]').first().type(task1);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.wait(300);
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(task2);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.wait(300);
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(task3);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.wait(500);
      
      // Open filter menu
      cy.get('[data-testid="FilterListIcon"]').first().click({ force: true });
      cy.get('.MuiMenu-root').should('be.visible');
      
      // All hashtags should be in the menu
      cy.contains('.MuiMenuItem-root', '#alpha').should('be.visible');
      cy.contains('.MuiMenuItem-root', '#beta').should('be.visible');
      cy.contains('.MuiMenuItem-root', '#gamma').should('be.visible');
    });
  });

  describe('Hashtag Autocomplete', () => {
    it('should show autocomplete suggestions when typing hashtag', () => {
      // First create a task with a hashtag
      const existingTask = taskName('Existing #family task');
      cy.get('input[placeholder="Enter a new task..."]').first().type(existingTask);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(existingTask).should('be.visible');
      
      cy.wait(500);
      
      // Now type a new task with partial hashtag
      cy.get('input[placeholder="Enter a new task..."]').first().type('New task #fam');
      
      // Autocomplete dropdown should appear with #family suggestion
      cy.get('.MuiPaper-root').contains('#family').should('be.visible');
    });

    it('should insert hashtag when clicking suggestion', () => {
      // First create a task with a hashtag
      const existingTask = taskName('Task with #shopping');
      cy.get('input[placeholder="Enter a new task..."]').first().type(existingTask);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.contains(existingTask).should('be.visible');
      
      cy.wait(500);
      
      // Type new task with partial hashtag
      cy.get('input[placeholder="Enter a new task..."]').first().type('Buy milk #sho');
      
      // Click on the suggestion
      cy.get('.MuiPaper-root').contains('#shopping').click({ force: true });
      
      // Input should now contain the full hashtag
      cy.get('input[placeholder="Enter a new task..."]').first().should('have.value', 'Buy milk #shopping ');
    });

    it('should navigate suggestions with arrow keys', () => {
      // Create tasks with multiple hashtags
      const task1 = taskName('Task #work');
      const task2 = taskName('Task #weekend');
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(task1);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.wait(300);
      
      cy.get('input[placeholder="Enter a new task..."]').first().type(task2);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.wait(500);
      
      // Type partial hashtag that matches both
      cy.get('input[placeholder="Enter a new task..."]').first().type('Task #w');
      
      // Autocomplete should show
      cy.get('.MuiPaper-root').contains('#work').should('be.visible');
      cy.get('.MuiPaper-root').contains('#weekend').should('be.visible');
      
      // Press arrow down to select first item
      cy.get('input[placeholder="Enter a new task..."]').first().type('{downarrow}');
      
      // Press Enter to select
      cy.get('input[placeholder="Enter a new task..."]').first().type('{enter}');
      
      // Should have inserted the hashtag
      cy.get('input[placeholder="Enter a new task..."]').first().invoke('val').should('match', /#w(ork|eekend)/);
    });

    it('should hide suggestions when pressing Escape', () => {
      // Create a task with hashtag
      const existingTask = taskName('Task #urgent');
      cy.get('input[placeholder="Enter a new task..."]').first().type(existingTask);
      cy.contains('button', 'Add Task').click({ force: true });
      cy.wait(500);
      
      // Type partial hashtag
      cy.get('input[placeholder="Enter a new task..."]').first().type('New #urg');
      
      // Suggestions should appear
      cy.get('.MuiPaper-root').contains('#urgent').should('be.visible');
      
      // Press Escape
      cy.get('input[placeholder="Enter a new task..."]').first().type('{esc}');
      
      // Suggestions should be hidden
      cy.get('.MuiListItemButton-root').should('not.exist');
    });
  });
});
