import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBarEtudiant from "../../components/SideBarEtudiant";
import "../../CSS/Dashboard.css";
import {
    Camera, Clock, Calendar, User, BookOpen,
    AlertCircle, CheckCircle2, ArrowRight, Loader2, MapPin
} from "lucide-react";
import UserTour from "../../components/UserTour";

/* ─── helpers ──────────────────────────────────────── */
const JOURS_MAP = { 0: "LUNDI", 1: "MARDI", 2: "MERCREDI", 3: "JEUDI", 4: "VENDREDI", 5: "SAMEDI", 6: "DIMANCHE" };
const JOUR_LABELS = { LUNDI: "Lundi", MARDI: "Mardi", MERCREDI: "Mercredi", JEUDI: "Jeudi", VENDREDI: "Vendredi", SAMEDI: "Samedi", DIMANCHE: "Dimanche" };
const fmt = (t) => (t ? t.slice(0, 5) : "--:--");
const getTodayJour = () => JOURS_MAP[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

const studentTourSteps = [
    { title: "Bienvenue sur ton portail !", content: "C'est ta première connexion ? Découvre rapidement comment utiliser ton tableau de bord." },
    { title: "Tes Cour d'Aujourd'hui", content: "Ici tu peux voir le nombre de séances prévues pour toi aujourd'hui." },
    { title: "Suivi d'Absences", content: "Garde un oeil sur ton total d'absences et tes justifications." },
    { title: "Accès Rapide", content: "Utilise ces raccourcis pour scanner ta présence, voir ton emploi du temps ou ton profil." },
    { title: "Séance en Direct", content: "Lorsqu'une séance est en cours, un bouton 'Scanner' apparaîtra pour valider ta présence !" },
];

const isTimeActive = (start, end) => {
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return cur >= sh * 60 + sm && cur <= eh * 60 + em;
};

/* ─── greetings ─── */
const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Bonjour";
    if (h < 18) return "Bon après-midi";
    return "Bonsoir";
};

/* ─── component ──────────────────────────────────── */
function StudentDashboard() {
    const navigate = useNavigate();
    const [studentName, setStudentName] = useState("");
    const [photoUrl, setPhotoUrl] = useState(null);
    const [todaySessions, setTodaySessions] = useState([]);
    const [nextSession, setNextSession] = useState(null);
    const [currentSession, setCurrentSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [absenceStats, setAbsenceStats] = useState({ total: 0, absences: 0, justifiees: 0 });
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || role !== "ETUDIANT") { navigate("/login"); return; }
        setStudentName(localStorage.getItem("full_name") || "Étudiant");
        setPhotoUrl(localStorage.getItem("photo") || null);

        if (localStorage.getItem("is_first_login") === "true") {
            setShowTour(true);
        }

        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            const [sessRes, absRes] = await Promise.allSettled([
                api.get("/schedule/seances/"),
                api.get("attendance/mes-absences/"),
            ]);

            // Sessions
            if (sessRes.status === "fulfilled") {
                const all = sessRes.value.data;
                const today = getTodayJour();
                const todays = all.filter(s => s.jour === today).sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
                setTodaySessions(todays);

                const cur = todays.find(s => isTimeActive(s.heure_debut, s.heure_fin));
                setCurrentSession(cur || null);

                const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
                const next = todays.find(s => {
                    const [h, m] = s.heure_debut.split(":").map(Number);
                    return h * 60 + m > nowMin;
                });
                setNextSession(next || null);
            }

            // Absences
            if (absRes.status === "fulfilled") {
                setAbsenceStats(absRes.value.data.stats || { total: 0, absences: 0, justifiees: 0 });
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const jourAujourdHui = getTodayJour();
    const presenceRate = absenceStats.total > 0 ? Math.round(((absenceStats.total - absenceStats.absences) / absenceStats.total) * 100) : 100;

    const quickActions = [
        { icon: <Camera size={22} />, label: "Mes Séances", desc: "Séances du jour & scan", path: "/etudiant/mes-seances", gradient: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)" },
        { icon: <AlertCircle size={22} />, label: "Mes Absences", desc: "Historique & justifications", path: "/etudiant/mes-absences", gradient: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)" },
        { icon: <User size={22} />, label: "Mon Profil", desc: "Informations personnelles", path: "/etudiant/profil", gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)" },
        { icon: <Calendar size={22} />, label: "Mon Emploi", desc: "Emploi du temps complet", path: "/etudiant/emploi", gradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)" },
    ];

    return (
        <div className="dashboard-container">
            <SideBarEtudiant />
            <main className="main-content">
                {/* Hero Header */}
                <header className="top-bar" style={{ marginBottom: 8 }}>
                    <div className="welcome-text">
                        <h1>{getGreeting()}, {studentName.split(" ")[0]} </h1>
                        <p>Voici votre tableau de bord – {JOUR_LABELS[jourAujourdHui] || "Aujourd'hui"}, {new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    <div className="avatar" style={photoUrl ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}>
                        {!photoUrl && studentName.charAt(0)}
                    </div>
                </header>

                {/* KPI Stats */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-info">
                            <h3><Calendar size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Séances Aujourd'hui</h3>
                            <h1>{loading ? "…" : todaySessions.length}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <h3><AlertCircle size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Total Absences</h3>
                            <h1>{loading ? "…" : absenceStats.absences}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <h3><CheckCircle2 size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Justifiées</h3>
                            <h1>{loading ? "…" : absenceStats.justifiees}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <h3><BookOpen size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Taux de Présence</h3>
                            <h1 style={{ color: presenceRate >= 80 ? "#059669" : presenceRate >= 50 ? "#d97706" : "#dc2626" }}>
                                {loading ? "…" : `${presenceRate}%`}
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Current / Next Session */}
                <div style={{ marginBottom: 35 }}>
                    <h2 className="section-title"><Clock size={22} /> {currentSession ? "Séance en cours" : "Prochaine Séance"}</h2>
                    {loading ? (
                        <div className="stat-card" style={{ justifyContent: "center", padding: 32 }}>
                            <p style={{ color: "var(--text-gray)", margin: 0 }}>Chargement…</p>
                        </div>
                    ) : currentSession ? (
                        <div className="stat-card" style={{ justifyContent: "flex-start", gap: 24, padding: "24px 32px", position: "relative", overflow: "hidden" }}>
                            <div style={{ position: "absolute", top: 12, right: 16 }}>
                                <span style={{ background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 6, animation: "pulse 2s infinite" }}>● LIVE</span>
                            </div>
                            <div>
                                <span style={{ fontSize: 13, color: "var(--text-gray)", textTransform: "uppercase" }}>Horaire</span>
                                <h2 style={{ margin: "4px 0", color: "var(--primary-color)" }}>{fmt(currentSession.heure_debut)} – {fmt(currentSession.heure_fin)}</h2>
                            </div>
                            <div style={{ borderLeft: "2px solid #e5e7eb", paddingLeft: 24 }}>
                                <span style={{ fontSize: 13, color: "var(--text-gray)", textTransform: "uppercase" }}>Module</span>
                                <h2 style={{ margin: "4px 0", color: "var(--text-dark)" }}>{currentSession.module_nom || "—"}</h2>
                            </div>
                            <div style={{ borderLeft: "2px solid #e5e7eb", paddingLeft: 24 }}>
                                <span style={{ fontSize: 13, color: "var(--text-gray)", textTransform: "uppercase" }}>Salle</span>
                                <h2 style={{ margin: "4px 0", color: "var(--text-dark)" }}>{currentSession.salle_nom || "—"}</h2>
                            </div>
                            {currentSession.statut_seance === 'EN_COURS' && (
                                <button
                                    onClick={() => navigate(`/etudiant/scan/${currentSession.id}`)}
                                    style={{
                                        marginLeft: "auto", display: "flex", alignItems: "center", gap: 8,
                                        padding: "10px 22px", background: "linear-gradient(135deg, #4f46e5, #4338ca)", color: "#fff",
                                        border: "none", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer",
                                        boxShadow: "0 4px 14px rgba(79,70,229,.25)", transition: ".2s",
                                    }}
                                >
                                    <Camera size={18} /> Scanner
                                </button>
                            )}
                        </div>
                    ) : nextSession ? (
                        <div className="stat-card" style={{ justifyContent: "flex-start", gap: 24, padding: "24px 32px" }}>
                            <div>
                                <span style={{ fontSize: 13, color: "var(--text-gray)", textTransform: "uppercase" }}>Heure</span>
                                <h2 style={{ margin: "4px 0", color: "var(--primary-color)" }}>{fmt(nextSession.heure_debut)} – {fmt(nextSession.heure_fin)}</h2>
                            </div>
                            <div style={{ borderLeft: "2px solid #e5e7eb", paddingLeft: 24 }}>
                                <span style={{ fontSize: 13, color: "var(--text-gray)", textTransform: "uppercase" }}>Module</span>
                                <h2 style={{ margin: "4px 0", color: "var(--text-dark)" }}>{nextSession.module_nom || "—"}</h2>
                            </div>
                            <div style={{ borderLeft: "2px solid #e5e7eb", paddingLeft: 24 }}>
                                <span style={{ fontSize: 13, color: "var(--text-gray)", textTransform: "uppercase" }}>Salle & Prof</span>
                                <h2 style={{ margin: "4px 0", color: "var(--text-dark)" }}>{nextSession.salle_nom || "—"} · {nextSession.prof_nom || "—"}</h2>
                            </div>
                        </div>
                    ) : (
                        <div className="stat-card" style={{ justifyContent: "center", padding: 32 }}>
                            <p style={{ color: "var(--text-gray)", margin: 0 }}>Aucune séance restante aujourd'hui.</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <h2 className="section-title" style={{ marginBottom: 16 }}>Accès Rapide</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 35 }}>
                    {quickActions.map((a, i) => (
                        <div
                            key={i}
                            onClick={() => navigate(a.path)}
                            style={{
                                background: "#fff", borderRadius: 14, padding: "20px 22px", cursor: "pointer",
                                display: "flex", alignItems: "center", gap: 16,
                                boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #f3f4f6",
                                transition: "all .2s", position: "relative", overflow: "hidden",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)"; }}
                        >
                            <div style={{
                                width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center",
                                justifyContent: "center", background: a.gradient, color: "#fff", flexShrink: 0
                            }}>
                                {a.icon}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: 15, color: "#111827" }}>{a.label}</div>
                                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{a.desc}</div>
                            </div>
                            <ArrowRight size={18} color="#9ca3af" />
                        </div>
                    ))}
                </div>

                {/* Today's Sessions */}
                <section className="recent-activity">
                    <h2>Séances du jour – {JOUR_LABELS[jourAujourdHui] || ""}</h2>
                    {loading ? (
                        <p style={{ color: "var(--text-gray)" }}>Chargement…</p>
                    ) : todaySessions.length === 0 ? (
                        <p style={{ color: "var(--text-gray)" }}>Aucune séance programmée aujourd'hui.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Créneau</th>
                                    <th>Module</th>
                                    <th>Salle</th>
                                    <th>Professeur</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todaySessions.map((s) => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600, color: "var(--primary-color)" }}>{fmt(s.heure_debut)} – {fmt(s.heure_fin)}</td>
                                        <td>{s.module_nom || "—"}</td>
                                        <td>{s.salle_nom || "—"}</td>
                                        <td>{s.prof_nom || "—"}</td>
                                        <td>
                                            {s.statut_seance === 'EN_COURS' ? (
                                                <span className="badge prof" style={{ background: "#dcfce7", color: "#166534" }}>En cours</span>
                                            ) : s.statut_seance === 'CLOTUREE' ? (
                                                <span className="badge prof" style={{ background: "#fee2e2", color: "#991b1b" }}>Clôturée</span>
                                            ) : (
                                                <span className="badge prof">{s.type_seance || "PLANIFIÉ"}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
            `}</style>

            {showTour && (
                <UserTour
                    steps={studentTourSteps}
                    onComplete={() => setShowTour(false)}
                    onSkip={() => setShowTour(false)}
                />
            )}
        </div>
    );
}

export default StudentDashboard;
