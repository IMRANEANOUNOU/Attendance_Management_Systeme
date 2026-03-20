import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBar from "../../components/SideBar";
import "../../CSS/Dashboard.css";
import { Search, Plus, Edit2, Trash2, X, Users, Building2, GraduationCap, ChevronDown, BookOpen } from 'lucide-react';

function GestionProf() {
    const navigate = useNavigate();
    const [professeurs, setProfesseurs] = useState([]);
    const [departements, setDepartements] = useState([]);
    const [filieres, setFilieres] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    // Filter States
    const [selectedDepartement, setSelectedDepartement] = useState("");
    const [selectedFiliere, setSelectedFiliere] = useState("");

    // Form Stats
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        matricule: "",
        specialite: "",
        departement_id: ""
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
            const [profsRes, depsRes] = await Promise.all([
                api.get("accounts/professeurs/"),
                api.get("academic/departements/")
            ]);
            setProfesseurs(profsRes.data);
            setDepartements(depsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch filieres when a department is selected for filtering
    const fetchFilieresForFilter = async (depId) => {
        if (!depId) {
            setFilieres([]);
            setSelectedFiliere("");
            return;
        }
        try {
            const res = await api.get(`academic/departements/${depId}/filieres/`);
            setFilieres(res.data);
        } catch (error) {
            console.error("Error fetching filieres:", error);
            setFilieres([]);
        }
    };

    const handleDepartementFilterChange = (depId) => {
        setSelectedDepartement(depId);
        setSelectedFiliere("");
        fetchFilieresForFilter(depId);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const resetForm = () => {
        setFormData({
            first_name: "",
            last_name: "",
            email: "",
            password: "",
            matricule: "",
            specialite: "",
            departement_id: ""
        });
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleOpenModal = (prof = null) => {
        if (prof) {
            setIsEditing(true);
            setCurrentId(prof.user.id);
            setFormData({
                first_name: prof.user.first_name,
                last_name: prof.user.last_name,
                email: prof.user.email,
                password: "",
                matricule: prof.matricule,
                specialite: prof.specialite,
                departement_id: prof.departement ? prof.departement : ""
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                const dataToSend = { ...formData };
                if (!dataToSend.password) delete dataToSend.password;
                await api.put(`accounts/update/${currentId}/`, dataToSend);
            } else {
                await api.post("accounts/register/professeur/", formData);
            }
            setShowModal(false);
            fetchData();
            resetForm();
        } catch (error) {
            console.error("Error saving professor:", error.response?.data || error);
            alert("Une erreur est survenue. Vérifiez les données.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer ce professeur ?")) {
            try {
                await api.delete(`accounts/delete/${id}/`);
                fetchData();
            } catch (error) {
                console.error("Error deleting professor:", error);
                alert("Impossible de supprimer ce professeur.");
            }
        }
    };

    // Filter logic: by search, department, and filiere (via modules)
    const filteredProfs = professeurs.filter(prof => {
        const matchesSearch =
            prof.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prof.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prof.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            prof.matricule.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartement = selectedDepartement
            ? String(prof.departement) === String(selectedDepartement)
            : true;

        // Filiere filtering: professors are linked to filières through modules
        const matchesFiliere = selectedFiliere
            ? prof.modules && prof.modules.some(m => String(m.filiere) === String(selectedFiliere))
            : true;

        return matchesSearch && matchesDepartement && matchesFiliere;
    });

    // Group professors by department for the classified view
    const groupedByDepartment = {};
    filteredProfs.forEach(prof => {
        const depId = prof.departement || "none";
        const depName = departements.find(d => d.id === prof.departement)?.nom || "Sans département";
        if (!groupedByDepartment[depId]) {
            groupedByDepartment[depId] = { name: depName, profs: [] };
        }
        groupedByDepartment[depId].profs.push(prof);
    });

    const isFiltered = selectedDepartement || selectedFiliere;

    return (
        <div className="dashboard-container">
            <SideBar />

            <main className="main-content">
                <header className="page-header">
                    <div className="header-content">
                        <h1>Gestion des Professeurs</h1>
                        <p>Gérez les enseignants par département et filière</p>
                    </div>
                    <button className="btn-add-primary" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        <span>Nouveau Professeur</span>
                    </button>
                </header>

                <div className="content-wrapper">
                    {/* Toolbar with Search & Filters */}
                    <div className="toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, email, matricule..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="stats-pill">
                            <Users size={16} />
                            <span>{filteredProfs.length} Professeur{filteredProfs.length !== 1 ? 's' : ''}</span>
                        </div>
                    </div>

                    {/* Classification Filters */}
                    <div className="filter-bar">
                        <div className="filter-label">
                            <Building2 size={16} />
                            <span>Filtrer par :</span>
                        </div>
                        <div className="filter-group">
                            <div className="filter-select-wrapper">
                                <Building2 size={16} className="filter-select-icon" />
                                <select
                                    value={selectedDepartement}
                                    onChange={(e) => handleDepartementFilterChange(e.target.value)}
                                >
                                    <option value="">Tous les départements</option>
                                    {departements.map(dep => (
                                        <option key={dep.id} value={dep.id}>{dep.nom}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="filter-chevron" />
                            </div>

                            <div className="filter-select-wrapper">
                                <GraduationCap size={16} className="filter-select-icon" />
                                <select
                                    value={selectedFiliere}
                                    onChange={(e) => setSelectedFiliere(e.target.value)}
                                    disabled={!selectedDepartement}
                                >
                                    <option value="">Toutes les filières</option>
                                    {filieres.map(fil => (
                                        <option key={fil.id} value={fil.id}>{fil.nom}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="filter-chevron" />
                            </div>

                            {isFiltered && (
                                <button
                                    className="filter-clear-btn"
                                    onClick={() => {
                                        setSelectedDepartement("");
                                        setSelectedFiliere("");
                                        setFilieres([]);
                                    }}
                                >
                                    <X size={14} />
                                    Réinitialiser
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Active Filter Tags */}
                    {isFiltered && (
                        <div className="active-filters">
                            {selectedDepartement && (
                                <span className="filter-tag dept-tag">
                                    <Building2 size={12} />
                                    {departements.find(d => String(d.id) === String(selectedDepartement))?.nom}
                                    <button onClick={() => { setSelectedDepartement(""); setSelectedFiliere(""); setFilieres([]); }}>
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                            {selectedFiliere && (
                                <span className="filter-tag filiere-tag">
                                    <GraduationCap size={12} />
                                    {filieres.find(f => String(f.id) === String(selectedFiliere))?.nom}
                                    <button onClick={() => setSelectedFiliere("")}>
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}

                    {/* Main Content */}
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Chargement des données...</p>
                        </div>
                    ) : filteredProfs.length === 0 ? (
                        <div className="empty-state-card">
                            <Users size={48} opacity={0.2} />
                            <p>Aucun professeur trouvé</p>
                            {isFiltered && <span className="empty-hint">Essayez de modifier vos filtres</span>}
                        </div>
                    ) : (
                        /* Grouped by Department View */
                        Object.entries(groupedByDepartment).map(([depId, group]) => (
                            <div key={depId} className="department-section">
                                <div className="department-header">
                                    <div className="department-title">
                                        <Building2 size={18} />
                                        <h2>{group.name}</h2>
                                        <span className="dept-count">{group.profs.length} professeur{group.profs.length !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                                <div className="table-card">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Matricule</th>
                                                <th>Professeur</th>
                                                <th>Email</th>
                                                <th>Spécialité</th>
                                                <th className="text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {group.profs.map((prof) => (
                                                <tr key={prof.id}>
                                                    <td><span className="matricule-badge">{prof.matricule}</span></td>
                                                    <td>
                                                        <div className="user-info">
                                                            <div className="avatar-placeholder">
                                                                {prof.user.first_name[0]}{prof.user.last_name[0]}
                                                            </div>
                                                            <div className="user-name">{prof.user.first_name} {prof.user.last_name}</div>
                                                        </div>
                                                    </td>
                                                    <td><span className="user-email">{prof.user.email}</span></td>
                                                    <td>
                                                        <span className="specialite-badge">
                                                            <BookOpen size={12} />
                                                            {prof.specialite}
                                                        </span>
                                                    </td>
                                                    <td className="actions-cell">
                                                        <button className="action-btn edit" onClick={() => handleOpenModal(prof)} title="Modifier">
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button className="action-btn delete" onClick={() => handleDelete(prof.user.id)} title="Supprimer">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <div className="modal-header-modern">
                            <div>
                                <h2>{isEditing ? "Modifier Professeur" : "Nouveau Professeur"}</h2>
                                <p>Saisissez les informations du professeur</p>
                            </div>
                            <button className="btn-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <h3>Informations Personnelles</h3>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Prénom</label>
                                        <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required placeholder="Ex: Ahmed" />
                                    </div>
                                    <div className="input-group">
                                        <label>Nom</label>
                                        <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required placeholder="Ex: Bennani" />
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="professeur@ecole.ma" />
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Mot de passe {isEditing && "(Laisser vide pour ne pas changer)"}</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required={!isEditing}
                                            placeholder={isEditing ? "• • • • • • • • (Laisser vide pour conserver)" : "Mot de passe"}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Informations Académiques</h3>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Matricule</label>
                                        <input type="text" name="matricule" value={formData.matricule} onChange={handleInputChange} required placeholder="Ex: PROF-001" />
                                    </div>
                                    <div className="input-group">
                                        <label>Spécialité</label>
                                        <input type="text" name="specialite" value={formData.specialite} onChange={handleInputChange} required placeholder="Ex: Informatique" />
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Département</label>
                                        <div className="select-wrapper">
                                            <Building2 size={18} className="select-icon" />
                                            <select name="departement_id" value={formData.departement_id} onChange={handleInputChange}>
                                                <option value="">Sélectionner un département</option>
                                                {departements.map(dep => (
                                                    <option key={dep.id} value={dep.id}>{dep.nom}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-text" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary-large">{isEditing ? "Enregistrer les modifications" : "Créer le professeur"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                /* Page Header */
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

                /* Toolbar */
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

                /* Filter Bar */
                .filter-bar {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: white;
                    padding: 12px 16px;
                    border-radius: 12px;
                    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                    border: 1px solid #e5e7eb;
                }
                .filter-label {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #6b7280;
                    font-size: 13px;
                    font-weight: 600;
                    white-space: nowrap;
                }
                .filter-group {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex-wrap: wrap;
                }
                .filter-select-wrapper {
                    position: relative;
                    display: flex;
                    align-items: center;
                }
                .filter-select-wrapper select {
                    appearance: none;
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 7px 32px 7px 34px;
                    font-size: 13px;
                    color: #374151;
                    cursor: pointer;
                    transition: all 0.15s;
                    outline: none;
                    min-width: 200px;
                }
                .filter-select-wrapper select:focus {
                    border-color: #4f46e5;
                    box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
                }
                .filter-select-wrapper select:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .filter-select-icon {
                    position: absolute;
                    left: 10px;
                    color: #9ca3af;
                    pointer-events: none;
                    z-index: 1;
                }
                .filter-chevron {
                    position: absolute;
                    right: 10px;
                    color: #9ca3af;
                    pointer-events: none;
                }
                .filter-clear-btn {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    background: #fef2f2;
                    color: #ef4444;
                    border: 1px solid #fecaca;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .filter-clear-btn:hover {
                    background: #fee2e2;
                }

                /* Active Filter Tags */
                .active-filters {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .filter-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 4px 10px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                    animation: fadeIn 0.2s;
                }
                .filter-tag button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    display: flex;
                    opacity: 0.6;
                    transition: opacity 0.15s;
                }
                .filter-tag button:hover { opacity: 1; }
                .dept-tag {
                    background: #eff6ff;
                    color: #2563eb;
                    border: 1px solid #bfdbfe;
                }
                .dept-tag button { color: #2563eb; }
                .filiere-tag {
                    background: #f0fdf4;
                    color: #16a34a;
                    border: 1px solid #bbf7d0;
                }
                .filiere-tag button { color: #16a34a; }

                /* Department Section */
                .department-section {
                    animation: fadeIn 0.3s;
                }
                .department-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .department-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #374151;
                }
                .department-title h2 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                .dept-count {
                    background: #f3f4f6;
                    color: #6b7280;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }

                /* Table Card */
                .table-card {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    overflow: hidden;
                }
                table { width: 100%; border-collapse: collapse; }
                th {
                    text-align: left;
                    padding: 14px 24px;
                    background: #f9fafb;
                    color: #4b5563;
                    font-weight: 600;
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid #e5e7eb;
                }
                td {
                    padding: 14px 24px;
                    border-bottom: 1px solid #f3f4f6;
                    vertical-align: middle;
                    font-size: 14px;
                }
                tr:last-child td { border-bottom: none; }
                tr:hover td { background: #f9fafb; transition: background 0.15s; }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .avatar-placeholder {
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
                    color: #4f46e5;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    font-size: 13px;
                    flex-shrink: 0;
                }
                .user-name { font-weight: 500; color: #111827; }
                .user-email { font-size: 13px; color: #6b7280; }

                .matricule-badge {
                    font-family: 'SF Mono', 'Fira Code', monospace;
                    background: #f3f4f6;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    color: #374151;
                }
                .specialite-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    background: #fef3c7;
                    color: #92400e;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .actions-cell {
                    display: flex;
                    justify-content: flex-end;
                    gap: 6px;
                }
                .action-btn {
                    padding: 7px;
                    border-radius: 6px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.15s;
                }
                .action-btn:hover { background: #f3f4f6; }
                .action-btn.edit { color: #4f46e5; }
                .action-btn.edit:hover { background: #eef2ff; }
                .action-btn.delete { color: #ef4444; }
                .action-btn.delete:hover { background: #fef2f2; }
                .text-right { text-align: right; }

                /* Empty & Loading States */
                .loading-state {
                    padding: 60px;
                    text-align: center;
                    color: #6b7280;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
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
                .empty-state-card {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    padding: 60px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    color: #6b7280;
                }
                .empty-hint {
                    font-size: 13px;
                    color: #9ca3af;
                }

                /* Modal */
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
                    width: 560px;
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
                .modal-header-modern h2 {
                    margin: 0;
                    font-size: 20px;
                    color: #111827;
                }
                .modal-header-modern p {
                    margin: 4px 0 0;
                    color: #6b7280;
                    font-size: 14px;
                }
                .btn-close {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: #9ca3af;
                    padding: 4px;
                    border-radius: 4px;
                }
                .btn-close:hover { background: #f3f4f6; color: #4b5563; }

                .modal-form { padding: 0 24px 24px; }
                .form-section { margin-bottom: 24px; }
                .form-section h3 {
                    font-size: 13px;
                    font-weight: 600;
                    color: #374151;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 16px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #f3f4f6;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }
                .full-width { grid-column: span 2; }
                .input-group label {
                    display: block;
                    font-size: 13px;
                    font-weight: 500;
                    color: #4b5563;
                    margin-bottom: 6px;
                }
                .input-group input, .select-wrapper select {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.15s;
                    box-sizing: border-box;
                }
                .select-wrapper {
                    position: relative;
                }
                .select-wrapper select {
                    padding-left: 36px;
                    appearance: none;
                    background-color: white;
                }
                .select-icon {
                    position: absolute;
                    left: 10px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #9ca3af;
                    pointer-events: none;
                }
                .input-group input:focus, .select-wrapper select:focus {
                    border-color: #4f46e5;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }

                .modal-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding-top: 20px;
                    border-top: 1px solid #f3f4f6;
                }
                .btn-text {
                    background: transparent;
                    border: none;
                    color: #6b7280;
                    font-weight: 500;
                    cursor: pointer;
                    padding: 10px 16px;
                }
                .btn-text:hover { color: #111827; }
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
                .btn-primary-large:hover { background: #4338ca; }
            `}</style>
        </div>
    );
}

export default GestionProf;