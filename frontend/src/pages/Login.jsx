import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../CSS/Login.css";
import logo from "../assets/ESTE.png";
import api from "../api/axios";

function Login() {
    const [isActive, setIsActive] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post("accounts/login/", {
                email: email,
                password: password
            });

            const {
                token,
                id,
                email: userEmail,
                role,
                full_name,
                is_chef_departement,
                is_chef_filiere,
                departement_id,
                filiere_id,
                is_first_login,
            } = response.data;

            localStorage.setItem("token", token);
            localStorage.setItem("user_id", id);
            localStorage.setItem("email", userEmail);
            localStorage.setItem("role", role);
            localStorage.setItem("full_name", full_name);
            localStorage.setItem("is_first_login", String(!!is_first_login));

            if (role === "PROF") {
                localStorage.setItem("is_chef_departement", String(!!is_chef_departement));
                localStorage.setItem("is_chef_filiere", String(!!is_chef_filiere));
                if (departement_id) localStorage.setItem("departement_id", String(departement_id));
                if (filiere_id) localStorage.setItem("filiere_id", String(filiere_id));
            }

            if (role === "PROF") {
                navigate("/prof/dashboard");
            } else if (role === "ETUDIANT") {
                navigate("/etudiant/dashboard");
            } else {
                navigate("/admin/dashboard");
            }
        } catch (error) {
            if (error.response && error.response.data) {
                const d = error.response.data;
                const msg = d.error || d["FATAL ERROR"] || d.FATAL_ERROR || (typeof d === "string" ? d : "Login Failed");
                alert(Array.isArray(msg) ? msg.join(" ") : msg);
            } else {
                alert("Login Failed: Server not responding.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className={`container ${isActive ? "active" : ""}`} id="container">

                {/* <div className="form-container info-side">
                    <div className="info-content">
                        <h1>Support Portal</h1>
                        <p>Need help with your student account?</p>

                        <div className="links-group">
                            <a href="#reset">Reset Password</a>
                            <a href="#guide">Student Guide</a>
                            <a href="#contact">IT Support</a>
                        </div>

                        <button className="ghost-dark" onClick={() => setIsActive(false)}>
                            Back to Login
                        </button>
                    </div>
                </div> */}


                <div className="form-container login-side">
                    <form onSubmit={handleLogin}>
                        {/* <img src={logo} alt="ESTE Logo" className="uni-logo-color" /> */}
                        <h1>Sign In</h1>
                        <span>Use your institutional email</span>
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Link to="/forgot-password" data-id="forgot-password-link" className="forgot">Forgot your password?</Link>
                        <button type="submit" disabled={loading}>
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                </div>


                <div className="toggle-container">
                    <div className="toggle">
                        {/* 
                        <div className="toggle-panel toggle-left">
                            <img src={logo} alt="University Logo" className="uni-logo-white" />

                            <h1>Secure Access</h1>
                            <p>Authorized personnel and students only.</p>
                            <button className="hidden" onClick={() => setIsActive(false)}>Sign In</button>
                        </div> */}
                        <div className="toggle-panel toggle-right">
                            <img src={logo} alt="Logo" className="uni-logo-white" />
                            <h1>Welcome Back!</h1>
                            <p>Connect to your student workspace.</p>
                            {/* <button className="hidden" onClick={() => setIsActive(true)}>Get Help</button> */}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default Login;