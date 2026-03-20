import React, { useState } from "react";
import "./WindLoader.css"; // Jib l-fichier CSS li sawbna
// import logoPng from "../assets/logo-essaouira.png"; // Jib l-logo dyalk

function Login() {
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true); // 1. Tle3 l-loading dyal rih

        try {
            // 2. Tsena l-API (Simulation)
            // await api.post("/login", credentials);
            await new Promise((resolve) => setTimeout(resolve, 3000)); // Ghi bach njerboha 3 thawan 

            // 3. Dih l-dashboard
            // navigate("/dashboard");
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false); // 4. 7iyed l-loading
        }
    };

    return (
        <div className="login-page">
            {/* 🌪️ L-Overlay dyal Rih kay-ban Ghi ila kan isLoading = true */}
            {isLoading && (
                <div className="loader-overlay">
                    <div className="wind-container">
                        {/* Khtota d rih */}
                        <div className="wind-line"></div>
                        <div className="wind-line"></div>
                        <div className="wind-line"></div>

                        {/* L-logo dyal l-medrasa */}
                        <img
                            src="/path/to/your/logo.png" /* Bdl hadi b l-logo dyalk */
                            alt="Loading..."
                            className="school-logo"
                        />

                        <p className="loading-text">CONNEXION...</p>
                    </div>
                </div>
            )}

            {/* --- L-Formulaire dyal Login L-3adi --- */}
            <form onSubmit={handleLogin}>
                {/* inputs dyalk... */}
                <button type="submit">Se Connecter</button>
            </form>
        </div>
    );
}

export default Login;