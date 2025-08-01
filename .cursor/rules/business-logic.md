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

## Data Model
- **Todo**: `{id, text, completed, timestamp, order, description?, category, dueDate?, blockedBy?, completedAt?}`
- **Categories**: `'today' | 'backlog' | 'postponed'`
- **User Data**: Firebase path `users/${uid}/todos/`
- **Due Date**: ISO date string (YYYY-MM-DD), optional field
- **Blocked By**: Task ID that this task is blocked by, creates hierarchical nesting
- **Completed At**: Timestamp when task was completed, set on completion and cleared on uncomplete

## Security & Authentication
- **Authentication**: Required for all database operations (`auth != null`)
- **User Isolation**: Users can only access their own data (`$uid === auth.uid`)
- **Dual Auth Methods**: Google OAuth and Email/Password authentication supported
- **Email Auth**: Registration with email validation, password strength requirements (min 6 chars)
- **Password Reset**: Forgot password functionality with email-based reset links
- **Auth Error Handling**: Specific Firebase error codes handled with user-friendly messages
- **Form Validation**: Client-side validation before Firebase auth calls
- **Loading States**: UI disabled during authentication to prevent double submissions
- **Remember Me**: Dual persistence - Firebase auth persistence (browserLocalPersistence vs browserSessionPersistence) + form field persistence (localStorage for email/password)

## Core Rules
- New todos → auto-categorized by due date logic
- Completed todos → keep current category, move to bottom with `order = minCompletedOrder - 1`  
- Uncompleted todos → recategorize by due date logic with `order = minCategoryOrder - 1`
- Sorting: Primary by `order` ASC, secondary by `timestamp` DESC
- **Blocked tasks** → appear nested under their blocking task, not draggable independently

## Task Nesting & Dependencies
- **Blocked By**: Tasks can be blocked by other tasks via dropdown selection in drawer
- **Hierarchical Display**: Blocked tasks appear indented under their blocking task with visual connectors
- **Category Inheritance**: Blocked tasks automatically inherit parent's category when blocking relationship is created
- **Drag Restrictions**: Blocked tasks cannot be dragged (isDraggable=false)
- **Circular Prevention**: Tasks cannot block themselves or create circular dependencies
- **Scope Filters**: Only active (non-completed), non-nested parent tasks can block others
- **Dropdown Grouping**: Blocked By dropdown shows tasks grouped by TODAY, BACKLOG & POSTPONED categories with proper ordering
- **Nesting Implementation**: All sections (Today, Backlog, Postponed) use consistent hierarchical organization pattern

## Due Date Categorization
- **No due date** → backlog category
- **Due today or overdue** → today category
- **Due in future** → postponed category
- **Due date changes** → automatic recategorization + reordering

## State Management
- Firebase Realtime Database for persistence
- React state with real-time sync via `onValue()`
- User authentication via Firebase Auth
- **Auto-Migration**: On data load, postponed tasks due today automatically move to Today category with user notification
- **Hierarchical Auto-Migration**: When parent tasks are auto-migrated, their blocked children automatically move with them (same logic as drag-and-drop)
- **State Sync Fix**: Auto-migration updates both Firebase and local state optimistically to prevent UI lag
- **Auto-Migration Animation**: Tasks moving from postponed to today show simple shake animation and light blue border highlight

## Key Operations
- **Add**: Auto-categorize by due date, `order = minCategoryOrder - 1`
- **Toggle**: Update completed status + reorder + category logic + **blocked children handling** + **audio/haptic feedback on completion**
- **Drag**: Update category + calculate new order based on position (blocked tasks exempt)
- **Edit**: Update text/description/dueDate/blockedBy + auto-recategorize on due date change
- **Delete**: Remove from Firebase + close any open drawers + clear any blockedBy references

## Blocked Task Completion Flow
- **Parent Completion**: When task with blocked children is completed → all children move to backlog
- **Animation**: 1-second visual transition with scale, shadow, and color changes for blocked task movements
- **Relationship Cleanup**: Clear `blockedBy` references when moving children to backlog
- **Notification**: Show user feedback about moved tasks with parent task name

## Animation System
- **Auto-Migration**: Simple shake animation with light blue border highlight for postponed→today moves
- **Blocked Task Movement**: Scale and shadow transitions for blocked children moving to backlog
- **Task Creation**: BounceIn animation using animate.css when new tasks are added via `addTodo`
- **Task Completion**: BackOutDown animation using animate.css when tasks are marked as completed (visual completion happens immediately, then animates out)
- **Task Uncomplete**: BackOutUp animation using animate.css when completed tasks are unchecked (Firebase update happens after 300ms delay to ensure animation visibility and proper categorization)
- **Animation Tracking**: `newTaskIds`, `completingTaskIds`, and `uncompletingTaskIds` Sets in useTodos hook track animation states
- **Duration**: 0.8-second shake animation with ease-in-out easing, 1-second timeout for animate.css animations
- **Library**: animate.css for bounceIn/backOutDown/backOutUp effects with fallback for unsupported browsers
- **Timing Fix**: Uncomplete operations update Firebase after 300ms delay to ensure animation visibility while maintaining proper categorization

## Feedback System
- **Audio Feedback**: Pleasant completion sound using task-completed.mp3 file with Web Audio API fallback
- **Reverse Audio Feedback**: Backwards completion sound using Web Audio API when uncompleting tasks
- **Haptic Feedback**: Short-long-short vibration pattern on mobile devices for completion
- **Reverse Haptic Feedback**: Long-short-long vibration pattern on mobile devices for uncompleting
- **Completion Trigger**: Audio and haptic feedback when completing tasks
- **Uncomplete Trigger**: Reverse audio and reverse haptic feedback when uncompleting tasks
- **Fallback**: Graceful degradation on unsupported devices with synthesized beep sounds

## UI Layout Structure
- **Card 1**: Today + Backlog sections (main active tasks, primary focus) with nested blocked tasks
- **Card 2**: Postponed tasks (separate card, collapsible by date groups)
- **Completed tasks**: No card wrapper, reduced visibility with opacity 0.7 (hover to full opacity)

## UI Flow
- Today section → active tasks for current day + overdue tasks + their blocked subtasks
- Postponed section → tasks with future due dates, grouped by date (collapsible, hidden by default)
- Backlog section → tasks without due dates + their blocked subtasks
- Completed section → finished tasks (collapsed)
- Drawer → detailed view/edit for selected todo + blockedBy dropdown

## Task Hierarchy Display
- **Parent Tasks**: Display normally with full drag functionality
- **Blocked Tasks**: Indented 3 units (ml: 3) under parent with visual connectors
- **Visual Connectors**: Vertical line (left border) + horizontal lines connecting to parent
- **Blocked Task Indicators**: Cannot be dragged, managed only via blockedBy field

## Postponed Tasks Grouping
- **Date Grouping**: Group postponed parent tasks by due date, nearest dates first
- **Group Sorting**: Today → Tomorrow → Future dates (chronological) → No Date (last)
- **Date Labels**: "Today", "Tomorrow", or "DD.MM.YYYY" format
- **Task Count**: Show count per date group in parentheses
- **Visual Hierarchy**: Subtitle1 typography for group headers, proper spacing between groups
- **Nesting Priority**: Blocked tasks appear under their parent regardless of their own due date/category
- **Consistent Implementation**: Uses same hierarchical organization pattern as NestedTodoSection for all sections

## UI Design Pattern
- **Card Layout**: Enhanced shadows for better contrast (multi-layer shadows + subtle border)
- **Section Grouping**: Related sections (Today+Backlog) grouped in single cards
- **Visibility Hierarchy**: Completed tasks less prominent with reduced opacity
- **Compact Layout**: Reduced spacing, small components (py: 0.5, mb: 1-2)
- **Todo Items**: Bordered boxes with due date chips and "Drag to reorder" text
- **Due Date Display**: Color-coded chips (error=overdue, warning=today, info=soon)
- **Typography**: body2 for items, small icons, reduced font sizes
- **Flexbox Positioning**: Use justify-content/align-items instead of absolute positioning
- **User Header**: Minimal design with avatar in top-right corner, connection status dot (green/orange), dropdown menu for logout, ULTRAFOCUS editable field

## Mobile UI Pattern
- **Add Task Form**: Hidden on mobile (`isMobile` breakpoint detection)
- **Floating Action Button (FAB)**: Fixed position bottom-right corner, only visible on mobile
- **Bottom Drawer**: SwipeableDrawer from bottom when FAB clicked, contains AddTodoForm
- **Auto-Close**: Drawer closes automatically after task creation
- **Responsive Breakpoint**: `theme.breakpoints.down('sm')` for mobile detection

## Text Rendering & Links
- **URL Detection**: Automatic detection of HTTP/HTTPS URLs in task names and descriptions using regex
- **Phone Number Detection**: Automatic detection of phone numbers in various formats (international, with/without separators)
- **Clickable Links**: URLs converted to blue clickable links that open in new tab (target="_blank")
- **Click-to-Call**: Phone numbers converted to clickable tel: links for mobile calling functionality
- **Phone Validation**: Smart validation to avoid matching random numbers (7-15 digits, international format support)
- **Link Truncation**: Long URLs displayed with max 65 characters + "..." for clean UI
- **Click Prevention**: Link clicks use stopPropagation to prevent task selection when clicking links
- **Preview Mode**: Task descriptions show rendered preview with clickable links below edit field
- **Consistent Styling**: Links use primary theme color with underline decoration

## Progressive Web App (PWA) Features
- **Service Worker**: `public/sw.js` caches resources for offline functionality
- **Web App Manifest**: `public/manifest.json` defines app metadata and behavior
- **Installation**: PWAInstallPrompt component handles browser install prompts
- **Offline Support**: Cached resources allow basic functionality without network
- **App Icons**: 192x192 and 512x512 PNG icons for various devices and platforms
- **Standalone Mode**: App runs without browser UI when installed
- **Theme Integration**: PWA theme colors match Material-UI theme
- **App Shortcuts**: Manifest defines quick actions for installed app
- **SEO Optimized**: Comprehensive meta tags, Open Graph, and Twitter Card support
- **Branding**: "Todo Flow - Make it happen" branding across all PWA surfaces

## ULTRAFOCUS Feature
- **User Focus Field**: Editable text field in header for user's current focus/goal
- **Firebase Storage**: Saved per user at `users/${uid}/ultraFocus` path
- **Click to Edit**: Display mode shows text, click transforms to editable input
- **Auto-Save**: Saves to Firebase on blur or Enter key press
- **Auto-Capitalization**: All text automatically converted to uppercase
- **Clear Functionality**: Clear button (X) appears when text exists, removes from Firebase
- **Keyboard Shortcuts**: Enter saves, Escape cancels edit
- **Motivational UI**: Incentivizing placeholder and caption text to encourage usage
- **Visual Feedback**: Color changes, tooltips, and emojis for better UX

## PWA Cache Management
- Cache version: `todo-flow-v33` (updated for enhanced ULTRAFOCUS with clear/reset)
- Service worker handles offline functionality
- Always update cache version for significant code changes 