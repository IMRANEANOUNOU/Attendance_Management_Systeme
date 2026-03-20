import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBar from "../../components/SideBar";
import "../../CSS/Dashboard.css";
import { BookOpen, GraduationCap, Search } from "lucide-react";

function GestionSemestre() {
    const navigate = useNavigate();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSemestre, setSelectedSemestre] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get("academic/modules/");
            const modList = res.data?.modules ?? res.data;
            setModules(Array.isArray(modList) ? modList : []);
        } catch (error) {
            console.error("Error fetching modules:", error);
            setModules([]);
        } finally {
            setLoading(false);
        }
    };

    const bySemestre = {};
    const semestreOrder = [1, 2, 3, 4, 5, 6];
    semestreOrder.forEach((s) => { bySemestre[s] = []; });
    modules.forEach((m) => {
        const s = m.semestre ?? 1;
        if (!bySemestre[s]) bySemestre[s] = [];
        bySemestre[s].push(m);
    });
    const filteredBySearch = (list) =>
        list.filter(
            (m) =>
                m.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.filiere_nom?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const displaySemestres = semestreOrder.filter((s) => (bySemestre[s]?.length ?? 0) > 0 || searchTerm === "");
    const totalModules = modules.length;

    return (
        <div className="dashboard-container">
            <SideBar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-content">
                        <h1>Répartition par Semestres</h1>
                        <p>Modules regroupés par semestre — Année Universitaire 2024 - 2025</p>
                    </div>
                </header>
                <div className="content-wrapper">
                    <div className="toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher un module ou filière..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="stats-pill">
                            <GraduationCap size={16} />
                            <span>{totalModules} module{totalModules !== 1 ? "s" : ""} au total</span>
                        </div>
                    </div>
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Chargement...</p>
                        </div>
                    ) : (
                        <div className="semestre-grid">
                            {displaySemestres.map((num) => {
                                const list = bySemestre[num] || [];
                                const filtered = filteredBySearch(list);
                                const isSelected = selectedSemestre === num;
                                return (
                                    <div
                                        key={num}
                                        className={`semestre-card ${isSelected ? "selected" : ""}`}
                                        onClick={() => setSelectedSemestre(isSelected ? null : num)}
                                    >
                                        <div className="semestre-card-header">
                                            <span className="semestre-badge">Semestre {num}</span>
                                            <span className="semestre-count">{filtered.length} module{filtered.length !== 1 ? "s" : ""}</span>
                                        </div>
                                        <ul className="semestre-module-list">
                                            {filtered.length === 0 ? (
                                                <li className="text-muted">Aucun module</li>
                                            ) : (
                                                filtered.map((m) => (
                                                    <li key={m.id}>
                                                        <BookOpen size={14} />
                                                        <span>{m.nom}</span>
                                                        <span className="filiere-tag">{m.filiere_nom}</span>
                                                    </li>
                                                ))
                                            )}
                                        </ul>
                                    </div>
                                );
                            })}
                            {displaySemestres.length === 0 && (
                                <div className="empty-state-card">
                                    <GraduationCap size={48} opacity={0.2} />
                                    <p>Aucun module enregistré. Ajoutez des modules depuis la page « Modules ».</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
            <style>{`
                .page-header{margin-bottom:2rem;}
                .header-content h1{font-size:24px;font-weight:700;color:#111827;margin:0;}
                .header-content p{color:#6b7280;margin:4px 0 0 0;font-size:14px;}
                .content-wrapper{display:flex;flex-direction:column;gap:16px;}
                .toolbar{display:flex;justify-content:space-between;align-items:center;background:white;padding:1rem;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,0.05);}
                .search-wrapper{color : #9ca3af;display:flex;align-items:center;background:#f3f4f6;border-radius:8px;padding:8px 12px;width:350px;}
                .search-wrapper input{color : black;border:none;background:transparent;margin-left:8px;width:100%;outline:none;font-size:14px;}
                .stats-pill{display:flex;align-items:center;gap:8px;background:#eef2ff;color:#4f46e5;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:600;}
                .semestre-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;}
                .semestre-card{background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);padding:16px;cursor:pointer;transition:all 0.2s;border:2px solid transparent;}
                .semestre-card:hover,.semestre-card.selected{border-color:#4f46e5;box-shadow:0 4px 12px rgba(79,70,229,0.15);}
                .semestre-card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e5e7eb;}
                .semestre-badge{font-weight:700;color:#4f46e5;font-size:15px;}
                .semestre-count{font-size:12px;color:#6b7280;}
                .semestre-module-list{list-style:none;margin:0;padding:0;}
                .semestre-module-list li{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;color:#374151;}
                .semestre-module-list li .filiere-tag{margin-left:auto;font-size:11px;color:#6b7280;background:#f3f4f6;padding:2px 8px;border-radius:4px;}
                .text-muted{color:#9ca3af;}
                .empty-state-card{grid-column:1/-1;padding:60px;text-align:center;color:#6b7280;background:white;border-radius:12px;}
                .loading-state{padding:60px;text-align:center;color:#6b7280;background:white;border-radius:12px;}
                .spinner{border:3px solid #f3f3f3;border-top:3px solid #4f46e5;border-radius:50%;width:28px;height:28px;animation:spin 0.8s linear infinite;margin:0 auto 12px;}
                @keyframes spin{to{transform:rotate(360deg);}}
            `}</style>
        </div>
    );
}

export default GestionSemestre;
