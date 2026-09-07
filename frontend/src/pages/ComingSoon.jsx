import { useAuth } from "../auth/AuthContext.jsx";

const MESSAGES = {
  OTA_ONA: "Farzandingizning bog'chadagi kuni haqida ma'lumotlar tez orada shu yerda ko'rinadi.",
};

export default function ComingSoon() {
  const { user } = useAuth();
  return (
    <div>
      <div className="content-header">
        <div>
          <h1>Xush kelibsiz, {user.fullName}</h1>
          <p>{MESSAGES[user.role] || "Bu bo'lim tez orada tayyor bo'ladi."}</p>
        </div>
      </div>
      <div className="panel">
        <p className="empty-state">Hozircha bu rol uchun modul ishlab chiqilmoqda.</p>
      </div>
    </div>
  );
}
