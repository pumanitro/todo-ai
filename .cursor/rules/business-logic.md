# Business Logic Memory Bank

## Refactored Architecture (v23)

### Services Layer
- **TodoService** (`src/services/todoService.ts`) - Firebase operations (CRUD, listeners)
- All database operations centralized in static methods
- Handles batch updates and blocked task reference cleanup

### Utilities Layer
- **todoUtils.ts** - Business logic (categorization, ordering, hierarchy)
- **dateUtils.ts** - Date formatting functions
- **feedbackUtils.ts** - Audio/haptic feedback
- **linkUtils.tsx** - URL detection and rendering

### Custom Hooks
- **useTodos** - State management, auto-migration, notifications
- **useTodoOperations** - CRUD operations, drag-and-drop logic
- Extracted from monolithic TodoList component for better separation

### Component Responsibilities
- **TodoList** - UI orchestration and user interactions only
- Business logic delegated to services, utilities, and hooks
- Reduced from 825 lines to ~350 lines

### Key Patterns
- Service layer for data operations
- Custom hooks for state management
- Utility functions for business logic
- Component focused on UI rendering
- Consistent error handling across layers

## Data Model & Core Rules
- **Todo**: `{id, text, completed, timestamp, order, description?, category, dueDate?, blockedBy?}`
- **Categories**: `'today' | 'backlog' | 'postponed'`
- **Security**: Firebase auth required, user isolation enforced
- **Blocked tasks**: Hierarchical nesting, inherit parent category
- **Auto-migration**: Postponed→Today when due date arrives
- **Drag restrictions**: Blocked tasks not draggable independently

## PWA Cache Management
- Cache version: `todo-ai-v23` (updated for refactoring)
- Service worker handles offline functionality
- Always update cache version for significant code changes 