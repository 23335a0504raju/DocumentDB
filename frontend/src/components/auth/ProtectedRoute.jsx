// src/components/auth/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  console.log("ProtectedRoute token:", token); // 👈 debug

  // If NOT logged in → force to /login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If logged in → show the page
  return children;
}

export default ProtectedRoute;
