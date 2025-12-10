import { USER_ROLES } from './constants';
import {
  hasPermission,
  canAccessAdminPanel,
  canManageOlympiads,
  canManageQuestions,
  canGradeEssays,
  canViewAllResults,
  hasSchoolScopedAccess,
  canChangeRoles,
  canViewAnalytics,
  isAdminOrOwner,
  isStudent,
  isResolter,
  isSchoolStaff,
  getRoleDisplayName,
} from './permissions';

/**
 * Role helper functions for common role checks
 * These provide convenient shortcuts for checking user capabilities
 */

/**
 * Check if user can access a specific route
 * @param {string} role - User role
 * @param {string} route - Route path
 * @returns {boolean}
 */
export const canAccessRoute = (role, route) => {
  if (!role) return false;

  const routePermissions = {
    '/admin': canAccessAdminPanel(role),
    '/owner': role === USER_ROLES.OWNER,
    '/resolter': role === USER_ROLES.RESOLTER,
    '/school-teacher': role === USER_ROLES.SCHOOL_TEACHER,
    '/dashboard': true, // All authenticated users can access dashboard
    '/profile': true, // All authenticated users can access profile
    '/results': true, // All authenticated users can access results
  };

  return routePermissions[route] !== undefined ? routePermissions[route] : true;
};

/**
 * Get navigation items available for a role
 * @param {string} role - User role
 * @returns {Array} Array of navigation items
 */
export const getNavigationItems = (role) => {
  const items = [
    { path: '/dashboard', label: 'Dashboard', show: true },
  ];

  if (canAccessAdminPanel(role)) {
    items.push({ path: '/admin', label: 'Admin Panel', show: true });
  }

  if (role === USER_ROLES.OWNER) {
    items.push({ path: '/owner', label: 'Owner Panel', show: true });
  }

  if (role === USER_ROLES.RESOLTER) {
    items.push({ path: '/resolter', label: 'Resolter Panel', show: true });
  }

  if (role === USER_ROLES.SCHOOL_TEACHER) {
    items.push({ path: '/school-teacher', label: 'Teacher Panel', show: true });
  }

  items.push(
    { path: '/results', label: 'Results', show: true },
    { path: '/profile', label: 'Profile', show: true }
  );

  return items.filter(item => item.show);
};

/**
 * Check if user can edit a specific resource
 * @param {string} role - User role
 * @param {string} resourceType - Type of resource (olympiad, question, result, etc.)
 * @param {object} resource - Resource object (optional, for ownership checks)
 * @returns {boolean}
 */
export const canEditResource = (role, resourceType, resource = null) => {
  switch (resourceType) {
    case 'olympiad':
      return canManageOlympiads(role);
    case 'question':
      return canManageQuestions(role);
    case 'result':
      return canGradeEssays(role) || isAdminOrOwner(role);
    case 'user':
      return canChangeRoles(role);
    default:
      return false;
  }
};

/**
 * Check if user can delete a specific resource
 * @param {string} role - User role
 * @param {string} resourceType - Type of resource
 * @returns {boolean}
 */
export const canDeleteResource = (role, resourceType) => {
  switch (resourceType) {
    case 'olympiad':
      return canManageOlympiads(role);
    case 'question':
      return canManageQuestions(role);
    case 'user':
      return canChangeRoles(role);
    default:
      return false;
  }
};

/**
 * Check if user can view a specific resource
 * @param {string} role - User role
 * @param {string} resourceType - Type of resource
 * @param {object} resource - Resource object (for ownership checks)
 * @param {object} currentUser - Current user object
 * @returns {boolean}
 */
export const canViewResource = (role, resourceType, resource = null, currentUser = null) => {
  switch (resourceType) {
    case 'olympiad':
      // Students can view published olympiads, admins can view all
      return true;
    case 'result':
      // Users can view their own results, admins/resolters can view all
      if (canViewAllResults(role)) return true;
      if (resource && currentUser) {
        return resource.userId === currentUser._id || resource.user?._id === currentUser._id;
      }
      return false;
    case 'analytics':
      return canViewAnalytics(role);
    default:
      return true;
  }
};

/**
 * Filter results based on user's school-scoped access
 * @param {string} role - User role
 * @param {Array} results - Array of results
 * @param {object} user - Current user object
 * @returns {Array} Filtered results
 */
export const filterResultsBySchoolScope = (role, results, user) => {
  if (!hasSchoolScopedAccess(role) || isAdminOrOwner(role)) {
    return results; // No filtering needed
  }

  const userSchoolId = user?.schoolId || user?.school?.schoolId;
  const userSchoolName = user?.schoolName || user?.school?.schoolName;

  if (!userSchoolId && !userSchoolName) {
    return []; // No school info, return empty
  }

  return results.filter((result) => {
    const resultSchoolId = result.user?.schoolId || result.schoolId;
    const resultSchoolName = result.user?.schoolName || result.schoolName;
    
    return (
      (userSchoolId && resultSchoolId && userSchoolId === resultSchoolId) ||
      (userSchoolName && resultSchoolName && userSchoolName === resultSchoolName)
    );
  });
};

/**
 * Get role hierarchy level (higher number = more permissions)
 * @param {string} role - User role
 * @returns {number} Hierarchy level
 */
export const getRoleHierarchy = (role) => {
  const hierarchy = {
    [USER_ROLES.STUDENT]: 1,
    [USER_ROLES.SCHOOL_TEACHER]: 2,
    [USER_ROLES.SCHOOL_ADMIN]: 3,
    [USER_ROLES.RESOLTER]: 4,
    [USER_ROLES.ADMIN]: 5,
    [USER_ROLES.OWNER]: 6,
  };
  return hierarchy[role] || 0;
};

/**
 * Check if role1 has higher or equal permissions than role2
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean}
 */
export const hasHigherOrEqualPermissions = (role1, role2) => {
  return getRoleHierarchy(role1) >= getRoleHierarchy(role2);
};

/**
 * Export all permission checkers for convenience
 */
export {
  hasPermission,
  canAccessAdminPanel,
  canManageOlympiads,
  canManageQuestions,
  canGradeEssays,
  canViewAllResults,
  hasSchoolScopedAccess,
  canChangeRoles,
  canViewAnalytics,
  isAdminOrOwner,
  isStudent,
  isResolter,
  isSchoolStaff,
  getRoleDisplayName,
};

