import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarProf from "../../components/SideBarProf";
import "../../CSS/Dashboard.css";
import api from "../../api/axios";

function GestionEquipe() {
    const navigate = useNavigate();
    const [profs, setProfs] = useState([]);
    const [filieres, setFilieres] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || role !== "PROF") {
            navigate("/login");
            return;
        }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const departementId = localStorage.getItem("departement_id");
            if (!departementId) return;

            const [profsRes, filieresRes] = await Promise.all([
                api.get(`accounts/departements/${departementId}/professeurs/`),
                api.get(`academic/departements/${departementId}/filieres/`),
            ]);
            setProfs(profsRes.data || []);
            setFilieres(filieresRes.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleChef = async (profId, isChecked, filiereId = null) => {
        try {
            if (!isChecked) {
                // Find current filiere id by prof
                const p = profs.find((p) => p.id === profId);
                if (p && p.chef_filiere_id) {
                    await api.put(`academic/departement/filiere/${p.chef_filiere_id}/assign-chef/`, { prof_id: null });
                }
            } else {
                if (!filiereId) {
                    alert("Veuillez sélectionner une filière");
                    return;
                }
                await api.put(`academic/departement/filiere/${filiereId}/assign-chef/`, { prof_id: profId });
            }
            fetchData(); // Refresh list to get accurate state from backend
        } catch (e) {
            console.error("Erreur toggle chef", e);
            alert(e.response?.data?.error || "Erreur lors de l'assignation");
        }
    };

    return (
        <div className="dashboard-container">
            <SideBarProf />
            <main className="main-content">
                <header className="top-bar">
                    <div className="welcome-text">
                        <h1>Gestion Équipe</h1>
                        <p>Gérer les professeurs du département et assigner les Chefs de Filière</p>
                    </div>
                    <div className="avatar">GE</div>
                </header>

                <section className="recent-activity">
                    <h2>Professeurs du Département</h2>
                    {loading ? (
                        <p style={{ color: "var(--text-gray)" }}>Chargement…</p>
                    ) : profs.length === 0 ? (
                        <p style={{ color: "var(--text-gray)" }}>Aucun professeur trouvé.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Nom</th>
                                    <th>Spécialité</th>
                                    <th>Statut / Chef de filière</th>
                                    <th>Assigner Filière (si activé)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {profs.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.nom} {p.prenom}</td>
                                        <td>{p.specialite || "—"}</td>
                                        <td>
                                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                                                <div style={{ position: "relative", width: "40px", height: "20px", background: p.is_chef_filiere ? "var(--primary-color)" : "#ccc", borderRadius: "10px", transition: "0.3s" }}>
                                                    <div style={{ position: "absolute", top: "2px", left: p.is_chef_filiere ? "22px" : "2px", width: "16px", height: "16px", background: "#fff", borderRadius: "50%", transition: "0.3s" }} />
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    hidden
                                                    checked={p.is_chef_filiere}
                                                    onChange={(e) => {
                                                        // Uncheck directly
                                                        if (!e.target.checked) handleToggleChef(p.id, false);
                                                        // Checking requires selecting a filière first, handled by the select dropdown
                                                    }}
                                                />
                                                <span style={{ fontSize: "14px", fontWeight: 500 }}>
                                                    {p.is_chef_filiere ? `Chef ( ${p.chef_filiere_nom} )` : "Professeur"}
                                                </span>
                                            </label>
                                        </td>
                                        <td>
                                            {!p.is_chef_filiere && (
                                                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                    <select
                                                        id={`assign-fil-${p.id}`}
                                                        defaultValue=""
                                                        style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                                                    >
                                                        <option value="" disabled>Sélectionner Filière</option>
                                                        {filieres.map(f => (
                                                            <option key={f.id} value={f.id}>{f.nom}</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        className="btn-primary"
                                                        style={{ padding: "6px 12px", fontSize: "12px" }}
                                                        onClick={() => {
                                                            const selectEl = document.getElementById(`assign-fil-${p.id}`);
                                                            const val = selectEl?.value;
                                                            handleToggleChef(p.id, true, val);
                                                        }}
                                                    >
                                                        Assigner
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>
        </div>
    );
}

export default GestionEquipe;
