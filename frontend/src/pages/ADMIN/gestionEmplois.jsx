import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBar from "../../components/SideBar";
import "../../CSS/Dashboard.css";
import { Search, Plus, Edit2, Trash2, X, Calendar, Clock, BookOpen, MapPin, Users } from "lucide-react";

const JOURS = [
    { value: "LUNDI", label: "Lundi" },
    { value: "MARDI", label: "Mardi" },
    { value: "MERCREDI", label: "Mercredi" },
    { value: "JEUDI", label: "Jeudi" },
    { value: "VENDREDI", label: "Vendredi" },
    { value: "SAMEDI", label: "Samedi" },
    { value: "DIMANCHE", label: "Dimanche" },
];
const TYPE_SEANCE = [
    { value: "COURS", label: "Cours" },
    { value: "TP", label: "TP" },
    { value: "TD", label: "TD" },
];
const STATUT_SEANCE = [
    { value: "PROGRAMMEE", label: "Programmée" },
    { value: "EN_COURS", label: "En cours" },
    { value: "CLOTUREE", label: "Clôturée" },
    { value: "ANNULEE", label: "Annulée" },
];

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08 → 22
const DAY_LABELS = {
    LUNDI: "Lundi", MARDI: "Mardi", MERCREDI: "Mercredi",
    JEUDI: "Jeudi", VENDREDI: "Vendredi", SAMEDI: "Samedi", DIMANCHE: "Dimanche",
};

function formatTime(str) {
    if (!str) return "";
    if (typeof str === "string" && str.length >= 5) return str.slice(0, 5);
    return str;
}

const getMinutes = (t) => { if (!t) return 0; const [h, m] = t.split(":").map(Number); return h * 60 + m; };

function GestionEmplois() {
    const navigate = useNavigate();
    const [seances, setSeances] = useState([]);
    const [modules, setModules] = useState([]);
    const [groupes, setGroupes] = useState([]);
    const [salles, setSalles] = useState([]);
    const [professeurs, setProfesseurs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [selectedGroupe, setSelectedGroupe] = useState("");

    const [formData, setFormData] = useState({
        jour: "LUNDI",
        seance_id: "1",
        heure_debut: "08:00",
        heure_fin: "10:00",
        type_seance: "COURS",
        statut_seance: "PROGRAMMEE",
        module: "",
        groupe: "",
        salle: "",
        professeur: "",
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
            const [seaRes, modRes, grpRes, salRes, profRes] = await Promise.all([
                api.get("schedule/seances/"),
                api.get("academic/modules/"),
                api.get("academic/groupes/"),
                api.get("academic/salles/"),
                api.get("accounts/professeurs/"),
            ]);
            setSeances(Array.isArray(seaRes.data) ? seaRes.data : []);
            const modList = modRes.data?.modules ?? modRes.data;
            setModules(Array.isArray(modList) ? modList : []);
            setGroupes(Array.isArray(grpRes.data) ? grpRes.data : []);
            setSalles(Array.isArray(salRes.data) ? salRes.data : []);
            setProfesseurs(Array.isArray(profRes.data) ? profRes.data : []);
        } catch (error) {
            console.error("Error fetching data:", error);
            setSeances([]);
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
            jour: "LUNDI",
            seance_id: "1",
            heure_debut: "08:00",
            heure_fin: "10:00",
            type_seance: "COURS",
            statut_seance: "PROGRAMMEE",
            module: "",
            groupe: "",
            salle: "",
            professeur: "",
        });
        setIsEditing(false);
        setCurrentId(null);
    };

    const handleOpenModal = (s = null) => {
        if (s) {
            setIsEditing(true);
            setCurrentId(s.id);
            setFormData({
                jour: s.jour || "LUNDI",
                seance_id: String(s.seance_id ?? 1),
                heure_debut: formatTime(s.heure_debut),
                heure_fin: formatTime(s.heure_fin),
                type_seance: s.type_seance || "COURS",
                statut_seance: s.statut_seance || "PROGRAMMEE",
                module: s.module || "",
                groupe: s.groupe || "",
                salle: s.salle || "",
                professeur: s.professeur || "",
            });
        } else {
            resetForm();
        }
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            jour: formData.jour,
            seance_id: parseInt(formData.seance_id, 10) || 1,
            heure_debut: formData.heure_debut,
            heure_fin: formData.heure_fin,
            type_seance: formData.type_seance,
            statut_seance: formData.statut_seance,
            module: formData.module || null,
            groupe: formData.groupe || null,
            salle: formData.salle || null,
            professeur: formData.professeur || null,
        };
        try {
            if (isEditing) {
                await api.put(`schedule/seances/${currentId}/`, payload);
            } else {
                await api.post("schedule/seances/", payload);
            }
            setShowModal(false);
            fetchData();
            resetForm();
        } catch (error) {
            console.error("Error saving séance:", error.response?.data || error);
            alert("Une erreur est survenue. " + JSON.stringify(error.response?.data || ""));
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Supprimer cette séance de l'emploi du temps ?")) {
            try {
                await api.delete(`schedule/seances/${id}/`);
                fetchData();
            } catch (error) {
                console.error("Error deleting séance:", error);
                alert(error.response?.data?.detail || "Impossible de supprimer.");
            }
        }
    };

    const filteredSeances = seances.filter((s) => {
        const matchesSearch =
            s.module_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.groupe_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.prof_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.salle_nom?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesGroupe = selectedGroupe === "" || String(s.groupe) === selectedGroupe;

        return matchesSearch && matchesGroupe;
    });

    const JOUR_ORDER = { LUNDI: 0, MARDI: 1, MERCREDI: 2, JEUDI: 3, VENDREDI: 4 };
    const sortSeances = (list) =>
        [...list].sort((a, b) => {
            const dayA = JOUR_ORDER[a.jour] ?? 99;
            const dayB = JOUR_ORDER[b.jour] ?? 99;
            if (dayA !== dayB) return dayA - dayB;
            return String(a.heure_debut || "").localeCompare(String(b.heure_debut || ""));
        });

    const groupedByGroupe = React.useMemo(() => {
        const byId = {};
        filteredSeances.forEach((s) => {
            const gid = s.groupe ?? "sans-groupe";
            const gnom = s.groupe_nom || "Sans groupe";
            if (!byId[gid]) byId[gid] = { groupeId: gid, groupeNom: gnom, seances: [] };
            byId[gid].seances.push(s);
        });
        Object.values(byId).forEach((g) => {
            g.seances = sortSeances(g.seances);
        });
        return Object.values(byId).sort((a, b) => a.groupeNom.localeCompare(b.groupeNom));
    }, [filteredSeances]);

    const getJourLabel = (v) => JOURS.find((j) => j.value === v)?.label || v;
    const getTypeLabel = (v) => TYPE_SEANCE.find((t) => t.value === v)?.label || v;

    return (
        <div className="dashboard-container">
            <SideBar />
            <main className="main-content">
                <header className="page-header">
                    <div className="header-content">
                        <h1>Emploi du temps</h1>
                        <p>Gestion des séances — Année Universitaire 2024 - 2025</p>
                    </div>
                    <button className="btn-add-primary" onClick={() => handleOpenModal()}>
                        <Plus size={20} />
                        <span>Nouvelle séance</span>
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
                                <Users size={18} className="filter-icon" />
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
                            <Calendar size={16} />
                            <span>{filteredSeances.length} séance{filteredSeances.length !== 1 ? "s" : ""}</span>
                        </div>
                    </div>
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Chargement...</p>
                        </div>
                    ) : filteredSeances.length === 0 ? (
                        <div className="table-card empty-state-card">
                            <div className="empty-content">
                                <Calendar size={48} opacity={0.2} />
                                <p>Aucune séance. Ajoutez des séances pour construire l'emploi du temps.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="emploi-by-groupe">
                            {groupedByGroupe.map((group) => (
                                <div key={group.groupeId} className="emploi-groupe-section">
                                    <div className="emploi-groupe-header">
                                        <Users size={20} />
                                        <h2>Groupe {group.groupeNom}</h2>
                                        <span className="emploi-groupe-count">{group.seances.length} séance{group.seances.length !== 1 ? "s" : ""}</span>
                                    </div>

                                    <div className="me-container">
                                        <div className="me-grid">
                                            {/* Header */}
                                            <div className="me-corner"></div>
                                            {JOURS.map((d) => (
                                                <div key={d.value} className="me-day-header">
                                                    {d.label}
                                                </div>
                                            ))}

                                            {/* Body */}
                                            {HOURS.map((hour) => (
                                                <React.Fragment key={hour}>
                                                    <div className="me-time">{`${hour.toString().padStart(2, "0")}:00`}</div>
                                                    {JOURS.map((d) => {
                                                        const slotSeances = group.seances.filter((s) => {
                                                            if (s.jour !== d.value) return false;
                                                            const startMin = getMinutes(s.heure_debut);
                                                            return startMin >= hour * 60 && startMin < (hour + 1) * 60;
                                                        });
                                                        return (
                                                            <div key={`${d.value}-${hour}`} className="me-cell">
                                                                {slotSeances.map((s) => (
                                                                    <div
                                                                        key={s.id}
                                                                        className={`me-event me-event--admin me-event--${s.type_seance?.toLowerCase()}`}
                                                                        title={`${s.module_nom} (${s.type_seance}) – ${s.salle_nom} – ${s.prof_nom}`}
                                                                    >
                                                                        <div className="me-event-actions">
                                                                            <button className="me-action-btn edit" onClick={() => handleOpenModal(s)} title="Modifier">
                                                                                <Edit2 size={12} />
                                                                            </button>
                                                                            <button className="me-action-btn delete" onClick={() => handleDelete(s.id)} title="Supprimer">
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                        <div className="me-event-time">{formatTime(s.heure_debut)} – {formatTime(s.heure_fin)}</div>
                                                                        <div className="me-event-title">{s.module_nom || "—"}</div>
                                                                        <div className="me-event-meta">
                                                                            <span>{s.salle_nom || "—"}</span>
                                                                            <span>{s.prof_nom || "—"}</span>
                                                                        </div>
                                                                        <span className={`me-event-tag me-event-tag--${s.type_seance?.toLowerCase()}`}>{s.type_seance}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
            {showModal && (
                <div className="modal-backdrop">
                    <div className="modal-card modal-wide">
                        <div className="modal-header-modern">
                            <div>
                                <h2>{isEditing ? "Modifier la séance" : "Nouvelle séance"}</h2>
                                <p>Remplissez les informations de la séance</p>
                            </div>
                            <button className="btn-close" onClick={() => setShowModal(false)}><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <div className="form-grid-double">
                                    <div className="input-group">
                                        <label>Jour</label>
                                        <select name="jour" value={formData.jour} onChange={handleInputChange} required style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                                            {JOURS.map((j) => <option key={j.value} value={j.value}>{j.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>N° séance</label>
                                        <input type="number" name="seance_id" value={formData.seance_id} onChange={handleInputChange} min={1} />
                                    </div>
                                    <div className="input-group">
                                        <label>Heure début</label>
                                        <input type="time" name="heure_debut" value={formData.heure_debut} onChange={handleInputChange} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Heure fin</label>
                                        <input type="time" name="heure_fin" value={formData.heure_fin} onChange={handleInputChange} required />
                                    </div>
                                    <div className="input-group">
                                        <label>Type</label>
                                        <select name="type_seance" value={formData.type_seance} onChange={handleInputChange} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                                            {TYPE_SEANCE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>Statut</label>
                                        <select name="statut_seance" value={formData.statut_seance} onChange={handleInputChange} style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}>
                                            {STATUT_SEANCE.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="input-group full-w">
                                        <label>Module</label>
                                        <div className="select-wrapper">
                                            <BookOpen size={18} className="select-icon" />
                                            <select name="module" value={formData.module} onChange={handleInputChange} required>
                                                <option value="">Sélectionner un module</option>
                                                {modules.map((m) => <option key={m.id} value={m.id}>{m.nom} ({m.filiere_nom})</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="input-group full-w">
                                        <label>Groupe</label>
                                        <div className="select-wrapper">
                                            <Users size={18} className="select-icon" />
                                            <select name="groupe" value={formData.groupe} onChange={handleInputChange} required>
                                                <option value="">Sélectionner un groupe</option>
                                                {groupes.map((g) => <option key={g.id} value={g.id}>{g.nom} - {g.filiere_nom}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="input-group full-w">
                                        <label>Salle</label>
                                        <div className="select-wrapper">
                                            <MapPin size={18} className="select-icon" />
                                            <select name="salle" value={formData.salle} onChange={handleInputChange}>
                                                <option value="">Aucune</option>
                                                {salles.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="input-group full-w">
                                        <label>Professeur</label>
                                        <div className="select-wrapper">
                                            <Users size={18} className="select-icon" />
                                            <select name="professeur" value={formData.professeur} onChange={handleInputChange}>
                                                <option value="">Aucun</option>
                                                {professeurs.map((p) => (
                                                    <option key={p.id} value={p.id}>{p.user?.first_name} {p.user?.last_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
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
                .search-wrapper{color: #9ca3af;display:flex;align-items:center;background:#f3f4f6;border-radius:8px;padding:8px 12px;width:350px;}
                .search-wrapper input{color : black;border:none;background:transparent;margin-left:8px;width:100%;outline:none;font-size:14px;}
                .stats-pill{display:flex;align-items:center;gap:8px;background:#eef2ff;color:#4f46e5;padding:6px 12px;border-radius:20px;font-size:13px;font-weight:600;}
                
                /* Student Style Grid Ported */
                .me-container{overflow-x:auto;background:#fff;border-radius:12px;box-shadow:0 1px 3px rgba(0,0,0,0.1);padding:1rem;}
                .me-grid{display:grid;grid-template-columns:64px repeat(7,minmax(140px,1fr));gap:1px;background:#e5e7eb;border:1px solid #e5e7eb;}
                .me-grid>div{background:#fff;padding:8px;}
                .me-corner{background:#f9fafb;}
                .me-day-header{font-weight:700;text-align:center;padding:14px 8px;background:#f9fafb;color:#1f2937;font-size:14px;}
                .me-time{text-align:right;padding-right:10px;color:#6b7280;font-size:.82rem;font-weight:500;display:flex;align-items:flex-start;justify-content:flex-end;padding-top:8px;}
                .me-cell{min-height:100px;display:flex;flex-direction:column;gap:4px;}
                .me-event{padding:8px;border-radius:8px;font-size:.75rem;overflow:hidden;transition:all .2s;cursor:default;position:relative;border-left:4px solid #ccc;}
                .me-event--admin:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.12);z-index:10;}
                
                .me-event--cours{background:#eff6ff;border-left-color:#3b82f6;}
                .me-event--tp{background:#ecfdf5;border-left-color:#10b981;}
                .me-event--td{background:#fffbeb;border-left-color:#f59e0b;}
                .me-event-time{font-weight:600;color:#1f2937;margin-bottom:2px;}
                .me-event-title{font-weight:700;color:#111827;line-height:1.2;margin-bottom:4px;}
                .me-event-meta{display:flex;flex-direction:column;gap:2px;color:#6b7280;font-size:.7rem;}
                .me-event-tag{display:inline-block;margin-top:6px;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;text-transform:uppercase;}
                .me-event-tag--cours{background:#dbeafe;color:#1d4ed8;}
                .me-event-tag--tp{background:#d1fae5;color:#065f46;}
                .me-event-tag--td{background:#fef3c7;color:#92400e;}

                .me-event-actions { position: absolute; top: 4px; right: 4px; display: flex; gap: 2px; opacity: 0; transition: opacity 0.2s; }
                .me-event:hover .me-event-actions { opacity: 1; }
                .me-action-btn { background: white; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #4b5563; }
                .me-action-btn:hover { background: #f9fafb; color: #111827; }
                .me-action-btn.delete:hover { border-color: #fecaca; color: #ef4444; background: #fef2f2; }

                .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:1000;}
                .modal-card{background:white;width:500px;max-height:90vh;overflow-y:auto;border-radius:16px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);}
                .modal-wide{width:560px;}
                .modal-header-modern{padding:24px 24px 0;display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;}
                .modal-header-modern h2{margin:0;font-size:20px;color:#111827;}
                .modal-form{padding:0 24px 24px;}
                .form-section{margin-bottom:24px;}
                .form-grid-double{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
                .full-w{grid-column:span 2;}
                .input-group label{display:block;font-size:13px;font-weight:500;color:#4b5563;margin-bottom:6px;}
                .input-group input,.input-group select,.select-wrapper select{width:100%;padding:10px;border:1px solid #d1d5db;border-radius:6px;font-size:14px;box-sizing:border-box;}
                .select-wrapper{position:relative;}
                .select-wrapper select{padding-left:36px;}
                .select-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#9ca3af;pointer-events:none;}
                .modal-footer{display:flex;justify-content:flex-end;gap:12px;padding-top:20px;border-top:1px solid #f3f4f6;}
                .btn-text{background:transparent;border:none;color:#6b7280;font-weight:500;cursor:pointer;padding:10px 16px;}
                .btn-primary-large{background:#4f46e5;color:white;border:none;padding:10px 24px;border-radius:8px;font-weight:500;cursor:pointer;}
                .text-right{text-align:right;}
                .action-btn{padding:7px;border-radius:6px;border:none;background:transparent;cursor:pointer; transition: 0.2s;}
                .action-btn:hover { background: rgba(0,0,0,0.05); }
                .action-btn.edit{color:#4f46e5;}
                .action-btn.delete{color:#ef4444;}
                .loading-state,.empty-content{padding:60px;text-align:center;color:#6b7280;background:white;border-radius:12px;}
                .empty-state-card .empty-content{padding:40px;}
                .spinner{border:3px solid #f3f3f3;border-top:3px solid #4f46e5;border-radius:50%;width:28px;height:28px;animation:spin 0.8s linear infinite;margin:0 auto 12px;}
                @keyframes spin{to{transform:rotate(360deg);}}
                .filters-wrapper{display:flex;gap:12px;align-items:center;}
                .filter-group-wrapper{position:relative;display:flex;align-items:center;background:#f3f4f6;border-radius:8px;padding:8px 12px;min-width:180px;}
                .filter-icon{color:#9ca3af;margin-right:8px;}
                .filter-select{border:none;background:transparent;outline:none;font-size:14px;color:#1f2937;width:100%;cursor:pointer;}
                .emploi-by-groupe{display:flex;flex-direction:column;gap:32px;}
                .emploi-groupe-section{animation:fadeIn 0.25s ease;}
                @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
                .emploi-groupe-header{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding:12px 16px;background:linear-gradient(135deg,#eef2ff 0%,#e0e7ff 100%);border-radius:12px;border-left:4px solid #4f46e5;}
                .emploi-groupe-header h2{margin:0;font-size:18px;font-weight:700;color:#1e1b4b;}
                .emploi-groupe-count{margin-left:auto;font-size:13px;font-weight:600;color:#4f46e5;background:white;padding:4px 12px;border-radius:20px;}
            `}</style>
        </div>
    );
}

export default GestionEmplois;
