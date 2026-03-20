import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/axios";
import logo from "../assets/ESTE.png";
import "../CSS/Login.css";

function ResetPassword() {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);
        setMessage("");
        setError("");
        setFieldErrors({});

        try {
            const response = await api.post(`accounts/password-reset-confirm/${uid}/${token}/`, {
                new_password: password
            });
            setMessage(response.data.message);
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err) {
            if (err.response?.data?.errors) {
                setFieldErrors(err.response.data.errors);
            } else {
                setError(err.response?.data?.error || "Le lien est invalide ou a expiré.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="container standalone" id="container" style={{ minHeight: "500px" }}>
                <div className="form-container login-side" style={{ width: "100%", left: 0 }}>
                    <form onSubmit={handleSubmit}>
                        <img src={logo} alt="Logo" className="uni-logo-color" style={{ width: "120px", marginBottom: "20px" }} />
                        <h1>Réinitialisation</h1>
                        <p style={{ marginBottom: "20px", color: "#666" }}>
                            Choisissez un nouveau mot de passe sécurisé.
                        </p>

                        {message && <div style={{ color: "green", marginBottom: "15px", fontWeight: "600" }}>{message}</div>}
                        {error && <div style={{ color: "red", marginBottom: "15px", fontWeight: "600" }}>{error}</div>}

                        <input
                            type="password"
                            placeholder="Nouveau mot de passe"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        {fieldErrors.new_password && (
                            <div style={{ color: "red", fontSize: "12px", textAlign: "left", width: "100%" }}>
                                {fieldErrors.new_password.join(" ")}
                            </div>
                        )}

                        <input
                            type="password"
                            placeholder="Confirmer le mot de passe"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />

                        <button type="submit" disabled={loading} style={{ marginTop: "20px" }}>
                            {loading ? "Réinitialisation..." : "Enregistrer"}
                        </button>

                        <Link to="/login" style={{ marginTop: "20px", color: "#512da8", fontWeight: "600" }}>
                            Retour à la connexion
                        </Link>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;
