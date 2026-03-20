import React, { useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../CSS/Sidebar.css";

const SideBarProf = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [filiereOpen, setFiliereOpen] = useState(false);
    const [deptOpen, setDeptOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const toggleFiliere = () => setFiliereOpen(!filiereOpen);
    const toggleDept = () => setDeptOpen(!deptOpen);

    const { isChefFiliere, isChefDepartement } = useMemo(() => {
        const chefF = localStorage.getItem("is_chef_filiere");
        const chefD = localStorage.getItem("is_chef_departement");
        return {
            isChefFiliere: chefF === "true" || chefF === "1",
            isChefDepartement: chefD === "true" || chefD === "1",
        };
    }, []);

    const toggleSidebar = () => setIsOpen(!isOpen);
    const isActive = (path) => location.pathname === path;

    return (
        <nav id="sidebar" className={isOpen ? "" : "close"}>
            <ul>
                <li>
                    <span className="logo">ESTE Portal</span>
                    <button type="button" onClick={toggleSidebar} id="toggle-btn" className={!isOpen ? "rotate" : ""} aria-label="Toggle sidebar">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                            <path d="m313-480 155 156q11 11 11.5 27.5T468-268q-11 11-28 11t-28-11L228-452q-6-6-8.5-13t-2.5-15q0-8 2.5-15t8.5-13l184-184q11-11 27.5-11.5T468-692q11 11 11 28t-11 28L313-480Zm264 0 155 156q11 11 11.5 27.5T732-268q-11 11-28 11t-28-11L492-452q-6-6-8.5-13t-2.5-15q0-8 2.5-15t8.5-13l184-184q11-11 27.5-11.5T732-692q11 11 11 28t-11 28L577-480Z" />
                        </svg>
                    </button>
                </li>

                {/* Dashboard */}
                <li className={isActive("/prof/dashboard") ? "active" : ""}>
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/prof/dashboard"); }} role="button">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                            <path d="M520-640v-160q0-17 11.5-28.5T560-840h240q17 0 28.5 11.5T840-800v160q0 17-11.5 28.5T800-600H560q-17 0-28.5-11.5T520-640ZM120-480v-320q0-17 11.5-28.5T160-840h240q17 0 28.5 11.5T440-800v320q0 17-11.5 28.5T400-440H160q-17 0-28.5-11.5T120-480Zm400 320v-320q0-17 11.5-28.5T560-520h240q17 0 28.5 11.5T840-480v320q0 17-11.5 28.5T800-120H560q-17 0-28.5-11.5T520-160Zm-400 0v-160q0-17 11.5-28.5T160-360h240q17 0 28.5 11.5T440-320v160q0 17-11.5 28.5T400-120H160q-17 0-28.5-11.5T120-160Z" />
                        </svg>
                        <span>Dashboard</span>
                    </a>
                </li>

                {/* Base navigation (for all profs) */}
                {/* Faire l'appel */}
                <li className={isActive("/prof/faire-appel") ? "active" : ""}>
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/prof/faire-appel"); }} role="button">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                            <path d="M320-240q-33 0-56.5-23.5T240-320v-320q0-33 23.5-56.5T320-720h320q33 0 56.5 23.5T720-640v320q0 33-23.5 56.5T640-240H320Zm0-80h320v-320H320v320ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h560v80H200Zm120-240v-320 320Z" />
                        </svg>
                        <span>Faire l'appel</span>
                    </a>
                </li>

                {/* Mes Etudiants */}
                <li className={isActive("/prof/mes-etudiants") ? "active" : ""}>
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/prof/mes-etudiants"); }} role="button">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                            <path d="M480-480q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM160-160v-32q0-34 17.5-62.5T224-296q62-31 126-47.5T480-360q66 0 130 16.5T736-296q29 15 46.5 43.5T800-192v32H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T560-640q0-33-23.5-56.5T480-720q-33 0-56.5 23.5T400-640q0 33 23.5 56.5T480-560Zm0-80Zm0 400Z" />
                        </svg>
                        <span>Mes Étudiants</span>
                    </a>
                </li>

                {/* Mon Emploi */}
                <li className={isActive("/prof/mon-emploi") ? "active" : ""}>
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/prof/mon-emploi"); }} role="button">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                            <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-40q0-17 11.5-28.5T280-880q17 0 28.5 11.5T320-840v40h320v-40q0-17 11.5-28.5T680-880q17 0 28.5 11.5T720-840v40h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Z" />
                        </svg>
                        <span>Mon Emploi</span>
                    </a>
                </li>

                {/* Chef de Filière section */}
                {isChefFiliere && (
                    <li className={filiereOpen ? "active" : ""}>
                        <button
                            className={`dropdown-btn ${filiereOpen ? "rotate" : ""}`}
                            onClick={toggleFiliere}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                                <path d="M480-240q-17 0-28.5-11.5T440-280q0-17 11.5-28.5T480-320q17 0 28.5 11.5T520-280q0 17-11.5 28.5T480-240Zm-160 0q-17 0-28.5-11.5T280-280q0-17 11.5-28.5T320-320q17 0 28.5 11.5T360-280q0 17-11.5 28.5T320-240Zm320 0q-17 0-28.5-11.5T600-280q0-17 11.5-28.5T640-320q17 0 28.5 11.5T680-280q0 17-11.5 28.5T640-240ZM200-440q-33 0-56.5-23.5T120-520v-240q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v240q0 33-23.5 56.5T760-440H200Zm0-80h560v-240H200v240Zm0 0v-240 240Z" />
                            </svg>
                            <span>Filiere</span>
                            <svg className="chevron" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                                <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z" />
                            </svg>
                        </button>
                        <ul className={`sub-menu ${filiereOpen ? "show" : ""}`}>
                            <div>
                                <li className={isActive("/prof/validation-justifications") ? "active" : ""}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/prof/validation-justifications"); }} role="button">
                                        <span>Validation Justifs</span>
                                    </a>
                                </li>
                                <li className={isActive("/prof/gestion-emploi") ? "active" : ""}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/prof/gestion-emploi"); }} role="button">
                                        <span>Gestion Emploi</span>
                                    </a>
                                </li>
                                <li className={isActive("/prof/stats-filiere") ? "active" : ""}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/prof/stats-filiere"); }} role="button">
                                        <span>Stats Filière</span>
                                    </a>
                                </li>
                                <li className={isActive("/prof/affectation-modules") ? "active" : ""}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/prof/affectation-modules"); }} role="button">
                                        <span>Affectation Modules</span>
                                    </a>
                                </li>
                            </div>
                        </ul>
                    </li>
                )}

                {/* Chef de Département section */}
                {isChefDepartement && (
                    <li className={deptOpen ? "active" : ""}>
                        <button
                            className={`dropdown-btn ${deptOpen ? "rotate" : ""}`}
                            onClick={toggleDept}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                                <path d="M120-120v-560q0-33 23.5-56.5T200-760h160v-80q0-33 23.5-56.5T440-920h80q33 0 56.5 23.5T600-840v80h160q33 0 56.5 23.5T840-680v560H120Zm80-80h160v-80H200v80Zm0-160h160v-80H200v80Zm0-160h160v-80H200v80Zm240 320h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm0-160h80v-80h-80v80Zm240 480h160v-80H680v80Zm0-160h160v-80H680v80Zm0-160h160v-80H680v80ZM440-760h80v-80h-80v80Z" />
                            </svg>
                            <span>Departement</span>
                            <svg className="chevron" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                                <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z" />
                            </svg>
                        </button>
                        <ul className={`sub-menu ${deptOpen ? "show" : ""}`}>
                            <div>
                                <li className={isActive("/prof/suivi-pedagogique") ? "active" : ""}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/prof/suivi-pedagogique"); }} role="button">
                                        <span>Suivi Pédagogique</span>
                                    </a>
                                </li>
                                <li className={isActive("/prof/gestion-equipe") ? "active" : ""}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/prof/gestion-equipe"); }} role="button">
                                        <span>Gestion Équipe</span>
                                    </a>
                                </li>
                                <li className={isActive("/prof/departement-stats") ? "active" : ""}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/prof/departement-stats"); }} role="button">
                                        <span>Statistiques Dept.</span>
                                    </a>
                                </li>
                            </div>
                        </ul>
                    </li>
                )}

                {/* Mot de passe */}
                <li className={isActive("/prof/mot-de-passe") ? "active" : ""}>
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate("/prof/mot-de-passe"); }} role="button">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                            <path d="M80-200v-61q0-41 34-70.5T217-361q14 0 26 2t25 6q-14 20-21 43t-7 49v61H80Zm240 0v-61q0-60 44-99.5T480-400q72 0 116 39.5T640-261v61H320Zm400 0v-61q0-26-7-49t-21-43q13-4 25.5-6t25.5-2q69 0 104 29.5T880-261v61H720ZM480-480q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Z" />
                        </svg>
                        <span>Mot de passe</span>
                    </a>
                </li>

                {/* Déconnexion */}
                <li>
                    <a href="#" onClick={(e) => { e.preventDefault(); localStorage.clear(); navigate("/login"); }} role="button">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
                            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-55-58 102-102H360v-80h327L585-622l55-58 200 200-200 200Z" />
                        </svg>
                        <span>Déconnexion</span>
                    </a>
                </li>
            </ul>
        </nav>
    );
};

export default SideBarProf;
