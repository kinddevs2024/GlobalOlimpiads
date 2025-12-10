import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { USER_ROLES } from "../utils/constants";

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole) {
    // For ADMIN role, also allow OWNER (owner has admin privileges)
    if (requiredRole === USER_ROLES.ADMIN) {
      if (user.role !== USER_ROLES.ADMIN && user.role !== USER_ROLES.OWNER) {
        return <Navigate to="/dashboard" replace />;
      }
    } else {
      // For other roles, check exact match
      if (user.role !== requiredRole) {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
};

export default ProtectedRoute;
