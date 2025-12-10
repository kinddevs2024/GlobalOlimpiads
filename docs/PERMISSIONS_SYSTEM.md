# Permissions System Documentation

This document explains the new permissions system and how to use it to manage roles and permissions in the application.

## Overview

The permissions system provides a centralized way to manage user roles and their capabilities. It consists of two main files:

1. **`src/utils/permissions.js`** - Core permission definitions and checkers
2. **`src/utils/roleHelpers.js`** - Helper functions for common role-based operations

## Quick Start

### Import Functions

```javascript
import { 
  hasPermission, 
  canManageOlympiads, 
  canViewAllResults,
  isAdminOrOwner 
} from '../utils/permissions';

import { 
  canAccessRoute, 
  getNavigationItems,
  canEditResource 
} from '../utils/roleHelpers';
```

### Basic Usage

```javascript
// Check if user has a specific permission
if (hasPermission(user.role, 'manageOlympiads')) {
  // User can manage olympiads
}

// Check if user can access a route
if (canAccessRoute(user.role, '/admin')) {
  // Show admin link
}

// Check if user can edit a resource
if (canEditResource(user.role, 'olympiad')) {
  // Show edit button
}
```

## Available Functions

### Permission Checkers (`permissions.js`)

#### `hasPermission(role, permission)`
Check if a role has a specific permission.

```javascript
hasPermission('admin', 'manageOlympiads') // true
hasPermission('student', 'manageOlympiads') // false
```

#### `hasAnyPermission(role, permissions)`
Check if a role has any of the specified permissions.

```javascript
hasAnyPermission('resolter', ['manageQuestions', 'gradeEssays']) // true
```

#### `hasAllPermissions(role, permissions)`
Check if a role has all of the specified permissions.

```javascript
hasAllPermissions('admin', ['manageOlympiads', 'viewAnalytics']) // true
```

#### `getRolePermissions(role)`
Get all permissions for a role.

```javascript
getRolePermissions('admin')
// Returns: { manageOlympiads: true, manageQuestions: true, ... }
```

#### Specific Permission Checkers

- `canAccessAdminPanel(role)` - Check if user can access admin panel
- `canManageOlympiads(role)` - Check if user can manage olympiads
- `canManageQuestions(role)` - Check if user can manage questions
- `canGradeEssays(role)` - Check if user can grade essays
- `canViewAllResults(role)` - Check if user can view all results
- `hasSchoolScopedAccess(role)` - Check if user has school-scoped access
- `canChangeRoles(role)` - Check if user can change user roles
- `canViewAnalytics(role)` - Check if user can view analytics

#### Role Type Checkers

- `isAdminOrOwner(role)` - Check if user is admin or owner
- `isStudent(role)` - Check if user is a student
- `isResolter(role)` - Check if user is a resolter
- `isSchoolStaff(role)` - Check if user is school admin or teacher

#### Utility Functions

- `getRoleDisplayName(role)` - Get human-readable role name
- `getAllRoles()` - Get array of all available roles
- `isValidRole(role)` - Check if a role is valid

### Role Helpers (`roleHelpers.js`)

#### `canAccessRoute(role, route)`
Check if a role can access a specific route.

```javascript
canAccessRoute('admin', '/admin') // true
canAccessRoute('student', '/admin') // false
```

#### `getNavigationItems(role)`
Get navigation items available for a role.

```javascript
getNavigationItems('admin')
// Returns: [{ path: '/dashboard', label: 'Dashboard' }, ...]
```

#### `canEditResource(role, resourceType, resource)`
Check if user can edit a specific resource type.

```javascript
canEditResource('admin', 'olympiad') // true
canEditResource('student', 'olympiad') // false
```

#### `canDeleteResource(role, resourceType)`
Check if user can delete a specific resource type.

#### `canViewResource(role, resourceType, resource, currentUser)`
Check if user can view a specific resource (with ownership checks).

#### `filterResultsBySchoolScope(role, results, user)`
Filter results based on school-scoped access.

```javascript
const filteredResults = filterResultsBySchoolScope(
  user.role, 
  allResults, 
  user
);
```

#### `getRoleHierarchy(role)`
Get hierarchy level of a role (higher = more permissions).

#### `hasHigherOrEqualPermissions(role1, role2)`
Check if role1 has higher or equal permissions than role2.

## Adding New Roles

To add a new role, follow these steps:

### 1. Add Role to Constants

```javascript
// src/utils/constants.js
export const USER_ROLES = {
  // ... existing roles
  MODERATOR: "moderator", // New role
};
```

### 2. Define Permissions

```javascript
// src/utils/permissions.js
export const ROLE_PERMISSIONS = {
  // ... existing roles
  [USER_ROLES.MODERATOR]: {
    manageOlympiads: false,
    manageQuestions: true,
    gradeEssays: true,
    viewAllResults: true,
    changeRoles: false,
    viewAnalytics: false,
    schoolScoped: false,
    viewOwnResults: true,
    participateInOlympiads: false,
    moderateContent: true, // New permission
  },
};
```

### 3. Add Role Display Name

```javascript
// src/utils/permissions.js
export const getRoleDisplayName = (role) => {
  const roleNames = {
    // ... existing roles
    [USER_ROLES.MODERATOR]: 'Moderator',
  };
  return roleNames[role] || role;
};
```

### 4. Update Route Access (if needed)

```javascript
// src/utils/roleHelpers.js
export const canAccessRoute = (role, route) => {
  const routePermissions = {
    // ... existing routes
    '/moderator': role === USER_ROLES.MODERATOR,
  };
  // ...
};
```

### 5. Update Navigation (if needed)

```javascript
// src/utils/roleHelpers.js
export const getNavigationItems = (role) => {
  // ... existing code
  if (role === USER_ROLES.MODERATOR) {
    items.push({ path: '/moderator', label: 'Moderator Panel', show: true });
  }
  // ...
};
```

## Adding New Permissions

To add a new permission:

### 1. Add to All Roles

```javascript
// src/utils/permissions.js
export const ROLE_PERMISSIONS = {
  [USER_ROLES.STUDENT]: {
    // ... existing permissions
    newPermission: false,
  },
  [USER_ROLES.ADMIN]: {
    // ... existing permissions
    newPermission: true,
  },
  // ... update all roles
};
```

### 2. Create Helper Function (optional)

```javascript
// src/utils/permissions.js
export const canDoNewThing = (role) => {
  return hasPermission(role, 'newPermission');
};
```

### 3. Export in Constants (optional)

```javascript
// src/utils/constants.js
export { 
  // ... existing exports
  canDoNewThing,
} from './permissions';
```

## Example: Using in Components

### Before (Old Way)

```javascript
const isAdminOrOwner = user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.OWNER;
if (isAdminOrOwner) {
  // Show admin features
}
```

### After (New Way)

```javascript
import { isAdminOrOwner } from '../utils/permissions';

if (isAdminOrOwner(user?.role)) {
  // Show admin features
}
```

### Example: Conditional Rendering

```javascript
import { canManageOlympiads, canViewAnalytics } from '../utils/permissions';

function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div>
      {canManageOlympiads(user?.role) && (
        <button>Create Olympiad</button>
      )}
      
      {canViewAnalytics(user?.role) && (
        <AnalyticsWidget />
      )}
    </div>
  );
}
```

### Example: Filtering Results

```javascript
import { filterResultsBySchoolScope } from '../utils/roleHelpers';

function ResultsPage() {
  const { user } = useAuth();
  const [allResults, setAllResults] = useState([]);
  
  const visibleResults = filterResultsBySchoolScope(
    user?.role,
    allResults,
    user
  );
  
  return (
    <div>
      {visibleResults.map(result => (
        <ResultCard key={result._id} result={result} />
      ))}
    </div>
  );
}
```

## Benefits

1. **Centralized Management** - All permissions in one place
2. **Easy to Extend** - Simple to add new roles and permissions
3. **Type Safety** - Consistent permission checking across the app
4. **Maintainable** - Changes to permissions only need to be made in one place
5. **Testable** - Easy to test permission logic
6. **Documented** - Clear documentation of what each role can do

## Migration Guide

To migrate existing code to use the new permission system:

1. Replace direct role comparisons with permission checkers
2. Use `canAccessRoute()` instead of manual route checks
3. Use `filterResultsBySchoolScope()` for school-scoped filtering
4. Use `getNavigationItems()` for dynamic navigation

## Current Roles and Permissions

See `src/utils/permissions.js` for the complete list of roles and their permissions.

