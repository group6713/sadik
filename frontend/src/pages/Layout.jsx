import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

const ROLE_LABELS = {
  MUDIRA: "Mudira",
  POVOR: "Oshxona xodimi",
  TARBIYACHI: "Tarbiyachi",
  OTA_ONA: "Ota-ona",
};

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">🌾</span>
          <div>
            <div className="brand-name">MittiQadam</div>
            <div className="brand-sub">Boshqaruv tizimi</div>
          </div>
        </div>

        {(user.role === "MUDIRA" || user.role === "POVOR") && (
          <NavLink to="/ombor" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            Ombor
          </NavLink>
        )}
        {(user.role === "MUDIRA" || user.role === "POVOR") && (
          <NavLink to="/retsept" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            Kunlik retsept
          </NavLink>
        )}
        {user.role === "MUDIRA" && (
          <>
            <NavLink to="/taomnoma" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              Taomnoma
            </NavLink>
            <NavLink to="/mashgulotlar" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              Mashg'ulotlar
            </NavLink>
            <NavLink to="/norms" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              Me'yor jadvali
            </NavLink>
            <NavLink to="/branches" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              Filiallar
            </NavLink>
            <NavLink to="/users" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              Foydalanuvchilar
            </NavLink>
          </>
        )}
        {user.role === "TARBIYACHI" && (
          <NavLink to="/mashgulotlar" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            Mashg'ulotlar
          </NavLink>
        )}
        {user.role === "OTA_ONA" && (
          <NavLink to="/tez-orada" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            Bosh sahifa
          </NavLink>
        )}

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="name">{user.fullName}</div>
            <div className="role">{ROLE_LABELS[user.role] || user.role}</div>
          </div>
          <button className="logout-btn" onClick={logout}>Chiqish</button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
