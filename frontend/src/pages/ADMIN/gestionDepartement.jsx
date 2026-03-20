import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBar from "../../components/SideBar";
import "../../CSS/Dashboard.css";
import { Search, Plus, Edit2, Trash2, X, Building2, User } from 'lucide-react';

const BASE_URL = "http://127.0.0.1:8000";

function GestionDepartement() {
    const navigate = useNavigate();
    const [departements, setDepartements] = useState([]);
    const [professeurs, setProfesseurs] = useState([]); // All professors, needed for lookup/filtering potentially

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    // Form Stats
    const [formData, setFormData] = useState({
        nom: "",
        description: "",
        chef_id: ""
    });

    const [modalProfs, setModalProfs] = useState([]); // Professors available for selection in modal

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
            const [depsRes, profsRes] = await Promise.all([
                api.get("academic/departements/"),
                api.get("accounts/professeurs/")
            ]);
            setDepartements(depsRes.data);
            setProfesseurs(profsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            nom: "",
            description: "",
            chef_id: ""
        });
        setModalProfs([]);
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleOpenModal = (dept = null) => {
        if (dept) {
            setIsEditing(true);
            setCurrentId(dept.id);
            setFormData({
                nom: dept.nom,
                description: dept.description || "",
                chef_id: dept.chef || ""
            });

            // Filter professors belonging to this department
            const deptProfs = professeurs.filter(p => String(p.departement) === String(dept.id));
            setModalProfs(deptProfs);

        } else {
            resetForm();
            setModalProfs([]); // No professors in a new department yet
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                // 1. Update Details
                await api.put(`academic/departements/update/${currentId}/`, {
                    nom: formData.nom,
                    description: formData.description
                });

                // 2. Update Chef if changed and selected
                // Note: If chef_id is empty, we might want to unassign? 
                // The prompt says "must have a chef... selected from professors".
                // If the user selects a chef, we call the change endpoint.
                if (formData.chef_id) {
                    await api.put(`academic/departements/change-chef/${currentId}/`, {
                        chef: formData.chef_id
                    });
                }
            } else {
                // Create
                await api.post("academic/departements/create/", {
                    nom: formData.nom,
                    description: formData.description
                    // We don't send chef_id here because no profs exist in the new dept yet
                });
            }
            setShowModal(false);
            fetchData();
            resetForm();
        } catch (error) {
            console.error("Error saving department:", error.response?.data || error);
            alert("Une erreur est survenue. " + JSON.stringify(error.response?.data || ""));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce département ?")) {
            try {
                await api.delete(`academic/departements/delete/${id}/`);
                fetchData();
            } catch (error) {
                console.error("Error deleting department:", error);
                alert("Impossible de supprimer ce département (peut-être contient-il des filières ?).");
            }
        }
    };

    const filteredDepartements = departements.filter(d =>
        d.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-container">
            <SideBar />

            <main className="main-content">
                <header className="page-header">
                    <div className="header-content">
                        <h1>Gestion des Départements</h1>
                        <p>Année Universitaire 2024 - 2025</p>
                    </div>
                    <button className="btn-add-primary" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        <span>Nouveau Département</span>
                    </button>
                </header>

                <div className="content-wrapper">
                    {/* Toolbar */}
                    <div className="toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher un département..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="stats-pill">
                            <Building2 size={16} />
                            <span>{filteredDepartements.length} Départements</span>
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
                                        <th>Chef de Département</th>
                                        <th>Description</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredDepartements.map((dept) => (
                                        <tr key={dept.id}>
                                            <td><span className="dept-badge">{dept.nom}</span></td>
                                            <td>
                                                {dept.chef_nom ? (
                                                    <div className="user-info-mini">
                                                        <User size={14} />
                                                        <span>{dept.chef_nom}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted">Non assigné</span>
                                                )}
                                            </td>
                                            <td className="desc-cell">{dept.description || "-"}</td>
                                            <td className="actions-cell">
                                                <button className="action-btn edit" onClick={() => handleOpenModal(dept)} title="Modifier">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button className="action-btn delete" onClick={() => handleDelete(dept.id)} title="Supprimer">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredDepartements.length === 0 && (
                                        <tr>
                                            <td colSpan="4" className="empty-state">
                                                <div className="empty-content">
                                                    <Building2 size={48} opacity={0.2} />
                                                    <p>Aucun département trouvé</p>
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

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <div className="modal-header-modern">
                            <div>
                                <h2>{isEditing ? "Modifier le Département" : "Nouveau Département"}</h2>
                                <p>Saisissez les informations du département</p>
                            </div>
                            <button className="btn-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <div className="form-grid single-col">
                                    <div className="input-group">
                                        <label>Nom du Département</label>
                                        <input
                                            type="text"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Ex: Informatique, Génie Civil..."
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Courte description du département..."
                                            rows="3"
                                            className="form-textarea"
                                        />
                                    </div>

                                    {isEditing ? (
                                        <div className="input-group">
                                            <label>Chef de Département</label>
                                            <div className="select-wrapper">
                                                <User size={18} className="select-icon" />
                                                <select
                                                    name="chef_id"
                                                    value={formData.chef_id}
                                                    onChange={handleInputChange}
                                                >
                                                    <option value="">Sélectionner un chef</option>
                                                    {modalProfs.length > 0 ? (
                                                        modalProfs.map(prof => (
                                                            <option key={prof.id} value={prof.id}>
                                                                {prof.user?.first_name} {prof.user?.last_name}
                                                            </option>
                                                        ))
                                                    ) : (
                                                        <option disabled>Aucun professeur dans ce département</option>
                                                    )}
                                                </select>
                                            </div>
                                            {modalProfs.length === 0 && (
                                                <p className="form-hint">Ajoutez d'abord des professeurs à ce département via "Gestion Professeurs" pour pouvoir assigner un chef.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="info-box">
                                            <p>Vous pourrez assigner un chef une fois le département créé et des professeurs y ayant été affectés.</p>
                                        </div>
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
                /* Consuming styles from Dashboard.css but adding overrides/specifics */
                .page-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                }
                .header-content h1 {
                    font-size: 24px;
                    font-weight: 700;
                    color: #111827;
                    margin: 0;
                }
                 .header-content p {
                    color: #6b7280;
                    margin: 4px 0 0 0;
                    font-size: 14px;
                }
                .btn-add-primary {
                    background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
                    transition: all 0.2s;
                }
                .btn-add-primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 8px -1px rgba(79, 70, 229, 0.3);
                }

                .content-wrapper {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }

                .toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: white;
                    padding: 1rem;
                    border-radius: 12px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                .search-wrapper {
                    display: flex;
                    align-items: center;
                    background: #f3f4f6;
                    border-radius: 8px;
                    padding: 8px 12px;
                    width: 350px;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }
                .search-wrapper:focus-within {
                    background: white;
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }
                .search-icon { color: #9ca3af; }
                .search-wrapper input {
                    border: none;
                    background: transparent;
                    margin-left: 8px;
                    width: 100%;
                    color : black;
                    outline: none;
                    font-size: 14px;
                }
                 .stats-pill {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: #eef2ff;
                    color: #4f46e5;
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                }

                .table-card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    overflow: hidden;
                    animation: fadeIn 0.3s;
                }
                table { width: 100%; border-collapse: collapse; }
                th {
                    text-align: left;
                    padding: 16px 24px;
                    background: #f9fafb;
                    color: #4b5563;
                    font-weight: 600;
                    font-size: 13px;
                    text-transform: uppercase;
                    border-bottom: 1px solid #e5e7eb;
                }
                td {
                    padding: 16px 24px;
                    border-bottom: 1px solid #f3f4f6;
                    vertical-align: middle;
                }
                .dept-badge {
                    font-weight: 600;
                    color: #1f2937;
                    background: #f3f4f6;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 13px;
                }
                .user-info-mini {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #4b5563;
                    font-size: 14px;
                }
                .desc-cell {
                    color: #6b7280;
                    font-size: 14px;
                    max-width: 300px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .form-textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    resize: vertical;
                    font-family: inherit;
                    box-sizing: border-box;
                }
                .info-box {
                    background: #fffbeb;
                    border: 1px solid #fcd34d;
                    color: #b45309;
                    padding: 12px;
                    border-radius: 8px;
                    font-size: 13px;
                    margin-top: 8px;
                }
                .form-hint {
                    font-size: 12px;
                    color: #ef4444;
                    margin-top: 6px;
                }
                
                /* Modal & Other styles reused from other pages/dashboard.css essentially */
                .modal-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(2px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.2s;
                }
                .modal-card {
                    background: white;
                    width: 500px;
                    max-height: 90vh;
                    overflow-y: auto;
                    border-radius: 16px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    animation: slideUp 0.3s;
                }
                 @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .modal-header-modern {
                    padding: 24px 24px 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 24px;
                }
                .modal-header-modern h2 { margin: 0; font-size: 20px; color: #111827; }
                .modal-header-modern p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
                .btn-close { background: transparent; border: none; cursor: pointer; color: #9ca3af; padding: 4px; }
                 .modal-form { padding: 0 24px 24px; }
                .form-section { margin-bottom: 24px; }
                 .form-grid.single-col { display: flex; flex-direction: column; gap: 16px; }
                 .input-group label { display: block; font-size: 13px; font-weight: 500; color: #4b5563; margin-bottom: 6px; }
                .input-group input, .select-wrapper select {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    box-sizing: border-box;
                }
                 .select-wrapper { position: relative; }
                .select-wrapper select { padding-left: 36px; appearance: none; background: white; }
                .select-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
                 .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding-top: 20px;
                    border-top: 1px solid #f3f4f6;
                }
                .btn-text { background: transparent; border: none; color: #6b7280; font-weight: 500; cursor: pointer; padding: 10px 16px; }
                .btn-primary-large {
                    background: #4f46e5;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
                }
                 .text-right { text-align: right; }
                .action-btn { padding: 7px; border-radius: 6px; border: none; background: transparent; cursor: pointer; transition: all 0.15s; }
                .action-btn:hover { background: #f3f4f6; }
                .action-btn.edit { color: #4f46e5; }
                .action-btn.delete { color: #ef4444; }
                .loading-state, .empty-content { padding: 60px; text-align: center; color: #6b7280; background: white; border-radius: 12px; }
                 .spinner {
                    border: 3px solid #f3f3f3;
                    border-top: 3px solid #4f46e5;
                    border-radius: 50%;
                    width: 28px;
                    height: 28px;
                    animation: spin 0.8s linear infinite;
                    margin: 0 auto 12px;
                }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default GestionDepartement;
