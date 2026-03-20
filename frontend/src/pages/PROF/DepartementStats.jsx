import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarProf from "../../components/SideBarProf";
import "../../CSS/Dashboard.css";
import api from "../../api/axios";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import { Users, GraduationCap, Clock, AlertTriangle } from "lucide-react";

const COLORS = ["#4f46e5", "#ec4899", "#f59e0b", "#10b981", "#6366f1"];

function DepartementStats() {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
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

            const res = await api.get(`academic/departements/${departementId}/stats/`);
            setStats(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-container">
                <SideBarProf />
                <main className="main-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ color: "var(--text-gray)" }}>Chargement des statistiques...</p>
                </main>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="dashboard-container">
                <SideBarProf />
                <main className="main-content" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ color: "var(--text-gray)" }}>Impossible de charger les statistiques. Êtes-vous assigné en tant que Chef de Département ?</p>
                </main>
            </div>
        );
    }

    // Formatting Data for Recharts
    const attendanceData = [
        { name: "Présents", value: stats.taux?.presence || 0, fill: "#10b981" },
        { name: "Absents", value: stats.taux?.absence || 0, fill: "#ef4444" },
        { name: "Retards", value: stats.taux?.retard || 0, fill: "#f59e0b" },
    ];

    const absenceDetailData = [
        { name: "Justifiées", count: stats.absences?.justifiees || 0 },
        { name: "Non Justifiées", count: stats.absences?.non_justifiees || 0 },
    ];

    return (
        <div className="dashboard-container">
            <SideBarProf />
            <main className="main-content">
                <header className="top-bar">
                    <div className="welcome-text">
                        <h1>Statistiques ({stats.departement})</h1>
                        <p>Aperçu global des performances et de la structure du département</p>
                    </div>
                    <div className="avatar">SD</div>
                </header>

                {/* Global KPI Cards */}
                <div className="stats-grid" style={{ marginBottom: "32px" }}>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: "#eef2ff", color: "#4f46e5" }}>
                            <Users size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>Total Étudiants</h3>
                            <h1>{stats.structure?.etudiants || 0}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: "#fdf4ff", color: "#ec4899" }}>
                            <GraduationCap size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>Total Filières</h3>
                            <h1>{stats.structure?.filieres || 0}</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: "#f0fdf4", color: "#10b981" }}>
                            <Clock size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>Taux Présence</h3>
                            <h1>{stats.taux?.presence || 0}%</h1>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon" style={{ background: "#fef2f2", color: "#ef4444" }}>
                            <AlertTriangle size={24} />
                        </div>
                        <div className="stat-info">
                            <h3>Absences NT</h3>
                            <h1>{stats.absences?.non_justifiees || 0}</h1>
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="charts-section" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "24px" }}>

                    {/* Performance: Taux de Présence */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Performance Globale (Présence)</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={attendanceData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {attendanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value}%`} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Details des absences */}
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Détail des Absences</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={absenceDetailData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={60}>
                                    {absenceDetailData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name === "Justifiées" ? "#10b981" : "#ef4444"} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                </div>

                {/* Bottom Detailed Stats or extra charts */}
                <section className="recent-activity" style={{ marginTop: "32px" }}>
                    <h2>Récapitulatif Détaillé</h2>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginTop: "16px" }}>
                        <div style={{ background: "#fafafa", padding: "16px", borderRadius: "8px", border: "1px solid #eaeaea" }}>
                            <p style={{ color: "var(--text-gray)", fontSize: "14px", margin: "0 0 8px 0" }}>Total Pointages</p>
                            <h3 style={{ margin: 0, fontSize: "24px" }}>{stats.pointages?.total}</h3>
                        </div>
                        <div style={{ background: "#fafafa", padding: "16px", borderRadius: "8px", border: "1px solid #eaeaea" }}>
                            <p style={{ color: "var(--text-gray)", fontSize: "14px", margin: "0 0 8px 0" }}>Présences Enregistrées</p>
                            <h3 style={{ margin: 0, fontSize: "24px", color: "#10b981" }}>{stats.pointages?.present}</h3>
                        </div>
                        <div style={{ background: "#fafafa", padding: "16px", borderRadius: "8px", border: "1px solid #eaeaea" }}>
                            <p style={{ color: "var(--text-gray)", fontSize: "14px", margin: "0 0 8px 0" }}>Absences Enregistrées</p>
                            <h3 style={{ margin: 0, fontSize: "24px", color: "#ef4444" }}>{stats.pointages?.absent}</h3>
                        </div>
                        <div style={{ background: "#fafafa", padding: "16px", borderRadius: "8px", border: "1px solid #eaeaea" }}>
                            <p style={{ color: "var(--text-gray)", fontSize: "14px", margin: "0 0 8px 0" }}>Total Groupes Actifs</p>
                            <h3 style={{ margin: 0, fontSize: "24px", color: "#4f46e5" }}>{stats.structure?.groupes}</h3>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}

export default DepartementStats;
