import { Navigate, Outlet, useLocation } from "react-router-dom";

function ProtectedRoute() {
  const location = useLocation();

  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  const storedUser = localStorage.getItem("user");

  let user = null;

  try {
    user = storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    console.error("Invalid stored user:", error);
  }

  /*
   * User must have a valid login marker
   * and stored user information.
   */
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  /*
   * User is logged in.
   */
  return <Outlet />;
}

export default ProtectedRoute;
