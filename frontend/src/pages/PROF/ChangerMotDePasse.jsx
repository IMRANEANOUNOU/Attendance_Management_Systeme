import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBarProf from "../../components/SideBarProf";
import "../../CSS/Dashboard.css";
import { Lock, Eye, EyeOff, Check, Loader2 } from "lucide-react";

function ChangerMotDePasse() {
    const navigate = useNavigate();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || role !== "PROF") { navigate("/login"); return; }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });

        if (!oldPassword || !newPassword || !confirmPassword) {
            setMessage({ type: "error", text: "Veuillez remplir tous les champs." });
            return;
        }
        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "Les nouveaux mots de passe ne correspondent pas." });
            return;
        }
        if (newPassword.length < 8) {
            setMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères." });
            return;
        }

        try {
            setLoading(true);
            await api.post("accounts/password/change/", {
                old_password: oldPassword,
                new_password: newPassword,
            });
            setMessage({ type: "success", text: "Mot de passe modifié avec succès !" });
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err) {
            const data = err.response?.data || {};
            const msg =
                data.old_password || data.new_password?.join(" ") || data.error || "Erreur lors du changement.";
            setMessage({ type: "error", text: typeof msg === "string" ? msg : JSON.stringify(msg) });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <SideBarProf />
            <main className="main-content">
                <header className="top-bar">
                    <div className="welcome-text">
                        <h1>Changer le mot de passe</h1>
                        <p>Modifiez votre mot de passe pour sécuriser votre compte</p>
                    </div>
                    <div className="avatar"><Lock size={22} color="white" /></div>
                </header>

                <div className="recent-activity" style={{ maxWidth: 520 }}>
                    <form onSubmit={handleSubmit} autoComplete="off">
                        {/* Old password */}
                        <div className="cp-field">
                            <label className="cp-label">Mot de passe actuel</label>
                            <div className="cp-input-wrap">
                                <input
                                    type={showOld ? "text" : "password"}
                                    className="cp-input"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <button type="button" className="cp-eye" onClick={() => setShowOld(!showOld)}>
                                    {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* New password */}
                        <div className="cp-field">
                            <label className="cp-label">Nouveau mot de passe</label>
                            <div className="cp-input-wrap">
                                <input
                                    type={showNew ? "text" : "password"}
                                    className="cp-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <button type="button" className="cp-eye" onClick={() => setShowNew(!showNew)}>
                                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm */}
                        <div className="cp-field">
                            <label className="cp-label">Confirmer le nouveau mot de passe</label>
                            <div className="cp-input-wrap">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    className="cp-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                                <button type="button" className="cp-eye" onClick={() => setShowConfirm(!showConfirm)}>
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button type="submit" className="cp-submit" disabled={loading}>
                            {loading ? (
                                <><Loader2 size={18} className="cp-spin" /> Enregistrement…</>
                            ) : (
                                <><Check size={18} /> Modifier le mot de passe</>
                            )}
                        </button>
                    </form>

                    {message.text && (
                        <div className={`cp-msg cp-msg--${message.type === "success" ? "success" : "error"}`} role="alert">
                            {message.text}
                        </div>
                    )}
                </div>
            </main>

            <style>{`
        .cp-field{margin-bottom:20px;}
        .cp-label{display:block;font-size:13px;font-weight:600;color:var(--text-gray);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;}
        .cp-input-wrap{position:relative;}
        .cp-input{width:100%;padding:12px 44px 12px 14px;border:2px solid #e5e7eb;border-radius:10px;font-size:15px;color:var(--text-dark);transition:.2s;outline:none;box-sizing:border-box;}
        .cp-input:focus{border-color:var(--primary-color);box-shadow:0 0 0 3px rgba(79,70,229,.1);}
        .cp-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-gray);padding:4px;}
        .cp-eye:hover{color:var(--text-dark);}

        .cp-submit{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:linear-gradient(135deg,#4f46e5 0%,#4338ca 100%);color:#fff;border:none;border-radius:10px;font-weight:600;font-size:15px;cursor:pointer;box-shadow:0 4px 14px rgba(79,70,229,.25);transition:.2s;margin-top:8px;}
        .cp-submit:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(79,70,229,.35);}
        .cp-submit:disabled{opacity:.7;cursor:not-allowed;}

        .cp-msg{padding:14px 18px;border-radius:10px;margin-top:20px;font-size:14px;font-weight:500;}
        .cp-msg--success{background:#d1fae5;color:#065f46;}
        .cp-msg--error{background:#fee2e2;color:#991b1b;}

        .cp-spin{animation:cp-rotate .8s linear infinite;}
        @keyframes cp-rotate{to{transform:rotate(360deg);}}
      `}</style>
        </div>
    );
}

export default ChangerMotDePasse;
