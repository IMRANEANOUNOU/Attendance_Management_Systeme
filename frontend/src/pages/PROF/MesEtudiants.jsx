import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBarProf from "../../components/SideBarProf";
import "../../CSS/Dashboard.css";
import { Users, GraduationCap, Mail, IdCard, AlertCircle, Loader2, Search, BookOpen, Group } from "lucide-react";

function MesEtudiants() {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || role !== "PROF") {
            navigate("/login");
            return;
        }
        fetchStudents();
    }, [navigate]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const res = await api.get("academic/professeurs/mes-etudiants/");
            setData(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            console.error(e);
            setError("Impossible de charger la liste des étudiants.");
        } finally {
            setLoading(false);
        }
    };

    const filteredData = data.map(group => ({
        ...group,
        students: group.students.filter(s =>
            s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.cne.toLowerCase().includes(searchTerm.toLowerCase())
        )
    })).filter(group => group.students.length > 0);

    return (
        <div className="dashboard-container">
            <SideBarProf />
            <main className="main-content">
                <header className="top-bar">
                    <div className="welcome-text">
                        <h1>Mes Étudiants</h1>
                        <p>Liste des étudiants par module et par groupe</p>
                    </div>
                    <div className="avatar">
                        <Users size={22} color="white" />
                    </div>
                </header>

                <div className="stats-grid" style={{ gridTemplateColumns: "1fr", marginBottom: "24px" }}>
                    <div className="stat-card" style={{ padding: "16px" }}>
                        <div className="search-container" style={{ display: "flex", alignItems: "center", background: "#f3f4f6", padding: "8px 16px", borderRadius: "10px" }}>
                            <Search size={20} color="#6b7280" />
                            <input
                                type="text"
                                placeholder="Rechercher un étudiant (Nom, Email, CNE)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ border: "none", background: "transparent", outline: "none", marginLeft: "10px", width: "100%", fontSize: "15px" }}
                            />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="fa-loading" style={{ justifyContent: "center" }}>
                        <Loader2 size={32} className="fa-spin" />
                        <span>Chargement des données...</span>
                    </div>
                ) : error ? (
                    <div className="fa-msg fa-msg--error">
                        <AlertCircle size={20} />
                        <span>{error}</span>
                    </div>
                ) : filteredData.length === 0 ? (
                    <div className="fa-empty" style={{ textAlign: "center", padding: "40px" }}>
                        <Users size={48} color="#d1d5db" style={{ marginBottom: "16px" }} />
                        <p>Aucun étudiant trouvé.</p>
                    </div>
                ) : (
                    <div className="student-groups-container">
                        {filteredData.map((group, idx) => (
                            <div key={`${group.module_id}-${group.groupe_id}`} className="recent-activity" style={{ marginBottom: "32px" }}>
                                <div className="group-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #f3f4f6", paddingBottom: "12px" }}>
                                    <h2 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
                                        <BookOpen size={20} color="var(--primary-color)" />
                                        {group.module_nom}
                                        <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "14px", fontWeight: "normal" }}>
                                            — {group.groupe_nom}
                                        </span>
                                    </h2>
                                    <span className="fa-badge fa-badge--pending" style={{ background: "#eef2ff", color: "#4f46e5" }}>
                                        {group.students.length} étudiant{group.students.length > 1 ? 's' : ''}
                                    </span>
                                </div>

                                <div className="fa-table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Étudiant</th>
                                                <th>CNE</th>
                                                <th>Email</th>
                                                <th style={{ textAlign: "center" }}>Absences</th>
                                                <th style={{ textAlign: "center" }}>Justifiées</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.students.map((student) => (
                                                <tr key={student.id}>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                                <GraduationCap size={16} color="var(--primary-color)" />
                                                            </div>
                                                            <span style={{ fontWeight: 600 }}>{student.full_name}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6b7280" }}>
                                                            <IdCard size={14} />
                                                            <span style={{ fontFamily: "monospace" }}>{student.cne}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#6b7280" }}>
                                                            <Mail size={14} />
                                                            <span>{student.email}</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <span className={`fa-badge ${student.nb_absences > 3 ? 'fa-badge--absent' : student.nb_absences > 0 ? 'fa-badge--pending' : 'fa-badge--present'}`}>
                                                            {student.nb_absences}
                                                        </span>
                                                    </td>
                                                    <td style={{ textAlign: "center" }}>
                                                        <span className="fa-badge fa-badge--present" style={{ background: student.nb_justifiees > 0 ? "#d1fae5" : "#f3f4f6", color: student.nb_justifiees > 0 ? "#065f46" : "#9ca3af" }}>
                                                            {student.nb_justifiees}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <style>{`
                .student-groups-container {
                    animation: fadeIn 0.3s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fa-table-wrap table td {
                    padding: 12px 16px;
                }
                .search-container:focus-within {
                    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
                    background: #fff !important;
                    border: 1px solid var(--primary-color);
                }
            `}</style>
        </div>
    );
}

export default MesEtudiants;
