import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBar from "../../components/SideBar";
import "../../CSS/Dashboard.css";
import { Search, Plus, Edit2, Trash2, X, User, Users, GraduationCap, Building2, Camera, Upload, ChevronDown, AlertCircle, FileCheck } from 'lucide-react';

const BASE_URL = "http://127.0.0.1:8000";

function GestionEtudiant() {
    const navigate = useNavigate();
    const [etudiants, setEtudiants] = useState([]);
    const [departements, setDepartements] = useState([]);

    // Modal Dropdown Data States
    const [filieres, setFilieres] = useState([]);
    const [groupes, setGroupes] = useState([]);

    // Filter Data States (Separate from Modal)
    const [filterFilieres, setFilterFilieres] = useState([]);
    const [filterGroupes, setFilterGroupes] = useState([]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);

    // Filter States
    const [selectedDepartement, setSelectedDepartement] = useState("");
    const [selectedFiliere, setSelectedFiliere] = useState("");
    const [selectedGroupe, setSelectedGroupe] = useState("");

    // Form Stats
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        cne: "",
        date_naissance: "",
        departement_id: "",
        filiere_id: "",
        groupe_id: ""
    });

    // Absence Details Modal States
    const [showAbsenceModal, setShowAbsenceModal] = useState(false);
    const [selectedStudentForAbsence, setSelectedStudentForAbsence] = useState(null);
    const [studentAbsences, setStudentAbsences] = useState([]);
    const [loadingAbsences, setLoadingAbsences] = useState(false);

    const handleOpenAbsenceModal = async (etu) => {
        setSelectedStudentForAbsence(etu);
        setShowAbsenceModal(true);
        setLoadingAbsences(true);
        setStudentAbsences([]);
        try {
            const res = await api.get(`attendance/admin/etudiants/${etu.user.id}/absences/`);
            setStudentAbsences(res.data.records || []);
        } catch (error) {
            console.error("Error fetching absences:", error);
            alert("Erreur lors de la récupération des absences.");
        } finally {
            setLoadingAbsences(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
            return;
        }
        fetchInitialData();
    }, [navigate]);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [etuRes, depsRes] = await Promise.all([
                api.get("accounts/etudiants/"),
                api.get("academic/departements/")
            ]);
            setEtudiants(etuRes.data);
            setDepartements(depsRes.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to fetch filieres for a department
    const getFilieresByDepartment = async (depId) => {
        if (!depId) return [];
        try {
            const res = await api.get(`academic/departements/${depId}/filieres/`);
            return res.data;
        } catch (error) {
            console.error("Error fetching filieres:", error);
            return [];
        }
    };

    // Helper to fetch groupes for a filiere
    const getGroupesByFiliere = async (filId) => {
        if (!filId) return [];
        try {
            const res = await api.get(`academic/filieres/${filId}/groupes/`);
            return res.data;
        } catch (error) {
            console.error("Error fetching groupes:", error);
            return [];
        }
    };

    // --- Filter Logic ---

    const handleDepartementFilterChange = async (depId) => {
        setSelectedDepartement(depId);
        setSelectedFiliere("");
        setSelectedGroupe("");
        setFilterGroupes([]);
        if (depId) {
            const fils = await getFilieresByDepartment(depId);
            setFilterFilieres(fils);
        } else {
            setFilterFilieres([]);
        }
    };

    const handleFiliereFilterChange = async (filId) => {
        setSelectedFiliere(filId);
        setSelectedGroupe("");
        if (filId) {
            const grps = await getGroupesByFiliere(filId);
            setFilterGroupes(grps);
        } else {
            setFilterGroupes([]);
        }
    };

    // --- Modal Logic ---

    const fetchFilieresForModal = async (depId) => {
        const fils = await getFilieresByDepartment(depId);
        setFilieres(fils);
    };

    const fetchGroupesForModal = async (filId) => {
        const grps = await getGroupesByFiliere(filId);
        setGroupes(grps);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === "departement_id") {
            setFormData(prev => ({ ...prev, filiere_id: "", groupe_id: "" }));
            setGroupes([]);
            fetchFilieresForModal(value);
        }
        if (name === "filiere_id") {
            setFormData(prev => ({ ...prev, groupe_id: "" }));
            fetchGroupesForModal(value);
        }
    };

    const resetForm = () => {
        setFormData({
            first_name: "",
            last_name: "",
            email: "",
            password: "",
            cne: "",
            date_naissance: "",
            departement_id: "",
            filiere_id: "",
            groupe_id: ""
        });
        setPhotoFile(null);
        setPhotoPreview(null);
        setFilieres([]);
        setGroupes([]);
        setIsEditing(false);
        setCurrentId(null);
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleOpenModal = (student = null) => {
        if (student) {
            setIsEditing(true);
            setCurrentId(student.user.id);

            // Note: In a real app, you might need to fetch the student's full hierarchy 
            // if the backend doesn't provide departement_id directly on the student object.
            // Based on earlier analysis, student has 'filiere' and 'groupe', and filiere has 'departement'.
            // The updated serializer now provides 'departement' ID.

            // We need to fetch the dropdown options for the existing selection
            const depId = student.departement;
            const filId = student.filiere;

            if (depId) fetchFilieresForModal(depId);
            if (filId) fetchGroupesForModal(filId);

            setFormData({
                first_name: student.user.first_name,
                last_name: student.user.last_name,
                email: student.user.email,
                password: "",
                cne: student.cne,
                date_naissance: student.date_naissance || "",
                departement_id: depId || "",
                filiere_id: filId || "",
                groupe_id: student.groupe || ""
            });
            setPhotoFile(null);
            setPhotoPreview(student.photo_profile ? `${BASE_URL}${student.photo_profile}` : null);
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const fd = new FormData();
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'password' && isEditing && !value) return;
                if (value) fd.append(key, value);
            });
            if (photoFile) {
                fd.append('photo_profile', photoFile);
            }

            const config = { headers: { 'Content-Type': 'multipart/form-data' } };

            if (isEditing) {
                await api.put(`accounts/update/${currentId}/`, fd, config);
            } else {
                await api.post("accounts/register/etudiant/", fd, config);
            }
            setShowModal(false);
            fetchInitialData();
            resetForm();
        } catch (error) {
            console.error("Error saving student:", error.response?.data || error);
            alert("Une erreur est survenue. " + JSON.stringify(error.response?.data || ""));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet étudiant ?")) {
            try {
                await api.delete(`accounts/delete/${id}/`);
                fetchInitialData();
            } catch (error) {
                console.error("Error deleting student:", error);
                alert("Impossible de supprimer cet étudiant.");
            }
        }
    };

    const filteredEtudiants = etudiants.filter(etu => {
        const matchesSearch =
            etu.user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            etu.user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            etu.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            etu.cne.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartement = selectedDepartement
            ? String(etu.departement) === String(selectedDepartement)
            : true;

        const matchesFiliere = selectedFiliere
            ? String(etu.filiere) === String(selectedFiliere)
            : true;

        const matchesGroupe = selectedGroupe
            ? String(etu.groupe) === String(selectedGroupe)
            : true;

        return matchesSearch && matchesDepartement && matchesFiliere && matchesGroupe;
    });

    const isFiltered = selectedDepartement || selectedFiliere || selectedGroupe;

    return (
        <div className="dashboard-container">
            <SideBar />

            <main className="main-content">
                <header className="page-header">
                    <div className="header-content">
                        <h1>Gestion des Étudiants</h1>
                        <p>Année Universitaire 2024 - 2025</p>
                    </div>
                    <button className="btn-add-primary" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        <span>Nouvel Étudiant</span>
                    </button>
                </header>

                <div className="content-wrapper">
                    {/* Toolbar with Search & Stats */}
                    <div className="toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher (Nom, CNE, Email)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="stats-pill">
                            <Users size={16} />
                            <span>{filteredEtudiants.length} Étudiants</span>
                        </div>
                    </div>

                    {/* Filter Bar */}
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
                                    onChange={(e) => handleFiliereFilterChange(e.target.value)}
                                    disabled={!selectedDepartement}
                                >
                                    <option value="">Toutes les filières</option>
                                    {filterFilieres.map(fil => (
                                        <option key={fil.id} value={fil.id}>{fil.nom}</option>
                                    ))}
                                </select>
                                <ChevronDown size={14} className="filter-chevron" />
                            </div>

                            <div className="filter-select-wrapper">
                                <Users size={16} className="filter-select-icon" />
                                <select
                                    value={selectedGroupe}
                                    onChange={(e) => setSelectedGroupe(e.target.value)}
                                    disabled={!selectedFiliere}
                                >
                                    <option value="">Tous les groupes</option>
                                    {filterGroupes.map(grp => (
                                        <option key={grp.id} value={grp.id}>{grp.nom}</option>
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
                                        setSelectedGroupe("");
                                        setFilterFilieres([]);
                                        setFilterGroupes([]);
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
                                    <button onClick={() => {
                                        setSelectedDepartement("");
                                        setSelectedFiliere("");
                                        setFilterFilieres([]);
                                    }}>
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                            {selectedFiliere && (
                                <span className="filter-tag filiere-tag">
                                    <GraduationCap size={12} />
                                    {filterFilieres.find(f => String(f.id) === String(selectedFiliere))?.nom}
                                    <button onClick={() => {
                                        setSelectedFiliere("");
                                        setSelectedGroupe("");
                                        setFilterGroupes([]);
                                    }}>
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                            {selectedGroupe && (
                                <span className="filter-tag groupe-tag">
                                    <Users size={12} />
                                    {filterGroupes.find(g => String(g.id) === String(selectedGroupe))?.nom}
                                    <button onClick={() => setSelectedGroupe("")}>
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}

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
                                        <th>CNE</th>
                                        <th>Étudiant</th>
                                        <th>Groupe</th>
                                        <th>Filière</th>
                                        <th>Absences</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEtudiants.map((etu) => (
                                        <tr key={etu.id}>
                                            <td><span className="cne-badge">{etu.cne}</span></td>
                                            <td>
                                                <div className="user-info">
                                                    {etu.photo_profile ? (
                                                        <img className="avatar-img" src={`${BASE_URL}${etu.photo_profile}`} alt="" />
                                                    ) : (
                                                        <div className="avatar-placeholder">
                                                            {etu.user.first_name[0]}{etu.user.last_name[0]}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="user-name">{etu.user.first_name} {etu.user.last_name}</div>
                                                        <div className="user-email">{etu.user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {etu.groupe_nom ? (
                                                    <span className="badge badge-group">{etu.groupe_nom}</span>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="filiere-info">
                                                    <GraduationCap size={14} />
                                                    {etu.filiere_nom || "-"}
                                                </div>
                                            </td>
                                            <td>
                                                <div
                                                    className="absence-cell"
                                                    style={{ cursor: 'pointer', padding: '4px', borderRadius: '4px' }}
                                                    onClick={() => handleOpenAbsenceModal(etu)}
                                                    title="Voir l'historique des absences"
                                                >
                                                    <span className="absence-count">
                                                        <AlertCircle size={14} />
                                                        {etu.nb_absences ?? 0}
                                                    </span>
                                                    {(etu.nb_absences_justifiees ?? 0) > 0 && (
                                                        <span className="justification-badge" title={`${etu.nb_absences_justifiees} justifiée(s)`}>
                                                            <FileCheck size={12} />
                                                            {etu.nb_absences_justifiees} justifiée{etu.nb_absences_justifiees !== 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="actions-cell">
                                                <button className="action-btn edit" onClick={() => handleOpenModal(etu)} title="Modifier">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button className="action-btn delete" onClick={() => handleDelete(etu.user.id)} title="Supprimer">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredEtudiants.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="empty-state">
                                                <div className="empty-content">
                                                    <Users size={48} opacity={0.2} />
                                                    <p>Aucun étudiant trouvé</p>
                                                    {isFiltered && <span className="empty-hint">Essayez de modifier vos filtres</span>}
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

            {/* Modern Modal */}
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-card">
                        <div className="modal-header-modern">
                            <div>
                                <h2>{isEditing ? "Modifier l'Étudiant" : "Nouvel Étudiant"}</h2>
                                <p>Saisissez les informations de l'étudiant ci-dessous</p>
                            </div>
                            <button className="btn-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="modal-form">
                            {/* Photo Upload Section */}
                            <div className="photo-upload-section">
                                <label htmlFor="photo-input" className="photo-upload-area">
                                    {photoPreview ? (
                                        <img src={photoPreview} alt="Preview" className="photo-preview-img" />
                                    ) : (
                                        <div className="photo-placeholder">
                                            <Camera size={28} />
                                            <span>Photo de profil</span>
                                        </div>
                                    )}
                                    <div className="photo-upload-overlay">
                                        <Upload size={16} />
                                        <span>{photoPreview ? 'Changer' : 'Ajouter'}</span>
                                    </div>
                                </label>
                                <input
                                    id="photo-input"
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    style={{ display: 'none' }}
                                    required={!isEditing && !photoFile}
                                />
                            </div>

                            <div className="form-section">
                                <h3>Informations Personnelles</h3>
                                <div className="form-grid">
                                    <div className="input-group">
                                        <label>Prénom</label>
                                        <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required placeholder="Ex: Jean" />
                                    </div>
                                    <div className="input-group">
                                        <label>Nom</label>
                                        <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required placeholder="Ex: Dupont" />
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Email</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="etudiant@ecole.ma" />
                                    </div>
                                    <div className="input-group full-width">
                                        <label>Mot de passe</label>
                                        <input
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            required={!isEditing}
                                            placeholder={isEditing ? "• • • • • • • • (Laisser vide pour conserver)" : "Mot de passe"}
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>CNE</label>
                                        <input type="text" name="cne" value={formData.cne} onChange={handleInputChange} required placeholder="Ex: D13000..." />
                                    </div>
                                    <div className="input-group">
                                        <label>Date de Naissance</label>
                                        <input type="date" name="date_naissance" value={formData.date_naissance} onChange={handleInputChange} />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Affectation Académique</h3>
                                <div className="form-grid">
                                    <div className="input-group full-width">
                                        <label>Département</label>
                                        <div className="select-wrapper">
                                            <Building2 size={18} className="select-icon" />
                                            <select name="departement_id" value={formData.departement_id} onChange={handleInputChange} required={!isEditing}>
                                                <option value="">Sélectionner un département</option>
                                                {departements.map(dep => (
                                                    <option key={dep.id} value={dep.id}>{dep.nom}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Filière</label>
                                        <div className="select-wrapper">
                                            <GraduationCap size={18} className="select-icon" />
                                            <select name="filiere_id" value={formData.filiere_id} onChange={handleInputChange} disabled={!formData.departement_id} required={!isEditing}>
                                                <option value="">Sélectionner une filière</option>
                                                {filieres.map(fil => (
                                                    <option key={fil.id} value={fil.id}>{fil.nom}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Groupe</label>
                                        <div className="select-wrapper">
                                            <Users size={18} className="select-icon" />
                                            <select name="groupe_id" value={formData.groupe_id} onChange={handleInputChange} disabled={!formData.filiere_id}>
                                                <option value="">Sélectionner un groupe</option>
                                                {groupes.map(grp => (
                                                    <option key={grp.id} value={grp.id}>{grp.nom}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn-text" onClick={() => setShowModal(false)}>Annuler</button>
                                <button type="submit" className="btn-primary-large">{isEditing ? "Enregistrer les modifications" : "Créer l'étudiant"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Absence Details Modal */}
            {showAbsenceModal && selectedStudentForAbsence && (
                <div className="modal-backdrop" onClick={() => setShowAbsenceModal(false)}>
                    <div className="modal-card absence-modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-modern">
                            <div>
                                <h2>Historique des Absences</h2>
                                <p>{selectedStudentForAbsence.user.first_name} {selectedStudentForAbsence.user.last_name} ({selectedStudentForAbsence.cne})</p>
                            </div>
                            <button className="btn-close" onClick={() => setShowAbsenceModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="absence-modal-body">
                            {loadingAbsences ? (
                                <div className="loading-state" style={{ padding: '40px' }}>
                                    <div className="spinner"></div>
                                    <p>Chargement des absences...</p>
                                </div>
                            ) : studentAbsences.length === 0 ? (
                                <div className="empty-content" style={{ padding: '40px' }}>
                                    <FileCheck size={40} opacity={0.2} />
                                    <p>Aucune absence enregistrée pour cet étudiant.</p>
                                </div>
                            ) : (
                                <div className="absence-list">
                                    {studentAbsences.map(abs => (
                                        <div key={abs.id} className="absence-item">
                                            <div className="absence-item-header">
                                                <span className="absence-date">{new Date(abs.date).toLocaleDateString('fr-FR')}</span>
                                                <span className="absence-time">{abs.heure_debut} - {abs.heure_fin}</span>
                                            </div>
                                            <div className="absence-item-details">
                                                <div className="absence-module">
                                                    <strong>Module:</strong> {abs.module_nom}
                                                </div>
                                                <div className="absence-type">
                                                    <strong>Type:</strong> {abs.type_seance}
                                                </div>
                                                {abs.justification && (
                                                    <div className="absence-justification">
                                                        <FileCheck size={14} />
                                                        Justification {abs.justification.etat.toLowerCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                /* Modern UI Overrides */
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
                    color : #535353ff;
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
                .groupe-tag {
                    background: #fdf4ff;
                    color: #d946ef;
                    border: 1px solid #f0abfc;
                }
                .groupe-tag button { color: #d946ef; }

                /* Table Card */
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
                    letter-spacing: 0.5px;
                    border-bottom: 1px solid #e5e7eb;
                }
                td {
                    padding: 16px 24px;
                    border-bottom: 1px solid #f3f4f6;
                    vertical-align: middle;
                }
                tr:last-child td { border-bottom: none; }
                tr:hover td { background: #f9fafb; transition: background 0.15s;}

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
                    font-size: 14px;
                }
                .avatar-img {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid #e0e7ff;
                }
                .user-name { font-weight: 500; color: #111827; }
                .user-email { font-size: 13px; color: #6b7280; }

                .cne-badge {
                    font-family: monospace;
                    background: #f3f4f6;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    color: #374151;
                }

                .badge {
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                }
                .badge-group {
                    background: #ecfdf5;
                    color: #059669;
                    border: 1px solid #a7f3d0;
                }

                .filiere-info {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    color: #4b5563;
                    font-size: 14px;
                }
                .absence-cell {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    font-size: 13px;
                }
                .absence-count {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    color: #b91c1c;
                    font-weight: 600;
                }
                .justification-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    background: #d1fae5;
                    color: #065f46;
                    padding: 2px 8px;
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 500;
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
                .text-muted { color: #9ca3af; font-size: 13px; }

                /* Loading & Empty States */
                .loading-state, .empty-content {
                    padding: 60px;
                    text-align: center;
                    color: #6b7280;
                    background: white; /* Consitent background */
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
                
                .empty-hint {
                    display: block;
                    font-size: 13px;
                    color: #9ca3af;
                    margin-top: 8px;
                }

                /* Modal Styling */
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
                    width: 600px;
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

                /* Photo Upload */
                .photo-upload-section {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 24px;
                }
                .photo-upload-area {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: #f3f4f6;
                    cursor: pointer;
                    border: 2px dashed #d1d5db;
                    transition: all 0.2s;
                }
                .photo-upload-area:hover { border-color: #4f46e5; }
                .photo-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    color: #9ca3af;
                    font-size: 11px;
                }
                .photo-preview-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .photo-upload-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0,0,0,0.5);
                    color: white;
                    font-size: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    padding: 4px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                .photo-upload-area:hover .photo-upload-overlay { opacity: 1; }

                /* Absence Modal Styles */
                .absence-modal-card {
                    width: 500px;
                }
                .absence-modal-body {
                    padding: 0 24px 24px;
                }
                .absence-list {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    max-height: 400px;
                    overflow-y: auto;
                    padding-right: 8px;
                }
                .absence-list::-webkit-scrollbar {
                    width: 6px;
                }
                .absence-list::-webkit-scrollbar-thumb {
                    background: #d1d5db;
                    border-radius: 4px;
                }
                .absence-item {
                    background: #f9fafb;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 14px;
                    transition: border-color 0.15s;
                }
                .absence-item:hover {
                    border-color: #d1d5db;
                }
                .absence-item-header {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-weight: 600;
                    color: #111827;
                }
                .absence-date {
                    color: #b91c1c;
                }
                .absence-time {
                    font-size: 13px;
                    color: #6b7280;
                }
                .absence-item-details {
                    font-size: 13px;
                    color: #4b5563;
                }
                .absence-module, .absence-type {
                    margin-bottom: 4px;
                }
                .absence-cell:hover {
                    background-color: #f3f4f6;
                }
                .absence-justification {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    margin-top: 8px;
                    color: #059669;
                    background: #d1fae5;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 500;
                }
            `}</style>
        </div>
    );
}

export default GestionEtudiant;
