import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBar from "../../components/SideBar";
import "../../CSS/Dashboard.css";
import { Search, Plus, Edit2, Trash2, X, BookOpen, GraduationCap, User } from "lucide-react";

function GestionModules() {
    const navigate = useNavigate();
    const [modules, setModules] = useState([]);
    const [filieres, setFilieres] = useState([]);
    const [professeurs, setProfesseurs] = useState([]);
    const [groupes, setGroupes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroupe, setSelectedGroupe] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [formData, setFormData] = useState({
        nom: "",
        code: "",
        semestre: "1",
        filiere_id: "",
        professeur_id: "",
    });

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
            const [modRes, filRes, profRes, grpRes] = await Promise.all([
                api.get("academic/modules/"),
                api.get("academic/filieres/"),
                api.get("accounts/professeurs/"),
                api.get("academic/groupes/"),
            ]);
            const modList = modRes.data?.modules ?? modRes.data;
            setModules(Array.isArray(modList) ? modList : []);
            setFilieres(Array.isArray(filRes.data) ? filRes.data : []);
            setProfesseurs(Array.isArray(profRes.data) ? profRes.data : []);
            setGroupes(Array.isArray(grpRes.data) ? grpRes.data : []);
        } catch (error) {
            console.error("Error fetching data:", error);
            setModules([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            nom: "",
            code: "",
            semestre: "1",
            filiere_id: "",
            professeur_id: "",
        });
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleOpenModal = (mod = null) => {
        if (mod) {
            setIsEditing(true);
            setCurrentId(mod.id);
            setFormData({
                nom: mod.nom,
                code: mod.code || "",
                semestre: String(mod.semestre ?? 1),
                filiere_id: mod.filiere || "",
                professeur_id: mod.professeur || "",
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                nom: formData.nom.trim(),
                code: formData.code.trim() || null,
                semestre: parseInt(formData.semestre, 10) || 1,
            };
            if (isEditing) {
                await api.put(`academic/modules/update/${currentId}/`, payload);
            } else {
                if (!formData.filiere_id) {
                    alert("Veuillez sélectionner une filière.");
                    return;
                }
                await api.post("academic/modules/create/", {
                    ...payload,
                    filiere: formData.filiere_id,
                    professeur: formData.professeur_id || null,
                });
            }
            setShowModal(false);
            fetchData();
            resetForm();
        } catch (error) {
            console.error("Error saving module:", error.response?.data || error);
            alert("Une erreur est survenue. " + JSON.stringify(error.response?.data || ""));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce module ?")) {
            try {
                await api.delete(`academic/modules/delete/${id}/`);
                fetchData();
            } catch (error) {
                console.error("Error deleting module:", error);
                alert(error.response?.data?.error || "Impossible de supprimer ce module.");
            }
        }
    };

    const filteredModules = modules.filter((m) => {
        const matchesSearch =
            m.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.filiere_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.code && m.code.toLowerCase().includes(searchTerm.toLowerCase()));

        let matchesGroupe = true;
        if (selectedGroupe) {
            const group = groupes.find((g) => String(g.id) === selectedGroupe);
            matchesGroupe = group ? m.filiere === group.filiere : true;
        }

        return matchesSearch && matchesGroupe;
    });

    const semestreOptions = [1, 2, 3, 4, 5, 6];

    return (
        <div className="dashboard-container">
            <SideBar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-content">
                        <h1>Gestion des Modules</h1>
                        <p>Année Universitaire 2024 - 2025</p>
                    </div>
                    <button className="btn-add-primary" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        <span>Nouveau Module</span>
                    </button>
                </header>
                <div className="content-wrapper">
                    <div className="toolbar">
                        <div className="filters-wrapper">
                            <div className="search-wrapper">
                                <Search className="search-icon" size={20} />
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="filter-group-wrapper">
                                <GraduationCap size={18} className="filter-icon" />
                                <select
                                    className="filter-select"
                                    value={selectedGroupe}
                                    onChange={(e) => setSelectedGroupe(e.target.value)}
                                >
                                    <option value="">Tous les groupes</option>
                                    {groupes.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="stats-pill">
                            <BookOpen size={16} />
                            <span>{filteredModules.length} Module{filteredModules.length !== 1 ? "s" : ""}</span>
                        </div>
                    </div>
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Chargement des données...</p>
                        </div>
                    ) : (
                        <div className="table-card">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nom</th>
                                        <th>Code</th>
                                        <th>Semestre</th>
                                        <th>Filière</th>
                                        <th>Professeur</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredModules.map((m) => (
                                        <tr key={m.id}>
                                            <td><span className="dept-badge">{m.nom}</span></td>
                                            <td><span className="code-badge">{m.code || "-"}</span></td>
                                            <td><span className="semestre-badge">S{m.semestre}</span></td>
                                            <td>
                                                <div className="user-info-mini">
                                                    <GraduationCap size={14} />
                                                    <span>{m.filiere_nom || "-"}</span>
                                                </div>
                                            </td>
                                            <td>
                                                {m.professeur_nom ? (
                                                    <div className="user-info-mini">
                                                        <User size={14} />
                                                        <span>{m.professeur_nom}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">Non assigné</span>
                                                )}
                                            </td>
                                            <td className="actions-cell">
                                                <button className="action-btn edit" onClick={() => handleOpenModal(m)} title="Modifier">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button className="action-btn delete" onClick={() => handleDelete(m.id)} title="Supprimer">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredModules.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="empty-state">
                                                <div className="empty-content">
                                                    <BookOpen size={48} opacity={0.2} />
                                                    <p>Aucun module trouvé</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <div className="modal-header-modern">
                            <div>
                                <h2>{isEditing ? "Modifier le Module" : "Nouveau Module"}</h2>
                                <p>Saisissez les informations du module</p>
                            </div>
                            <button className="btn-close" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <div className="form-grid single-col">
                                    <div className="input-group">
                                        <label>Nom du module</label>
                                        <input type="text" name="nom" value={formData.nom} onChange={handleInputChange} required placeholder="Ex: Algorithmique" />
                                    </div>
                                    <div className="input-group">
                                        <label>Code (optionnel)</label>
                                        <input type="text" name="code" value={formData.code} onChange={handleInputChange} placeholder="Ex: ALG-101" />
                                    </div>
                                    <div className="input-group">
                                        <label>Semestre</label>
                                        <select name="semestre" value={formData.semestre} onChange={handleInputChange} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                                            {semestreOptions.map((s) => (
                                                <option key={s} value={s}>Semestre {s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {!isEditing && (
                                        <>
                                            <div className="input-group">
                                                <label>Filière</label>
                                                <div className="select-wrapper">
                                                    <GraduationCap size={18} className="select-icon" />
                                                    <select name="filiere_id" value={formData.filiere_id} onChange={handleInputChange} required>
                                                        <option value="">Sélectionner une filière</option>
                                                        {filieres.map((f) => (
                                                            <option key={f.id} value={f.id}>{f.nom}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>Professeur (optionnel)</label>
                                                <div className="select-wrapper">
                                                    <User size={18} className="select-icon" />
                                                    <select name="professeur_id" value={formData.professeur_id} onChange={handleInputChange}>
                                                        <option value="">Aucun</option>
                                                        {professeurs.map((p) => (
                                                            <option key={p.id} value={p.id}>
                                                                {p.user?.first_name} {p.user?.last_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-text" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary-large">{isEditing ? "Enregistrer" : "Créer"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <style>{`
                .page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;}
                .header-content h1{font-size:24px;font-weight:700;color:#111827;margin:0;}
                .header-content p{color:#6b7280;margin:4px 0 0 0;font-size:14px;}
                .btn-add-primary{background:linear-gradient(135deg,#4f46e5 0%,#4338ca 100%);color:white;border:none;padding:10px 20px;border-radius:8px;display:flex;align-items:center;gap:8px;font-weight:500;cursor:pointer;}
                .content-wrapper{display:flex;flex-direction:column;gap:16px;}
                .toolbar{display:flex;justify-content:space-between;align-items:center;background:white;padding:1rem;border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,0.05);}
                .search-wrapper{color : #9ca3af;display:flex;align-items:center;background:#f3f4f6;border-radius:8px;padding:8px 12px;width:350px;}
                .search-wrapper input{color : black;border:none;background:transparent;margin-left:8px;width:100%;outline:none;font-size:14px;}
                .stats-pill{display:flex;align-items:center;gap:8px;background:#eef2ff;color:#4f46e5;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:600;}
                .table-card{background:white;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);overflow:hidden;}
                table{width:100%;border-collapse:collapse;}
                th{text-align:left;padding:16px 24px;background:#f9fafb;color:#4b5563;font-weight:600;font-size:13px;text-transform:uppercase;border-bottom:1px solid #e5e7eb;}
                td{padding:16px 24px;border-bottom:1px solid #f3f4f6;vertical-align:middle;}
                .dept-badge{font-weight:600;color:#1f2937;background:#f3f4f6;padding:4px 10px;border-radius:6px;font-size:13px;}
                .code-badge{font-family:monospace;font-size:12px;background:#e0e7ff;color:#4338ca;padding:4px 8px;border-radius:4px;}
                .semestre-badge{background:#d1fae5;color:#065f46;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;}
                .user-info-mini{display:flex;align-items:center;gap:6px;color:#4b5563;font-size:14px;}
                .text-muted{color:#9ca3af;}
                .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:1000;}
                .modal-card{background:white;width:500px;max-height:90vh;overflow-y:auto;border-radius:16px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);}
                .modal-header-modern{padding:24px 24px 0;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;}
                .modal-header-modern h2{margin:0;font-size:20px;color:#111827;}
                .modal-form{padding:0 24px 24px;}
                .form-section{margin-bottom:24px;}
                .form-grid.single-col{display:flex;flex-direction:column;gap:16px;}
                .input-group label{display:block;font-size:13px;font-weight:500;color:#4b5563;margin-bottom:6px;}
                .input-group input,.select-wrapper select{width:100%;padding:10px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;box-sizing:border-box;}
                .select-wrapper{position:relative;}
                .select-wrapper select{padding-left:36px;appearance:none;background:white;}
                .select-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9ca3af;pointer-events:none;}
                .modal-footer{display:flex;justify-content:flex-end;gap:12px;padding-top:20px;border-top:1px solid #f3f4f6;}
                .btn-text{background:transparent;border:none;color:#6b7280;font-weight:500;cursor:pointer;padding:10px 16px;}
                .btn-primary-large{background:#4f46e5;color:white;border:none;padding:10px 24px;border-radius:8px;font-weight:500;cursor:pointer;}
                .text-right{text-align:right;}
                .action-btn{padding:7px;border-radius:6px;border:none;background:transparent;cursor:pointer;}
                .action-btn.edit{color:#4f46e5;}
                .action-btn.delete{color:#ef4444;}
                .loading-state,.empty-content{padding:60px;text-align:center;color:#6b7280;background:white;border-radius:12px;}
                .filters-wrapper{display:flex;gap:12px;align-items:center;}
                .filter-group-wrapper{position:relative;display:flex;align-items:center;background:#f3f4f6;border-radius:8px;padding:8px 12px;min-width:180px;}
                .filter-icon{color:#9ca3af;margin-right:8px;}
                .filter-select{border:none;background:transparent;outline:none;font-size:14px;color:#1f2937;width:100%;cursor:pointer;}
                .spinner{border:3px solid #f3f3f3;border-top:3px solid #4f46e5;border-radius:50%;width:28px;height:28px;animation:spin 0.8s linear infinite;margin:0 auto 12px;}
                @keyframes spin{to{transform:rotate(360deg);}}
            `}</style>
        </div>
    );
}

export default GestionModules;
