import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBar from "../../components/SideBar";
import "../../CSS/Dashboard.css";
import { Search, Plus, Edit2, Trash2, X, MapPin } from "lucide-react";

function GestionSalles() {
    const navigate = useNavigate();
    const [salles, setSalles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);

    const [formData, setFormData] = useState({
        nom: "",
        capacite: "",
        latitude: "",
        longitude: "",
        rayon: "20",
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
            const res = await api.get("academic/salles/");
            setSalles(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error("Error fetching salles:", error);
            setSalles([]);
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
            capacite: "",
            latitude: "",
            longitude: "",
            rayon: "20",
        });
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleOpenModal = (salle = null) => {
        if (salle) {
            setIsEditing(true);
            setCurrentId(salle.id);
            setFormData({
                nom: salle.nom,
                capacite: String(salle.capacite ?? ""),
                latitude: String(salle.latitude ?? ""),
                longitude: String(salle.longitude ?? ""),
                rayon: String(salle.rayon ?? "20"),
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            nom: formData.nom.trim(),
            capacite: parseInt(formData.capacite, 10) || 30,
            latitude: parseFloat(formData.latitude) || 0,
            longitude: parseFloat(formData.longitude) || 0,
            rayon: parseFloat(formData.rayon) || 20,
        };
        try {
            if (isEditing) {
                await api.put(`academic/salles/update/${currentId}/`, payload);
            } else {
                await api.post("academic/salles/create/", payload);
            }
            setShowModal(false);
            fetchData();
            resetForm();
        } catch (error) {
            console.error("Error saving salle:", error.response?.data || error);
            alert("Une erreur est survenue. " + JSON.stringify(error.response?.data || ""));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette salle ?")) {
            try {
                await api.delete(`academic/salles/delete/${id}/`);
                fetchData();
            } catch (error) {
                console.error("Error deleting salle:", error);
                alert(
                    error.response?.data?.error ||
                    "Impossible de supprimer (la salle est peut-être liée à des séances)."
                );
            }
        }
    };

    const filteredSalles = salles.filter((s) =>
        s.nom?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="dashboard-container">
            <SideBar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-content">
                        <h1>Gestion des Salles</h1>
                        <p>Année Universitaire 2024 - 2025</p>
                    </div>
                    <button className="btn-add-primary" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        <span>Nouvelle Salle</span>
                    </button>
                </header>

                <div className="content-wrapper">
                    <div className="toolbar">
                        <div className="search-wrapper">
                            <Search className="search-icon" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher une salle..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="stats-pill">
                            <MapPin size={16} />
                            <span>{filteredSalles.length} Salle{filteredSalles.length !== 1 ? "s" : ""}</span>
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
                                        <th>Capacité</th>
                                        <th>Latitude</th>
                                        <th>Longitude</th>
                                        <th>Rayon (m)</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSalles.map((s) => (
                                        <tr key={s.id}>
                                            <td>
                                                <span className="dept-badge">{s.nom}</span>
                                            </td>
                                            <td>{s.capacite ?? "-"}</td>
                                            <td className="coord-cell">{s.latitude ?? "-"}</td>
                                            <td className="coord-cell">{s.longitude ?? "-"}</td>
                                            <td>{s.rayon ?? "-"}</td>
                                            <td className="actions-cell">
                                                <button
                                                    className="action-btn edit"
                                                    onClick={() => handleOpenModal(s)}
                                                    title="Modifier"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleDelete(s.id)}
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredSalles.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="empty-state">
                                                <div className="empty-content">
                                                    <MapPin size={48} opacity={0.2} />
                                                    <p>Aucune salle trouvée</p>
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
                                <h2>{isEditing ? "Modifier la Salle" : "Nouvelle Salle"}</h2>
                                <p>Saisissez les informations de la salle</p>
                            </div>
                            <button className="btn-close" onClick={() => setShowModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <div className="form-grid single-col">
                                    <div className="input-group">
                                        <label>Nom de la salle</label>
                                        <input
                                            type="text"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleInputChange}
                                            required
                                            placeholder="Ex: Salle 101, Amphi A..."
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Capacité (nombre de places)</label>
                                        <input
                                            type="number"
                                            name="capacite"
                                            value={formData.capacite}
                                            onChange={handleInputChange}
                                            min="1"
                                            placeholder="30"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Latitude</label>
                                        <input
                                            type="number"
                                            name="latitude"
                                            value={formData.latitude}
                                            onChange={handleInputChange}
                                            step="any"
                                            required
                                            placeholder="Ex: 33.5731"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Longitude</label>
                                        <input
                                            type="number"
                                            name="longitude"
                                            value={formData.longitude}
                                            onChange={handleInputChange}
                                            step="any"
                                            required
                                            placeholder="Ex: -7.5898"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Rayon (mètres)</label>
                                        <input
                                            type="number"
                                            name="rayon"
                                            value={formData.rayon}
                                            onChange={handleInputChange}
                                            min="0"
                                            step="0.1"
                                            placeholder="20"
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
                .btn-add-primary { background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: white; border: none; padding: 10px 20px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-weight: 500; cursor: pointer; }
                .btn-add-primary:hover { transform: translateY(-1px); }
                .content-wrapper { display: flex; flex-direction: column; gap: 16px; }
                .toolbar { display: flex; justify-content: space-between; align-items: center; background: white; padding: 1rem; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                .search-wrapper { color : #9ca3af;display: flex; align-items: center; background: #f3f4f6; border-radius: 8px; padding: 8px 12px; width: 350px; }
                .search-wrapper:focus-within { background: white; border-color: #4f46e5; }
                .search-wrapper input { color : black;border: none; background: transparent; margin-left: 8px; width: 100%; outline: none; font-size: 14px; }
                .stats-pill { display: flex; align-items: center; gap: 8px; background: #eef2ff; color: #4f46e5; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; }
                .table-card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); overflow: hidden; }
                table { width: 100%; border-collapse: collapse; }
                th { text-align: left; padding: 16px 24px; background: #f9fafb; color: #4b5563; font-weight: 600; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e5e7eb; }
                td { padding: 16px 24px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
                .dept-badge { font-weight: 600; color: #1f2937; background: #f3f4f6; padding: 4px 10px; border-radius: 6px; font-size: 13px; }
                .coord-cell { font-family: monospace; font-size: 13px; color: #6b7280; }
                .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(2px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
                .modal-card { background: white; width: 500px; max-height: 90vh; overflow-y: auto; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
                .modal-header-modern { padding: 24px 24px 0; display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
                .modal-header-modern h2 { margin: 0; font-size: 20px; color: #111827; }
                .modal-header-modern p { margin: 4px 0 0; color: #6b7280; font-size: 14px; }
                .btn-close { background: transparent; border: none; cursor: pointer; color: #9ca3af; padding: 4px; }
                .modal-form { padding: 0 24px 24px; }
                .form-section { margin-bottom: 24px; }
                .form-grid.single-col { display: flex; flex-direction: column; gap: 16px; }
                .input-group label { display: block; font-size: 13px; font-weight: 500; color: #4b5563; margin-bottom: 6px; }
                .input-group input { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
                .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding-top: 20px; border-top: 1px solid #f3f4f6; }
                .btn-text { background: transparent; border: none; color: #6b7280; font-weight: 500; cursor: pointer; padding: 10px 16px; }
                .btn-primary-large { background: #4f46e5; color: white; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 500; cursor: pointer; }
                .text-right { text-align: right; }
                .action-btn { padding: 7px; border-radius: 6px; border: none; background: transparent; cursor: pointer; }
                .action-btn.edit { color: #4f46e5; }
                .action-btn.delete { color: #ef4444; }
                .loading-state, .empty-content { padding: 60px; text-align: center; color: #6b7280; background: white; border-radius: 12px; }
                .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #4f46e5; border-radius: 50%; width: 28px; height: 28px; animation: spin 0.8s linear infinite; margin: 0 auto 12px; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

export default GestionSalles;
