import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBar from "../../components/SideBar";
import "../../CSS/Dashboard.css";
import { Search, Plus, Edit2, Trash2, X, GraduationCap, Building2 } from "lucide-react";

const TYPE_DIPLOME_OPTIONS = [
    { value: "DUT", label: "Diplôme Universitaire de Technologie" },
    { value: "BACHELOR", label: "Bachelor" },
];

function GestionFiliere() {
    const navigate = useNavigate();
    const [filieres, setFilieres] = useState([]);
    const [departements, setDepartements] = useState([]);
    const [professors, setProfessors] = useState([]);
    const [selectedChefs, setSelectedChefs] = useState({});
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [selectedDepartement, setSelectedDepartement] = useState("");

    const [formData, setFormData] = useState({
        nom: "",
        description: "",
        type_diplome: "DUT",
        departement_id: "",
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
            const [filRes, depsRes, profsRes] = await Promise.all([
                api.get("academic/filieres/"),
                api.get("academic/departements/"),
                api.get("accounts/professeurs/"),
            ]);
            const fetchedFilieres = Array.isArray(filRes.data) ? filRes.data : [];
            setFilieres(fetchedFilieres);
            setDepartements(depsRes.data || []);
            setProfessors(profsRes.data || []);

            const initialChefs = {};
            fetchedFilieres.forEach(f => {
                if (f.chef) {
                    initialChefs[f.id] = f.chef;
                }
            });
            setSelectedChefs(initialChefs);
        } catch (error) {
            console.error("Error fetching data:", error);
            setFilieres([]);
            setProfessors([]);
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
            description: "",
            type_diplome: "DUT",
            departement_id: "",
        });
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleOpenModal = (filiere = null) => {
        if (filiere) {
            setIsEditing(true);
            setCurrentId(filiere.id);
            setFormData({
                nom: filiere.nom,
                description: filiere.description || "",
                type_diplome: filiere.type_diplome || "DUT",
                departement_id: filiere.departement || "",
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
                await api.put(`academic/filieres/update/${currentId}/`, {
                    nom: formData.nom,
                    description: formData.description,
                    type_diplome: formData.type_diplome,
                });
            } else {
                if (!formData.departement_id) {
                    alert("Veuillez sélectionner un département.");
                    return;
                }
                await api.post(
                    `academic/departements/${formData.departement_id}/filieres/create/`,
                    {
                        nom: formData.nom,
                        description: formData.description,
                        type_diplome: formData.type_diplome,
                    }
                );
            }
            setShowModal(false);
            fetchData();
            resetForm();
        } catch (error) {
            console.error("Error saving filière:", error.response?.data || error);
            alert("Une erreur est survenue. " + JSON.stringify(error.response?.data || ""));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette filière ?")) {
            try {
                await api.delete(`academic/filieres/delete/${id}/`);
                fetchData();
            } catch (error) {
                console.error("Error deleting filière:", error);
                alert(
                    error.response?.data?.error ||
                    "Impossible de supprimer (la filière contient peut-être des groupes)."
                );
            }
        }
    };

    const handleAssignChef = async (filiereId) => {
        try {
            const profId = selectedChefs[filiereId];
            if (!profId) {
                alert("Veuillez sélectionner un professeur.");
                return;
            }
            await api.put(`academic/departement/filiere/${filiereId}/assign-chef/`, { prof_id: profId });
            alert("Chef de filière assigné avec succès.");
            fetchData();
        } catch (error) {
            console.error("Error assigning chef:", error);
            alert(error.response?.data?.error || "Une erreur est survenue lors de l'assignation du chef.");
        }
    };

    const handleChefSelectChange = (filiereId, profId) => {
        setSelectedChefs(prev => ({ ...prev, [filiereId]: profId }));
    };

    const filteredFilieres = filieres.filter((f) => {
        const matchesSearch =
            f.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            f.departement_nom?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDep = selectedDepartement === "" || String(f.departement) === selectedDepartement;

        return matchesSearch && matchesDep;
    });

    const getTypeDiplomeLabel = (value) =>
        TYPE_DIPLOME_OPTIONS.find((o) => o.value === value)?.label || value;

    return (
        <div className="dashboard-container">
            <SideBar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-content">
                        <h1>Gestion des Filières</h1>
                        <p>Année Universitaire 2024 - 2025</p>
                    </div>
                    <button className="btn-add-primary" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        <span>Nouvelle Filière</span>
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
                                <Building2 size={18} className="filter-icon" />
                                <select
                                    className="filter-select"
                                    value={selectedDepartement}
                                    onChange={(e) => setSelectedDepartement(e.target.value)}
                                >
                                    <option value="">Tous les départements</option>
                                    {departements.map((d) => (
                                        <option key={d.id} value={d.id}>
                                            {d.nom}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="stats-pill">
                            <GraduationCap size={16} />
                            <span>{filteredFilieres.length} Filière{filteredFilieres.length !== 1 ? "s" : ""}</span>
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
                                        <th>Département</th>
                                        <th>Type diplôme</th>
                                        <th>Chef Actuel</th>
                                        <th>Assignation Chef</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFilieres.map((f) => (
                                        <tr key={f.id}>
                                            <td>
                                                <span className="dept-badge">{f.nom}</span>
                                            </td>
                                            <td>
                                                <div className="user-info-mini">
                                                    <Building2 size={14} />
                                                    <span>{f.departement_nom || "-"}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="type-badge">{getTypeDiplomeLabel(f.type_diplome)}</span>
                                            </td>
                                            <td>
                                                <span
                                                    style={{
                                                        fontSize: '14px',
                                                        fontWeight: '500',
                                                        color: '#374151',
                                                        display: 'block'
                                                    }}
                                                >
                                                    {f.chef_nom || "Non assigné"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <select
                                                        className="select-wrapper"
                                                        style={{ padding: '6px 10px', color: 'black', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', backgroundColor: 'white' }}
                                                        value={selectedChefs[f.id] || ""}
                                                        onChange={(e) => handleChefSelectChange(f.id, e.target.value)}
                                                    >
                                                        <option value="">Sélectionner</option>
                                                        {professors
                                                            .filter(p => !p.departement || p.departement === f.departement)
                                                            .map(p => (
                                                                <option key={p.id} value={p.id}>
                                                                    {p.user?.last_name} {p.user?.first_name}
                                                                </option>
                                                            ))}
                                                    </select>
                                                    <button
                                                        className="btn-primary-small"
                                                        onClick={() => handleAssignChef(f.id)}
                                                        style={{ padding: '6px 12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="actions-cell">
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => handleOpenModal(f)}
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(f.id)}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredFilieres.length === 0 && (
                                        <tr>
                                            <td colSpan="5" className="empty-state">
                                                <div className="empty-content">
                                                    <GraduationCap size={48} opacity={0.2} />
                                                    <p>Aucune filière trouvée</p>
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
                                <h2>{isEditing ? "Modifier la Filière" : "Nouvelle Filière"}</h2>
                                <p>Saisissez les informations de la filière</p>
                            </div>
                            <button className="btn-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <div className="form-grid single-col">
                                    <div className="input-group">
                                        <label>Nom de la filière</label>
                                        <input
                                            type="text"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Ex: Informatique, Génie Civil..."
                                        />
                                    </div>
                                    {!isEditing && (
                                        <div className="input-group">
                                            <label>Département</label>
                                            <div className="select-wrapper">
                                                <Building2 size={18} className="select-icon" />
                                                <select
                                                    name="departement_id"
                                                    value={formData.departement_id}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="">Sélectionner un département</option>
                                                    {departements.map((d) => (
                                                        <option key={d.id} value={d.id}>
                                                            {d.nom}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                    <div className="input-group">
                                        <label>Type de diplôme</label>
                                        <select
                                            name="type_diplome"
                                            value={formData.type_diplome}
                                            onChange={handleInputChange}
                                            className="select-wrapper"
                                            style={{ width: "100%", padding: "10px" }}
                                        >
                                            {TYPE_DIPLOME_OPTIONS.map((opt) => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Description optionnelle..."
                                            rows="3"
                                            className="form-textarea"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-text" onClick={() => setShowModal(false)}>
                                    Annuler
                                </button>
                                <button type="submit" className="btn-primary-large">
                                    {isEditing ? "Enregistrer" : "Créer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .header-content h1 { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
                .header-content p { color: #6b7280; margin: 4px 0 0 0; font-size: 14px; }
                .btn-add-primary { background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 500; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2); transition: all 0.2s; }
                .btn-add-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 8px -1px rgba(79, 70, 229, 0.3); }
                .content-wrapper { display: flex; flex-direction: column; gap: 16px; }
                .toolbar { display: flex; justify-content: space-between; align-items: center; background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .search-wrapper { display: flex;color: black; align-items: center; background: #f3f4f6; border-radius: 8px; padding: 8px 12px;width: 350px; border: 1px solid transparent; transition: all 0.2s; }
                .search-wrapper:focus-within { background: white; border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1); }
                .search-icon { color: #9ca3af; }
                .search-wrapper input { border: none;color : black; background: transparent; margin-left: 8px; width: 100%; outline: none; font-size: 14px; }
                .stats-pill { display: flex; align-items: center; gap: 8px; background: #eef2ff; color: #4f46e5; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
                .table-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; animation: fadeIn 0.3s; }
                table { width: 100%; border-collapse: collapse; }
                th { text-align: left; padding: 16px 24px; background: #f9fafb; color: #4b5563; font-weight: 600; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
                td { padding: 16px 24px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
                .dept-badge { font-weight: 600; color: #1f2937; background: #f3f4f6; padding: 4px 10px; border-radius: 6px; font-size: 13px; }
                .type-badge { background: #dbeafe; color: #1d4ed8; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500; }
                .user-info-mini { display: flex; align-items: center; gap: 6px; color: #4b5563; font-size: 14px; }
                .desc-cell { color: #6b7280; font-size: 14px; max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .form-textarea { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; resize: vertical; font-family: inherit; box-sizing: border-box; }
                .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
                .modal-card { background: white; width: 500px; max-height: 90vh; overflow-y: auto; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: slideUp 0.3s; }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .modal-header-modern { padding: 24px 24px 0; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .modal-header-modern h2 { margin: 0; font-size: 20px; color: #111827; }
                .modal-header-modern p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
                .btn-close { background: transparent; border: none; cursor: pointer; color: #9ca3af; padding: 4px; }
                .modal-form { padding: 0 24px 24px; }
                .form-section { margin-bottom: 24px; }
                .form-grid.single-col { display: flex; flex-direction: column; gap: 16px; }
                .input-group label { display: block; font-size: 13px; font-weight: 500; color: #4b5563; margin-bottom: 6px; }
                .input-group input, .select-wrapper select, .input-group select { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
                .select-wrapper { position: relative; }
                .select-wrapper select { padding-left: 36px; appearance: none; background: white; }
                .select-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
                .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding-top: 20px; border-top: 1px solid #f3f4f6; }
                .btn-text { background: transparent; border: none; color: #6b7280; font-weight: 500; cursor: pointer; padding: 10px 16px; }
                .btn-primary-large { background: #4f46e5; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 500; cursor: pointer; }
                .text-right { text-align: right; }
                .action-btn { padding: 7px; border-radius: 6px; border: none; background: transparent; cursor: pointer; transition: all 0.15s; }
                .action-btn.edit { color: #4f46e5; }
                .action-btn.delete { color: #ef4444; }
                .loading-state, .empty-content { padding: 60px; text-align: center; color: #6b7280; background: white; border-radius: 12px; }
                .filters-wrapper { display: flex; gap: 12px; align-items: center; }
                .filter-group-wrapper { position: relative; display: flex; align-items: center; background: #f3f4f6; border-radius: 8px; padding: 8px 12px; min-width: 220px; border: 1px solid transparent; }
                .filter-icon { color: #9ca3af; margin-right: 8px; }
                .filter-select { border: none; background: transparent; outline: none; font-size: 14px; color: #1f2937; width: 100%; cursor: pointer; }
                .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #4f46e5; border-radius: 50%; width: 28px; height: 28px; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default GestionFiliere;
