import { USER_ROLES } from './constants';

/**
 * Permission definitions for each role
 * This makes it easy to add new roles and permissions
 */
export const ROLE_PERMISSIONS = {
  [USER_ROLES.STUDENT]: {
    manageOlympiads: false,
    manageQuestions: false,
    gradeEssays: false,
    viewAllResults: false,
    changeRoles: false,
    viewAnalytics: false,
    schoolScoped: false,
    viewOwnResults: true,
    participateInOlympiads: true,
  },
  [USER_ROLES.ADMIN]: {
    manageOlympiads: true,
    manageQuestions: true,
    gradeEssays: true,
    viewAllResults: true,
    changeRoles: false,
    viewAnalytics: true,
    schoolScoped: true,
    viewOwnResults: true,
    participateInOlympiads: false,
    monitorStudents: true, // Can view real-time monitoring
  },
  [USER_ROLES.OWNER]: {
    manageOlympiads: true,
    manageQuestions: true,
    gradeEssays: true,
    viewAllResults: true,
    changeRoles: true,
    viewAnalytics: true,
    schoolScoped: true,
    viewOwnResults: true,
    participateInOlympiads: false,
    monitorStudents: true, // Can view real-time monitoring
  },
  [USER_ROLES.RESOLTER]: {
    manageOlympiads: false,
    manageQuestions: true,
    gradeEssays: true,
    viewAllResults: true, // school-scoped
    changeRoles: false,
    viewAnalytics: false,
    schoolScoped: true,
    viewOwnResults: true,
    participateInOlympiads: false,
  },
  [USER_ROLES.SCHOOL_ADMIN]: {
    manageOlympiads: false,
    manageQuestions: false,
    gradeEssays: false,
    viewAllResults: true, // school-scoped
    changeRoles: false,
    viewAnalytics: false,
    schoolScoped: true,
    viewOwnResults: true,
    participateInOlympiads: false,
    monitorStudents: true, // Can view real-time captures from their school
  },
  [USER_ROLES.SCHOOL_TEACHER]: {
    manageOlympiads: false,
    manageQuestions: false,
    gradeEssays: false,
    viewAllResults: true, // school-scoped
    changeRoles: false,
    viewAnalytics: false,
    schoolScoped: true,
    viewOwnResults: true,
    participateInOlympiads: false,
    monitorStudents: true, // Can view real-time captures
  },
};

/**
 * Check if a user has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (role, permission) => {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions[permission] === true : false;
};

/**
 * Check if user has any of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAnyPermission = (role, permissions) => {
  return permissions.some(permission => hasPermission(role, permission));
};

/**
 * Check if user has all of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export const hasAllPermissions = (role, permissions) => {
  return permissions.every(permission => hasPermission(role, permission));
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {object} Object with all permissions for the role
 */
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || {};
};

/**
 * Check if user can access admin panel
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canAccessAdminPanel = (role) => {
  return hasAnyPermission(role, ['manageOlympiads', 'manageQuestions']);
};

/**
 * Check if user can manage olympiads
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canManageOlympiads = (role) => {
  return hasPermission(role, 'manageOlympiads');
};

/**
 * Check if user can manage questions
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canManageQuestions = (role) => {
  return hasPermission(role, 'manageQuestions');
};

/**
 * Check if user can grade essays
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canGradeEssays = (role) => {
  return hasPermission(role, 'gradeEssays');
};

/**
 * Check if user can view all results
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canViewAllResults = (role) => {
  return hasPermission(role, 'viewAllResults');
};

/**
 * Check if user has school-scoped access
 * @param {string} role - User role
 * @returns {boolean}
 */
export const hasSchoolScopedAccess = (role) => {
  return hasPermission(role, 'schoolScoped');
};

/**
 * Check if user can change roles
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canChangeRoles = (role) => {
  return hasPermission(role, 'changeRoles');
};

/**
 * Check if user can view analytics
 * @param {string} role - User role
 * @returns {boolean}
 */
export const canViewAnalytics = (role) => {
  return hasPermission(role, 'viewAnalytics');
};

/**
 * Check if user is admin or owner
 * @param {string} role - User role
 * @returns {boolean}
 */
export const isAdminOrOwner = (role) => {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.OWNER;
};

/**
 * Check if user is a student
 * @param {string} role - User role
 * @returns {boolean}
 */
export const isStudent = (role) => {
  return role === USER_ROLES.STUDENT;
};

/**
 * Check if user is a resolter
 * @param {string} role - User role
 * @returns {boolean}
 */
export const isResolter = (role) => {
  return role === USER_ROLES.RESOLTER;
};

/**
 * Check if user is a school staff (admin or teacher)
 * @param {string} role - User role
 * @returns {boolean}
 */
export const isSchoolStaff = (role) => {
  return role === USER_ROLES.SCHOOL_ADMIN || role === USER_ROLES.SCHOOL_TEACHER;
};

/**
 * Get role display name
 * @param {string} role - User role
 * @returns {string} Display name for the role
 */
export const getRoleDisplayName = (role) => {
  const roleNames = {
    [USER_ROLES.STUDENT]: 'Student',
    [USER_ROLES.ADMIN]: 'Administrator',
    [USER_ROLES.OWNER]: 'Owner',
    [USER_ROLES.RESOLTER]: 'Resolter',
    [USER_ROLES.SCHOOL_ADMIN]: 'School Administrator',
    [USER_ROLES.SCHOOL_TEACHER]: 'School Teacher',
  };
  return roleNames[role] || role;
};

/**
 * Get all available roles
 * @returns {string[]} Array of all role values
 */
export const getAllRoles = () => {
  return Object.values(USER_ROLES);
};

/**
 * Check if a role is valid
 * @param {string} role - Role to validate
 * @returns {boolean}
 */
export const isValidRole = (role) => {
  return getAllRoles().includes(role);
};

