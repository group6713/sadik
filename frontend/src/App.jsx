import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Layout from "./pages/Layout.jsx";
import Ombor from "./pages/Ombor.jsx";
import Norms from "./pages/Norms.jsx";
import Branches from "./pages/Branches.jsx";
import Users from "./pages/Users.jsx";
import Taomnoma from "./pages/Taomnoma.jsx";
import Retsept from "./pages/Retsept.jsx";
import Mashgulotlar from "./pages/Mashgulotlar.jsx";
import ComingSoon from "./pages/ComingSoon.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (user.role === "TARBIYACHI") return <Navigate to="/mashgulotlar" replace />;
  if (user.role === "OTA_ONA") return <Navigate to="/tez-orada" replace />;
  return <Navigate to="/ombor" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomeRedirect />} />
        <Route
          path="ombor"
          element={
            <RoleRoute roles={["MUDIRA", "POVOR"]}>
              <Ombor />
            </RoleRoute>
          }
        />
        <Route
          path="norms"
          element={
            <RoleRoute roles={["MUDIRA"]}>
              <Norms />
            </RoleRoute>
          }
        />
        <Route
          path="taomnoma"
          element={
            <RoleRoute roles={["MUDIRA"]}>
              <Taomnoma />
            </RoleRoute>
          }
        />
        <Route
          path="retsept"
          element={
            <RoleRoute roles={["MUDIRA", "POVOR"]}>
              <Retsept />
            </RoleRoute>
          }
        />
        <Route
          path="mashgulotlar"
          element={
            <RoleRoute roles={["MUDIRA", "TARBIYACHI"]}>
              <Mashgulotlar />
            </RoleRoute>
          }
        />
        <Route
          path="branches"
          element={
            <RoleRoute roles={["MUDIRA"]}>
              <Branches />
            </RoleRoute>
          }
        />
        <Route
          path="users"
          element={
            <RoleRoute roles={["MUDIRA"]}>
              <Users />
            </RoleRoute>
          }
        />
        <Route path="tez-orada" element={<ComingSoon />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
