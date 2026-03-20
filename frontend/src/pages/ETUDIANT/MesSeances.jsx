import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBarEtudiant from "../../components/SideBarEtudiant";
import { MapPin, Camera, Clock, Calendar, User, Loader2 } from "lucide-react";

/* ─── helpers ──────────────────────────────────────── */
const getDayName = () => {
    const days = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
    return days[new Date().getDay()];
};

const isTimeActive = (start, end) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    return currentTime >= startH * 60 + startM && currentTime <= endH * 60 + endM;
};

const MesSeances = () => {
    const navigate = useNavigate();
    const [todaySessions, setTodaySessions] = useState([]);
    const [currentSession, setCurrentSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || role !== "ETUDIANT") { navigate("/login"); return; }
        fetchSessions();
    }, [navigate]);

    const fetchSessions = async () => {
        try {
            const res = await api.get("/schedule/seances/");
            const allSessions = res.data;
            const today = getDayName();
            const todaySeances = allSessions.filter(s => s.jour === today);
            todaySeances.sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
            setTodaySessions(todaySeances);

            const current = todaySeances.find(s => isTimeActive(s.heure_debut, s.heure_fin));
            setCurrentSession(current || null);
        } catch (error) {
            console.error("Error fetching sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleScan = (seanceId) => {
        navigate(`/etudiant/scan/${seanceId}`);
    };

    return (
        <div className="dashboard-container">
            <SideBarEtudiant />
            <main className="main-content">
                {/* Header */}
                <header className="top-bar">
                    <div className="welcome-text">
                        <h1>Mes Séances</h1>
                        <p>{new Date().toLocaleDateString("fr-FR", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div className="avatar" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}>
                        <Calendar size={22} color="white" />
                    </div>
                </header>

                <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))" }}>
                    {/* Active Session Card */}
                    <div className="stat-card" style={{ flexDirection: "column", alignItems: "stretch", padding: 24 }}>
                        <h2 className="section-title" style={{ marginBottom: 20 }}>
                            <Clock size={20} /> Séance Actuelle
                        </h2>
                        {loading ? (
                            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--text-gray)" }}>
                                <Loader2 size={24} className="ms-spin" /> Chargement…
                            </div>
                        ) : currentSession ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <span style={{ fontSize: 20, fontWeight: 700, color: "var(--text-dark)", display: "block" }}>{currentSession.module_nom}</span>
                                        <div style={{ color: "var(--text-gray)", fontSize: 14, marginTop: 2 }}>{currentSession.prof_nom}</div>
                                    </div>
                                    <span style={{
                                        padding: "4px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 600,
                                        background: currentSession.statut_seance === 'EN_COURS' ? '#dcfce7' : '#f3f4f6',
                                        color: currentSession.statut_seance === 'EN_COURS' ? '#166534' : '#374151'
                                    }}>
                                        {currentSession.statut_seance === 'EN_COURS' ? '● En cours' : currentSession.statut_seance}
                                    </span>
                                </div>

                                <div style={{ display: "flex", gap: 24, color: "#4b5563" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                                        <Clock size={18} />
                                        <span>{currentSession.heure_debut.slice(0, 5)} - {currentSession.heure_fin.slice(0, 5)}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                                        <MapPin size={18} />
                                        <span>Salle {currentSession.salle_nom || "Non définie"}</span>
                                    </div>
                                </div>

                                {currentSession.statut_seance === 'EN_COURS' ? (
                                    <button
                                        onClick={() => handleScan(currentSession.id)}
                                        style={{
                                            background: "linear-gradient(135deg, #4f46e5, #4338ca)", color: "#fff",
                                            border: "none", border_radius: "10px", padding: "12px", fontSize: "16px",
                                            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center",
                                            justifyContent: "center", gap: "8px", boxShadow: "0 4px 14px rgba(79,70,229,.25)",
                                            transition: ".2s"
                                        }}
                                    >
                                        <Camera size={20} /> Scanner ma présence
                                    </button>
                                ) : (
                                    <div style={{ background: "#f3f4f6", color: "#6b7280", padding: "12px", borderRadius: "8px", fontSize: "14px", textAlign: "center" }}>
                                        La séance n'est pas encore marquée comme commencée par le professeur.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", color: "#9ca3af", padding: "20px 0" }}>
                                <Clock size={40} style={{ marginBottom: 16, opacity: 0.5 }} />
                                <p>Aucun cours en ce moment.</p>
                            </div>
                        )}
                    </div>

                    {/* Today's Schedule List */}
                    <div className="recent-activity" style={{ padding: 24 }}>
                        <h2 className="section-title" style={{ marginBottom: 16 }}>
                            <Calendar size={20} /> Programme du jour
                        </h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            {todaySessions.length === 0 ? (
                                <p style={{ color: "var(--text-gray)" }}>Aucun cours prévu aujourd'hui.</p>
                            ) : (
                                todaySessions.map(session => (
                                    <div
                                        key={session.id}
                                        style={{
                                            display: "flex", alignItems: "center", padding: "12px 16px",
                                            background: session.id === currentSession?.id ? "#f5f3ff" : "#fff",
                                            borderRadius: 12, border: "1px solid #f3f4f6", gap: 16,
                                            borderLeft: session.id === currentSession?.id ? "4px solid #4f46e5" : "1px solid #f3f4f6"
                                        }}
                                    >
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 60, fontWeight: 600 }}>
                                            <span style={{ color: "#111827" }}>{session.heure_debut.slice(0, 5)}</span>
                                            <span style={{ color: "#9ca3af", fontSize: 12 }}>{session.heure_fin.slice(0, 5)}</span>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ margin: 0, fontSize: 16, color: "#111827", fontWeight: 600 }}>{session.module_nom}</h4>
                                            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6b7280" }}>{session.salle_nom} • {session.prof_nom}</p>
                                        </div>
                                        {session.statut_seance === 'EN_COURS' && (
                                            <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, animation: "pulse 2s infinite" }}>LIVE</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                .ms-spin { animation: spin .8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}</style>
        </div>
    );
};

export default MesSeances;
