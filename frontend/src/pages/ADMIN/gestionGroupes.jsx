import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBar from "../../components/SideBar";
import "../../CSS/Dashboard.css";
import { Search, Plus, Edit2, Trash2, X, Users, GraduationCap } from "lucide-react";

const NIVEAU_OPTIONS = [
    { value: "1ERE", label: "1ère Année" },
    { value: "2EME", label: "2ème Année" },
    { value: "BC", label: "Bachelor" },
];
const TYPE_FORMATION_OPTIONS = [
    { value: "FI", label: "Formation Initiale" },
    { value: "FTA", label: "Formation Continue Soir" },
];

function GestionGroupes() {
    const navigate = useNavigate();
    const [groupes, setGroupes] = useState([]);
    const [filieres, setFilieres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [selectedFiliere, setSelectedFiliere] = useState("");
    const [formData, setFormData] = useState({
        nom: "",
        filiere_id: "",
        niveau: "1ERE",
        type_formation: "FI",
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
            const [grpRes, filRes] = await Promise.all([
                api.get("academic/groupes/"),
                api.get("academic/filieres/"),
            ]);
            setGroupes(Array.isArray(grpRes.data) ? grpRes.data : []);
            setFilieres(Array.isArray(filRes.data) ? filRes.data : []);
        } catch (error) {
            console.error("Error fetching data:", error);
            setGroupes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({ nom: "", filiere_id: "", niveau: "1ERE", type_formation: "FI" });
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleOpenModal = (groupe = null) => {
        if (groupe) {
            setIsEditing(true);
            setCurrentId(groupe.id);
            setFormData({
                nom: groupe.nom,
                filiere_id: groupe.filiere || "",
                niveau: groupe.niveau || "1ERE",
                type_formation: groupe.type_formation || "FI",
            });
        } else resetForm();
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await api.put(`academic/groupes/update/${currentId}/`, { nom: formData.nom });
            } else {
                if (!formData.filiere_id) {
                    alert("Veuillez sélectionner une filière.");
                    return;
                }
                await api.post("academic/groupes/create/", {
                    nom: formData.nom,
                    filiere: formData.filiere_id,
                    niveau: formData.niveau,
                    type_formation: formData.type_formation,
                });
            }
            setShowModal(false);
            fetchData();
            resetForm();
        } catch (error) {
            console.error("Error saving groupe:", error.response?.data || error);
            alert("Une erreur est survenue. " + JSON.stringify(error.response?.data || ""));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce groupe ?")) {
            try {
                await api.delete(`academic/groupes/delete/${id}/`);
                fetchData();
            } catch (error) {
                console.error("Error deleting groupe:", error);
                alert(error.response?.data?.error || "Impossible de supprimer ce groupe.");
            }
        }
    };

    const filteredGroupes = groupes.filter((g) => {
        const matchesSearch =
            g.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            g.filiere_nom?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFiliere = selectedFiliere === "" || String(g.filiere) === selectedFiliere;

        return matchesSearch && matchesFiliere;
    });
    const getNiveauLabel = (v) => NIVEAU_OPTIONS.find((o) => o.value === v)?.label || v;
    const getTypeFormationLabel = (v) => TYPE_FORMATION_OPTIONS.find((o) => o.value === v)?.label || v;

    return (
        <div className="dashboard-container">
            <SideBar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-content">
                        <h1>Gestion des Groupes</h1>
                        <p>Année Universitaire 2024 - 2025</p>
                    </div>
                    <button className="btn-add-primary" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        <span>Nouveau Groupe</span>
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
                                    value={selectedFiliere}
                                    onChange={(e) => setSelectedFiliere(e.target.value)}
                                >
                                    <option value="">Toutes les filières</option>
                                    {filieres.map((f) => (
                                        <option key={f.id} value={f.id}>
                                            {f.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="stats-pill">
                            <Users size={16} />
                            <span>{filteredGroupes.length} Groupe{filteredGroupes.length !== 1 ? "s" : ""}</span>
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
                                        <th>Filière</th>
                                        <th>Niveau</th>
                                        <th>Type formation</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredGroupes.map((g) => (
                                        <tr key={g.id}>
                                            <td><span className="dept-badge">{g.nom}</span></td>
                                            <td>
                                                <div className="user-info-mini">
                                                    <GraduationCap size={14} />
                                                    <span>{g.filiere_nom || "-"}</span>
                                                </div>
                                            </td>
                                            <td><span className="type-badge">{getNiveauLabel(g.niveau)}</span></td>
                                            <td><span className="formation-badge">{getTypeFormationLabel(g.type_formation)}</span></td>
                                            <td className="actions-cell">
                                                <button className="action-btn edit" onClick={() => handleOpenModal(g)} title="Modifier">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button className="action-btn delete" onClick={() => handleDelete(g.id)} title="Supprimer">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredGroupes.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="empty-state">
                                                <div className="empty-content">
                                                    <Users size={48} opacity={0.2} />
                                                    <p>Aucun groupe trouvé</p>
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
                                <h2>{isEditing ? "Modifier le Groupe" : "Nouveau Groupe"}</h2>
                                <p>Saisissez les informations du groupe</p>
                            </div>
                            <button className="btn-close" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <div className="form-grid single-col">
                                    <div className="input-group">
                                        <label>Nom du groupe</label>
                                        <input type="text" name="nom" value={formData.nom} onChange={handleInputChange} required placeholder="Ex: G1, G2..." />
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
                                                            <option key={f.id} value={f.id}>{f.nom} ({f.departement_nom})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>Niveau</label>
                                                <select name="niveau" value={formData.niveau} onChange={handleInputChange} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                                                    {NIVEAU_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label>Type de formation</label>
                                                <select name="type_formation" value={formData.type_formation} onChange={handleInputChange} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                                                    {TYPE_FORMATION_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                </select>
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
                .type-badge{background:#dbeafe;color:#1d4ed8;padding:4px 10px;border-radius:6px;font-size:12px;}
                .formation-badge{background:#dcfce7;color:#15803d;padding:4px 10px;border-radius:6px;font-size:12px;}
                .user-info-mini{display:flex;align-items:center;gap:6px;color:#4b5563;font-size:14px;}
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
                .filter-group-wrapper{position:relative;display:flex;align-items:center;background:#f3f4f6;border-radius:8px;padding:8px 12px;min-width:200px;}
                .filter-icon{color:#9ca3af;margin-right:8px;}
                .filter-select{border:none;background:transparent;outline:none;font-size:14px;color:#1f2937;width:100%;cursor:pointer;}
                .spinner{border:3px solid #f3f3f3;border-top:3px solid #4f46e5;border-radius:50%;width:28px;height:28px;animation:spin 0.8s linear infinite;margin:0 auto 12px;}
                @keyframes spin{to{transform:rotate(360deg);}}
            `}</style>
        </div>
    );
}

export default GestionGroupes;
