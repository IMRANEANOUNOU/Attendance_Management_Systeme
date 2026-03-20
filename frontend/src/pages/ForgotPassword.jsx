import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import logo from "../assets/ESTE.png";
import "../CSS/Login.css";

function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");
        setError("");
        try {
            const response = await api.post("accounts/password-reset/", { email });
            setMessage(response.data.message);
        } catch (err) {
            setError(err.response?.data?.error || "Une erreur est survenue.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className="container standalone" id="container" style={{ minHeight: "400px" }}>
                <div className="form-container login-side" style={{ width: "100%", left: 0 }}>
                    <form onSubmit={handleSubmit}>
                        <img src={logo} alt="Logo" className="uni-logo-color" style={{ width: "120px", marginBottom: "20px" }} />
                        <h1>Mot de passe oublié</h1>
                        <p style={{ marginBottom: "20px", color: "#666" }}>
                            Entrez votre email institutionnel pour recevoir un lien de réinitialisation.
                        </p>

                        {message && <div style={{ color: "green", marginBottom: "15px", fontWeight: "600" }}>{message}</div>}
                        {error && <div style={{ color: "red", marginBottom: "15px", fontWeight: "600" }}>{error}</div>}

                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit" disabled={loading} style={{ marginTop: "20px" }}>
                            {loading ? "Envoi..." : "Envoyer le lien"}
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

export default ForgotPassword;
