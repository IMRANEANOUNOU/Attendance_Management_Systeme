import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import "../../CSS/Dashboard.css"; // T2akked mn l-path
import SideBar from "../../components/SideBar";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { AlertCircle, Users } from 'lucide-react';
import UserTour from "../../components/UserTour";

function Dashboard() {
    const navigate = useNavigate();
    const [adminName, setAdminName] = useState("");
    const [showTour, setShowTour] = useState(false);
    const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    const adminTourSteps = [
        { title: "Bienvenue !", content: "C'est votre première connexion. Laissez-nous vous faire une courte visite guidée." },
        { title: "Statistiques Globales", content: "Ici, vous pouvez voir le nombre total d'étudiants, de professeurs et de départements." },
        { title: "Suivi d'Absence", content: "Consultez les taux d'absence en temps réel pour tout l'établissement et par groupe." },
        { title: "Répartition", content: "Visualisez comment vos étudiants sont répartis entre les différents départements." },
        { title: "Dernières Activités", content: "Gardez un œil sur les dernières inscriptions et les nouveaux utilisateurs." },
    ];

    const [stats, setStats] = useState({
        students: 0,
        profs: 0,
        seances_today: 0,
        departements: 0
    });

    const [charts, setCharts] = useState({ pie_data: [] });
    const [recentUsers, setRecentUsers] = useState([]);
    const [absenceStats, setAbsenceStats] = useState(null);
    const [absenceParGroupe, setAbsenceParGroupe] = useState([]);

    useEffect(() => {
        const name = localStorage.getItem("full_name");
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");

        if (!token) {
            navigate("/login");
            return;
        }
        if (role === "PROF") {
            navigate("/prof/dashboard");
            return;
        }
        setAdminName(name || "Admin");

        const firstLogin = localStorage.getItem("is_first_login");
        if (firstLogin === "true") {
            setShowTour(true);
        }

        const fetchStats = async () => {
            try {
                const response = await api.get("accounts/dashboard/admin/stats/");
                const { stats, charts, recent_users, absence_stats, absence_par_groupe } = response.data;
                setStats(stats || {});
                setCharts(charts || { pie_data: [] });
                setRecentUsers(recent_users || []);
                setAbsenceStats(absence_stats || null);
                setAbsenceParGroupe(absence_par_groupe || []);
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };
        fetchStats();
    }, [navigate]);

    return (
        <div className="dashboard-container">
            <SideBar />

            <main className="main-content">
                {/* 1. HEADER */}
                <header className="top-bar">
                    <div className="welcome-text">
                        <h1>Bonjour, {adminName}</h1>
                        <p>Voici ce qui se passe aujourd'hui.</p>
                    </div>
                    <div className="avatar">{adminName.charAt(0)}</div>
                </header>

                {/* 2. STATS CARDS (GRID) */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-info">
                            <h3>Total Étudiants</h3>
                            <h1>{stats.students}</h1>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
                            <h3>Professeurs</h3>
                            <h1>{stats.profs}</h1>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
                            <h3>Séances (Auj)</h3>
                            <h1>{stats.seances_today}</h1>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-info">
                            <h3>Départements</h3>
                            <h1>{stats.departements}</h1>
                        </div>
                    </div>
                </div>

                {/* 2b. ABSENCE STATS (school-wide) */}
                {absenceStats && (
                    <div className="absence-stats-section">
                        <h2 className="section-title">
                            <AlertCircle size={22} />
                            Statistiques d'absence (établissement)
                        </h2>
                        <div className="absence-stats-grid">
                            <div className="absence-stat-card total">
                                <span className="label">Total pointages</span>
                                <span className="value">{absenceStats.total_pointages}</span>
                            </div>
                            <div className="absence-stat-card present">
                                <span className="label">Présences</span>
                                <span className="value">{absenceStats.present}</span>
                                <span className="pct">{absenceStats.taux_presence_pct}%</span>
                            </div>
                            <div className="absence-stat-card absent">
                                <span className="label">Absences</span>
                                <span className="value">{absenceStats.absent}</span>
                                <span className="pct">{absenceStats.taux_absence_pct}%</span>
                            </div>
                            <div className="absence-stat-card justified">
                                <span className="label">Justifiées</span>
                                <span className="value">{absenceStats.justified}</span>
                            </div>
                            <div className="absence-stat-card unjustified">
                                <span className="label">Non justifiées</span>
                                <span className="value">{absenceStats.unjustified}</span>
                            </div>
                            <div className="absence-stat-card retard">
                                <span className="label">Retards</span>
                                <span className="value">{absenceStats.retard}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2c. ABSENCE PAR GROUPE (percentage) */}
                {absenceParGroupe.length > 0 && (
                    <div className="absence-groupe-section">
                        <h2 className="section-title">
                            <Users size={22} />
                            Taux d'absence par groupe (%)
                        </h2>
                        <div className="chart-card bar-chart-wrap">
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={absenceParGroupe} margin={{ top: 12, right: 12, left: 12, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="groupe_nom" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" height={50} />
                                    <YAxis tick={{ fontSize: 11 }} label={{ value: "% absence", angle: -90, position: "insideLeft" }} domain={[0, 100]} />
                                    <Tooltip formatter={(v) => [`${v}%`, "Absence"]} labelFormatter={(l) => `Groupe ${l}`} />
                                    <Bar dataKey="absent_pct" name="% absence" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absence-groupe-table-wrap">
                            <table className="absence-groupe-table">
                                <thead>
                                    <tr>
                                        <th>Groupe</th>
                                        <th>Total pointages</th>
                                        <th>Absences</th>
                                        <th>% absence</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {absenceParGroupe.map((g) => (
                                        <tr key={g.groupe_id || g.groupe_nom}>
                                            <td><strong>{g.groupe_nom}</strong></td>
                                            <td>{g.total}</td>
                                            <td>{g.absent_count}</td>
                                            <td><span className="pct-badge">{g.absent_pct}%</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 3. CHARTS SECTION */}
                <div className="charts-section">
                    <div className="chart-card">
                        <div className="chart-header">
                            <h3>Répartition par Département</h3>
                        </div>
                        <div style={{ width: '100%', height: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={charts.pie_data}
                                        innerRadius={60} // Donut style (zwin)
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="filiere__departement__nom"
                                    >
                                        {charts.pie_data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="chart-card" style={{ justifyContent: 'center' }}>
                        <div className="chart-header">
                            <h3>Infos Rapides</h3>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <p style={{ color: '#6b7280', marginBottom: '5px' }}>Département Top</p>
                            <h2 style={{ color: '#4f46e5', margin: '0 0 20px 0' }}>
                                {charts.pie_data.length > 0 ? charts.pie_data[0].filiere__departement__nom : "-"}
                            </h2>

                            <hr style={{ border: '0', borderTop: '1px solid #eee', margin: '20px 0' }} />

                            <p style={{ color: '#6b7280', marginBottom: '5px' }}>Nouveaux (5)</p>
                            <h2 style={{ color: '#10b981', margin: 0 }}>{recentUsers.length}</h2>
                        </div>
                    </div>
                </div>

                {/* 4. TABLEAU */}
                <section className="recent-activity">
                    <h2>Dernières Inscriptions</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Nom Complet</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`badge ${user.role.toLowerCase()}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td>{user.date_joined}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </main>

            {showTour && (
                <UserTour
                    steps={adminTourSteps}
                    onComplete={() => setShowTour(false)}
                    onSkip={() => setShowTour(false)}
                />
            )}
        </div>
    );
}

export default Dashboard;