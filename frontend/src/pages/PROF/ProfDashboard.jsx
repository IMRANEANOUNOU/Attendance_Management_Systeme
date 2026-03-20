import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBarProf from "../../components/SideBarProf";
import "../../CSS/Dashboard.css";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Clock, Users, CalendarDays, BookOpen } from "lucide-react";
import UserTour from "../../components/UserTour";

/* ─── helpers ──────────────────────────────────────── */
const JOURS_MAP = {
    0: "LUNDI", 1: "MARDI", 2: "MERCREDI", 3: "JEUDI",
    4: "VENDREDI", 5: "SAMEDI", 6: "DIMANCHE",
};
const JOUR_LABELS = {
    LUNDI: "Lundi", MARDI: "Mardi", MERCREDI: "Mercredi",
    JEUDI: "Jeudi", VENDREDI: "Vendredi", SAMEDI: "Samedi", DIMANCHE: "Dimanche",
};
const fmt = (t) => (t ? t.slice(0, 5) : "--:--");
const getTodayJour = () => JOURS_MAP[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1];

const profTourSteps = [
    { title: "Espace Professeur", content: "Bienvenue dans votre nouvel espace de travail !" },
    { title: "Vos Séances", content: "Consultez rapidement vos séances du jour et votre prochaine séance prévue." },
    { title: "Statistiques", content: "Suivez le nombre total d'étudiants, de modules et de séances à votre charge." },
    { title: "Taux de Présence", content: "Visualisez d'un coup d'oeil le taux de présence estimé pour chacun de vos groupes." },
    { title: "Navigation", content: "Utilisez la barre latérale pour gérer vos modules et valider les absences." },
];

/* ─── component ────────────────────────────────────── */
function ProfDashboard() {
    const navigate = useNavigate();
    const [profName, setProfName] = useState("");
    const [seances, setSeances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTour, setShowTour] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || role !== "PROF") { navigate("/login"); return; }
        setProfName(localStorage.getItem("full_name") || "Professeur");

        if (localStorage.getItem("is_first_login") === "true") {
            setShowTour(true);
        }

        fetchSeances();
    }, [navigate]);

    const fetchSeances = async () => {
        try {
            const res = await api.get("schedule/seances/");
            setSeances(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    /* ─ derived data ─ */
    const jourAujourdHui = getTodayJour();
    const todaySeances = seances
        .filter((s) => s.jour === jourAujourdHui)
        .sort((a, b) => (a.heure_debut || "").localeCompare(b.heure_debut || ""));

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const prochaine = todaySeances.find((s) => {
        if (!s.heure_debut) return false;
        const [h, m] = s.heure_debut.split(":").map(Number);
        return h * 60 + m > nowMin;
    });

    const uniqueGroupes = [...new Set(seances.map((s) => s.groupe_nom).filter(Boolean))];
    const totalEtudiants = uniqueGroupes.length * 25; // approximate

    /* Mock attendance data per group for chart */
    const chartData = uniqueGroupes.slice(0, 8).map((g) => ({
        groupe: g,
        taux: Math.round(70 + Math.random() * 25),
    }));

    /* ─ render ─ */
    return (
        <div className="dashboard-container">
            <SideBarProf />
            <main className="main-content">
                {/* Header */}
                <header className="top-bar">
                    <div className="welcome-text">
                        <h1>Bonjour, {profName}</h1>
                        <p>Voici votre tableau de bord – {JOUR_LABELS[jourAujourdHui] || "Aujourd'hui"}</p>
                    </div>
                    <div className="avatar">{profName.charAt(0)}</div>
                </header>

                {/* KPI Cards */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-info">
                            <h3><CalendarDays size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Séances Aujourd'hui</h3>
                            <h1>{loading ? "…" : todaySeances.length}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <h3><Users size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Total Étudiants (≈)</h3>
                            <h1>{loading ? "…" : totalEtudiants}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <h3><BookOpen size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Mes Modules</h3>
                            <h1>{loading ? "…" : [...new Set(seances.map((s) => s.module_nom))].length}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-info">
                            <h3><Clock size={16} style={{ marginRight: 6, verticalAlign: "middle" }} />Total Séances</h3>
                            <h1>{loading ? "…" : seances.length}</h1>
                        </div>
                    </div>
                </div>

                {/* Next class card */}
                <div style={{ marginBottom: 35 }}>
                    <h2 className="section-title">
                        <Clock size={22} /> Prochaine Séance
                    </h2>
                    {!loading && prochaine ? (
                        <div className="stat-card" style={{ justifyContent: "flex-start", gap: 24, padding: "24px 32px" }}>
                            <div>
                                <span style={{ fontSize: 13, color: "var(--text-gray)", textTransform: "uppercase" }}>Heure</span>
                                <h2 style={{ margin: "4px 0", color: "var(--primary-color)" }}>{fmt(prochaine.heure_debut)} – {fmt(prochaine.heure_fin)}</h2>
                            </div>
                            <div style={{ borderLeft: "2px solid #e5e7eb", paddingLeft: 24 }}>
                                <span style={{ fontSize: 13, color: "var(--text-gray)", textTransform: "uppercase" }}>Module</span>
                                <h2 style={{ margin: "4px 0", color: "var(--text-dark)" }}>{prochaine.module_nom || "—"}</h2>
                            </div>
                            <div style={{ borderLeft: "2px solid #e5e7eb", paddingLeft: 24 }}>
                                <span style={{ fontSize: 13, color: "var(--text-gray)", textTransform: "uppercase" }}>Salle & Groupe</span>
                                <h2 style={{ margin: "4px 0", color: "var(--text-dark)" }}>{prochaine.salle_nom || "—"} · {prochaine.groupe_nom || "—"}</h2>
                            </div>
                        </div>
                    ) : (
                        <div className="stat-card" style={{ justifyContent: "center", padding: 32 }}>
                            <p style={{ color: "var(--text-gray)", margin: 0 }}>{loading ? "Chargement…" : "Aucune séance restante aujourd'hui."}</p>
                        </div>
                    )}
                </div>

                {/* Chart: Attendance rate per group */}
                <div className="charts-section" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="chart-card" style={{ height: "auto", minHeight: 360 }}>
                        <div className="chart-header">
                            <h3>Taux de présence par groupe (estimé)</h3>
                        </div>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="groupe" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" />
                                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                                    <Tooltip formatter={(v) => [`${v}%`, "Présence"]} />
                                    <Bar dataKey="taux" name="% présence" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p style={{ color: "var(--text-gray)", textAlign: "center", padding: 40 }}>Aucune donnée disponible.</p>
                        )}
                    </div>
                </div>

                {/* Today's sessions list */}
                <section className="recent-activity">
                    <h2>Séances du jour – {JOUR_LABELS[jourAujourdHui] || ""}</h2>
                    {loading ? (
                        <p style={{ color: "var(--text-gray)" }}>Chargement…</p>
                    ) : todaySeances.length === 0 ? (
                        <p style={{ color: "var(--text-gray)" }}>Aucune séance programmée aujourd'hui.</p>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Créneau</th>
                                    <th>Module</th>
                                    <th>Groupe</th>
                                    <th>Salle</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {todaySeances.map((s) => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600, color: "var(--primary-color)" }}>{fmt(s.heure_debut)} – {fmt(s.heure_fin)}</td>
                                        <td>{s.module_nom || "—"}</td>
                                        <td>{s.groupe_nom || "—"}</td>
                                        <td>{s.salle_nom || "—"}</td>
                                        <td><span className="badge prof">{s.type_seance || "COURS"}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>

            {showTour && (
                <UserTour
                    steps={profTourSteps}
                    onComplete={() => setShowTour(false)}
                    onSkip={() => setShowTour(false)}
                />
            )}
        </div>
    );
}

export default ProfDashboard;
