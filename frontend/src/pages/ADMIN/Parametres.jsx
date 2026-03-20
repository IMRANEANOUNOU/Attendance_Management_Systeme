import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBar from "../../components/SideBar";
import "../../CSS/Dashboard.css";
import { Settings, Key, User, LogOut, Building2, Save, CheckCircle } from "lucide-react";

const ANNEE_DEFAULT = "2024 - 2025";

function Parametres() {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState("compte");

    // Mon compte - changer mot de passe
    const [pwdForm, setPwdForm] = useState({
        old_password: "",
        new_password: "",
        new_password_confirm: "",
    });
    const [pwdMessage, setPwdMessage] = useState({ type: "", text: "" });
    const [pwdLoading, setPwdLoading] = useState(false);

    // Admin - réinitialiser mot de passe utilisateur
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [adminPwdForm, setAdminPwdForm] = useState({ user_id: "", password: "" });
    const [adminPwdMessage, setAdminPwdMessage] = useState({ type: "", text: "" });
    const [adminPwdLoading, setAdminPwdLoading] = useState(false);

    // Année universitaire (stockée en localStorage pour l'instant)
    const [anneeUniv, setAnneeUniv] = useState(ANNEE_DEFAULT);
    const [anneeSaved, setAnneeSaved] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        const saved = localStorage.getItem("annee_universitaire");
        if (saved) setAnneeUniv(saved);
        fetchUtilisateurs();
    }, [navigate]);

    const fetchUtilisateurs = async () => {
        try {
            const res = await api.get("accounts/utilisateurs/");
            setUtilisateurs(Array.isArray(res.data) ? res.data : []);
        } catch {
            setUtilisateurs([]);
        }
    };

    const handleChangeMyPassword = async (e) => {
        e.preventDefault();
        if (pwdForm.new_password !== pwdForm.new_password_confirm) {
            setPwdMessage({ type: "error", text: "Les deux mots de passe ne correspondent pas." });
            return;
        }
        if (pwdForm.new_password.length < 8) {
            setPwdMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères." });
            return;
        }
        setPwdLoading(true);
        setPwdMessage({ type: "", text: "" });
        try {
            await api.post("accounts/password/change/", {
                old_password: pwdForm.old_password,
                new_password: pwdForm.new_password,
            });
            setPwdMessage({ type: "success", text: "Mot de passe modifié avec succès." });
            setPwdForm({ old_password: "", new_password: "", new_password_confirm: "" });
        } catch (err) {
            const data = err.response?.data;
            const msg = data?.old_password || data?.new_password || data?.error || "Erreur lors du changement.";
            setPwdMessage({ type: "error", text: Array.isArray(msg) ? msg.join(" ") : msg });
        } finally {
            setPwdLoading(false);
        }
    };

    const handleAdminResetPassword = async (e) => {
        e.preventDefault();
        if (!adminPwdForm.user_id || !adminPwdForm.password) {
            setAdminPwdMessage({ type: "error", text: "Sélectionnez un utilisateur et saisissez le nouveau mot de passe." });
            return;
        }
        if (adminPwdForm.password.length < 8) {
            setAdminPwdMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères." });
            return;
        }
        setAdminPwdLoading(true);
        setAdminPwdMessage({ type: "", text: "" });
        try {
            await api.post(`accounts/password/reset/admin/${adminPwdForm.user_id}/`, {
                password: adminPwdForm.password,
            });
            setAdminPwdMessage({ type: "success", text: "Mot de passe réinitialisé avec succès." });
            setAdminPwdForm({ user_id: "", password: "" });
        } catch (err) {
            const data = err.response?.data;
            const msg = data?.password || data?.error || "Erreur lors de la réinitialisation.";
            setAdminPwdMessage({ type: "error", text: Array.isArray(msg) ? msg.join(" ") : msg });
        } finally {
            setAdminPwdLoading(false);
        }
    };

    const handleSaveAnnee = () => {
        localStorage.setItem("annee_universitaire", anneeUniv);
        setAnneeSaved(true);
        setTimeout(() => setAnneeSaved(false), 2000);
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <div className="dashboard-container">
            <SideBar />
            <main className="main-content">
                <header className="page-header settings-header">
                    <div className="header-content">
                        <h1>Paramètres</h1>
                        <p>Gérez votre compte et les options de l'application</p>
                    </div>
                </header>

                <div className="content-wrapper settings-wrapper">
                    <nav className="settings-nav">
                        <button
                            className={`settings-nav-btn ${activeSection === "compte" ? "active" : ""}`}
                            onClick={() => setActiveSection("compte")}
                        >
                            <Key size={18} />
                            <span>Mon compte</span>
                        </button>
                        <button
                            className={`settings-nav-btn ${activeSection === "admin" ? "active" : ""}`}
                            onClick={() => setActiveSection("admin")}
                        >
                            <User size={18} />
                            <span>Réinitialiser mot de passe</span>
                        </button>
                        <button
                            className={`settings-nav-btn ${activeSection === "app" ? "active" : ""}`}
                            onClick={() => setActiveSection("app")}
                        >
                            <Building2 size={18} />
                            <span>Application</span>
                        </button>
                        <button
                            className={`settings-nav-btn ${activeSection === "session" ? "active" : ""}`}
                            onClick={() => setActiveSection("session")}
                        >
                            <LogOut size={18} />
                            <span>Session</span>
                        </button>
                    </nav>

                    <div className="settings-panels">
                        {activeSection === "compte" && (
                            <div className="settings-card">
                                <h2 className="settings-card-title">
                                    <Key size={22} />
                                    Changer mon mot de passe
                                </h2>
                                <form onSubmit={handleChangeMyPassword} className="settings-form">
                                    <div className="input-group">
                                        <label>Mot de passe actuel</label>
                                        <input
                                            type="password"
                                            value={pwdForm.old_password}
                                            onChange={(e) => setPwdForm((p) => ({ ...p, old_password: e.target.value }))}
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            value={pwdForm.new_password}
                                            onChange={(e) => setPwdForm((p) => ({ ...p, new_password: e.target.value }))}
                                            placeholder="••••••••"
                                            required
                                            minLength={8}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Confirmer le nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            value={pwdForm.new_password_confirm}
                                            onChange={(e) => setPwdForm((p) => ({ ...p, new_password_confirm: e.target.value }))}
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    {pwdMessage.text && (
                                        <div className={`settings-message ${pwdMessage.type}`}>
                                            {pwdMessage.type === "success" && <CheckCircle size={18} />}
                                            <span>{pwdMessage.text}</span>
                                        </div>
                                    )}
                                    <button type="submit" className="btn-primary-large" disabled={pwdLoading}>
                                        {pwdLoading ? "En cours..." : "Enregistrer le mot de passe"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeSection === "admin" && (
                            <div className="settings-card">
                                <h2 className="settings-card-title">
                                    <User size={22} />
                                    Réinitialiser le mot de passe d'un utilisateur
                                </h2>
                                <p className="settings-card-desc">En tant qu'administrateur, vous pouvez définir un nouveau mot de passe pour un utilisateur.</p>
                                <form onSubmit={handleAdminResetPassword} className="settings-form">
                                    <div className="input-group">
                                        <label>Utilisateur</label>
                                        <select
                                            value={adminPwdForm.user_id}
                                            onChange={(e) => setAdminPwdForm((p) => ({ ...p, user_id: e.target.value }))}
                                        >
                                            <option value="">Sélectionner un utilisateur</option>
                                            {utilisateurs.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {u.email} {u.role ? `(${u.role})` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Nouveau mot de passe</label>
                                        <input
                                            type="password"
                                            value={adminPwdForm.password}
                                            onChange={(e) => setAdminPwdForm((p) => ({ ...p, password: e.target.value }))}
                                            placeholder="••••••••"
                                            minLength={8}
                                        />
                                    </div>
                                    {adminPwdMessage.text && (
                                        <div className={`settings-message ${adminPwdMessage.type}`}>
                                            {adminPwdMessage.type === "success" && <CheckCircle size={18} />}
                                            <span>{adminPwdMessage.text}</span>
                                        </div>
                                    )}
                                    <button type="submit" className="btn-primary-large" disabled={adminPwdLoading}>
                                        {adminPwdLoading ? "En cours..." : "Réinitialiser le mot de passe"}
                                    </button>
                                </form>
                            </div>
                        )}

                        {activeSection === "app" && (
                            <div className="settings-card">
                                <h2 className="settings-card-title">
                                    <Building2 size={22} />
                                    Application
                                </h2>
                                <div className="settings-form">
                                    <div className="input-group">
                                        <label>Année universitaire</label>
                                        <div className="input-with-btn">
                                            <input
                                                type="text"
                                                value={anneeUniv}
                                                onChange={(e) => setAnneeUniv(e.target.value)}
                                                placeholder="Ex: 2024 - 2025"
                                            />
                                            <button type="button" className="btn-primary-large" onClick={handleSaveAnnee}>
                                                <Save size={18} />
                                                {anneeSaved ? "Enregistré" : "Enregistrer"}
                                            </button>
                                        </div>
                                        <span className="form-hint">Affichée dans les en-têtes des pages (stockage local).</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === "session" && (
                            <div className="settings-card">
                                <h2 className="settings-card-title">
                                    <LogOut size={22} />
                                    Session
                                </h2>
                                <p className="settings-card-desc">Déconnectez-vous de l'application. Vous devrez vous reconnecter pour continuer.</p>
                                <button type="button" className="btn-logout" onClick={handleLogout}>
                                    <LogOut size={20} />
                                    Se déconnecter
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style>{`
                .settings-header { margin-bottom: 2rem; }
                .header-content h1 { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
                .header-content p { color: #6b7280; margin: 4px 0 0 0; font-size: 14px; }
                .settings-wrapper { display: flex; gap: 24px; flex-wrap: wrap; }
                .settings-nav { display: flex; flex-direction: column; gap: 6px; min-width: 220px; }
                .settings-nav-btn { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border: 1px solid #e5e7eb; background: white; border-radius: 10px; cursor: pointer; font-size: 14px; color: #4b5563; text-align: left; transition: all 0.2s; }
                .settings-nav-btn:hover { background: #f9fafb; border-color: #4f46e5; color: #4f46e5; }
                .settings-nav-btn.active { background: #eef2ff; border-color: #4f46e5; color: #4f46e5; font-weight: 600; }
                .settings-panels { flex: 1; min-width: 320px; }
                .settings-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 20px; }
                .settings-card-title { display: flex; align-items: center; gap: 10px; margin: 0 0 16px 0; font-size: 18px; color: #111827; }
                .settings-card-desc { color: #6b7280; font-size: 14px; margin-bottom: 20px; }
                .settings-form { display: flex; flex-direction: column; gap: 16px; max-width: 400px; }
                .input-group label { display: block; font-size: 13px; font-weight: 500; color: #4b5563; margin-bottom: 6px; }
                .input-group input, .input-group select { width: 100%; padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 14px; box-sizing: border-box; }
                .input-group input:focus, .input-group select:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
                .form-hint { font-size: 12px; color: #9ca3af; margin-top: 6px; display: block; }
                .input-with-btn { display: flex; gap: 10px; align-items: center; }
                .input-with-btn input { flex: 1; }
                .settings-message { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px; font-size: 14px; }
                .settings-message.success { background: #d1fae5; color: #065f46; }
                .settings-message.error { background: #fee2e2; color: #991b1b; }
                .btn-primary-large { background: #4f46e5; color: white; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
                .btn-primary-large:hover:not(:disabled) { background: #4338ca; }
                .btn-primary-large:disabled { opacity: 0.7; cursor: not-allowed; }
                .btn-logout { display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; border-radius: 8px; font-weight: 500; cursor: pointer; }
                .btn-logout:hover { background: #fee2e2; }
            `}</style>
        </div>
    );
}

export default Parametres;
