import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBarEtudiant from "../../components/SideBarEtudiant";
import {
    ClipboardList, AlertCircle, CheckCircle2, Clock, Upload,
    X, Loader2, FileText, Calendar, BarChart3
} from "lucide-react";

function MesAbsences() {
    const navigate = useNavigate();
    const [records, setRecords] = useState([]);
    const [stats, setStats] = useState({ total: 0, absences: 0, justifiees: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    /* Modal state */
    const [showModal, setShowModal] = useState(false);
    const [selectedAbsence, setSelectedAbsence] = useState(null);
    const [motif, setMotif] = useState("");
    const [fichier, setFichier] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitMsg, setSubmitMsg] = useState({ type: "", text: "" });

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || role !== "ETUDIANT") { navigate("/login"); return; }
        fetchAbsences();
    }, [navigate]);

    const fetchAbsences = async () => {
        try {
            setLoading(true);
            const res = await api.get("attendance/mes-absences/");
            setRecords(res.data.records || []);
            setStats(res.data.stats || { total: 0, absences: 0, justifiees: 0 });
        } catch (e) {
            console.error(e);
            setError("Impossible de charger vos données de présence.");
        } finally { setLoading(false); }
    };

    const openJustifyModal = (record) => {
        setSelectedAbsence(record);
        setMotif("");
        setFichier(null);
        setSubmitMsg({ type: "", text: "" });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedAbsence(null);
    };

    const handleSubmitJustification = async (e) => {
        e.preventDefault();
        if (!selectedAbsence || !fichier || !motif.trim()) return;

        setSubmitting(true);
        setSubmitMsg({ type: "", text: "" });

        const formData = new FormData();
        formData.append("presence_prof_id", selectedAbsence.id);
        formData.append("motif", motif.trim());
        formData.append("fichier", fichier);

        try {
            await api.post("attendance/justify/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setSubmitMsg({ type: "success", text: "Justification soumise avec succès !" });
            // Refresh data after a short delay
            setTimeout(() => {
                closeModal();
                fetchAbsences();
            }, 1200);
        } catch (err) {
            const msg = err.response?.data?.error || "Erreur lors de la soumission.";
            setSubmitMsg({ type: "error", text: msg });
        } finally { setSubmitting(false); }
    };

    /* helpers */
    const getStatusBadge = (status) => {
        if (status === "PRESENT") return <span className="ma-badge ma-badge--present"><CheckCircle2 size={14} /> Présent</span>;
        if (status === "ABSENT") return <span className="ma-badge ma-badge--absent"><AlertCircle size={14} /> Absent</span>;
        if (status === "RETARD") return <span className="ma-badge ma-badge--retard"><Clock size={14} /> En retard</span>;
        return <span className="ma-badge">{status}</span>;
    };

    const getJustifBadge = (justification) => {
        if (!justification) return null;
        if (justification.etat === "EN_ATTENTE") return <span className="ma-justif-badge ma-justif-badge--pending"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="none"><path d="M320-160h320v-120q0-66-47-113t-113-47q-66 0-113 47t-47 113v120ZM160-80v-80h80v-120q0-61 28.5-114.5T348-480q-51-32-79.5-85.5T240-680v-120h-80v-80h640v80h-80v120q0 61-28.5 114.5T612-480q51 32 79.5 85.5T720-280v120h80v80H160Z" /></svg> En cours de validation</span>;
        if (justification.etat === "APPROUVE") return <span className="ma-justif-badge ma-justif-badge--approved"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#34d399"><path d="m381-240 424-424-57-56-368 367-169-170-57 57 227 226Zm0 113L42-466l169-170 170 170 366-367 172 168-538 538Z" /></svg> Validée</span>;
        if (justification.etat === "REFUSE") return <span className="ma-justif-badge ma-justif-badge--refused"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="none"><path d="M240-800v200-200 640-9.5 9.5-640Zm0 720q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v174q-19-7-39-10.5t-41-3.5v-120H520v-200H240v640h254q8 23 20 43t28 37H240Zm396-20-56-56 84-84-84-84 56-56 84 84 84-84 56 56-83 84 83 84-56 56-84-83-84 83Z" /></svg> Refusée</span>;
        return null;
    };

    const presenceRate = stats.total > 0 ? Math.round(((stats.total - stats.absences) / stats.total) * 100) : 100;

    return (
        <div className="dashboard-container">
            <SideBarEtudiant />
            <main className="main-content">
                <header className="top-bar">
                    <div className="welcome-text">
                        <h1>Mes Absences</h1>
                        <p>Suivi de présence & justifications</p>
                    </div>
                    <div className="avatar"><ClipboardList size={22} color="white" /></div>
                </header>

                {/* Stats Cards */}
                <div className="ma-stats-grid">
                    <div className="ma-stat-card">
                        <div className="ma-stat-icon" style={{ background: "linear-gradient(135deg, #818cf8, #6366f1)" }}>
                            <BarChart3 size={24} color="white" />
                        </div>
                        <div className="ma-stat-info">
                            <span className="ma-stat-value">{stats.total}</span>
                            <span className="ma-stat-label">Total Séances</span>
                        </div>
                    </div>
                    <div className="ma-stat-card">
                        <div className="ma-stat-icon" style={{ background: "linear-gradient(135deg, #f87171, #ef4444)" }}>
                            <AlertCircle size={24} color="white" />
                        </div>
                        <div className="ma-stat-info">
                            <span className="ma-stat-value">{stats.absences}</span>
                            <span className="ma-stat-label">Absences</span>
                        </div>
                    </div>
                    <div className="ma-stat-card">
                        <div className="ma-stat-icon" style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}>
                            <CheckCircle2 size={24} color="white" />
                        </div>
                        <div className="ma-stat-info">
                            <span className="ma-stat-value">{stats.justifiees}</span>
                            <span className="ma-stat-label">Justifiées</span>
                        </div>
                    </div>
                    <div className="ma-stat-card">
                        <div className="ma-stat-icon" style={{ background: `linear-gradient(135deg, ${presenceRate >= 80 ? '#34d399, #10b981' : presenceRate >= 50 ? '#fbbf24, #f59e0b' : '#f87171, #ef4444'})` }}>
                            <Calendar size={24} color="white" />
                        </div>
                        <div className="ma-stat-info">
                            <span className="ma-stat-value">{presenceRate}%</span>
                            <span className="ma-stat-label">Taux de présence</span>
                        </div>
                    </div>
                </div>

                {/* Records Table */}
                <div className="ma-card">
                    <h2 className="ma-card-title"><FileText size={20} /> Historique de présence</h2>

                    {loading ? (
                        <div className="ma-loading"><Loader2 size={24} className="fa-spin" /> Chargement…</div>
                    ) : error ? (
                        <div className="ma-error">{error}</div>
                    ) : records.length === 0 ? (
                        <div className="ma-empty">
                            <Calendar size={40} color="#9ca3af" />
                            <p>Aucune donnée de présence disponible.</p>
                        </div>
                    ) : (
                        <div className="ma-table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Horaire</th>
                                        <th>Module</th>
                                        <th>Type</th>
                                        <th>Statut</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {records.map((r) => (
                                        <tr key={r.id} className={r.status === "ABSENT" ? "ma-row-absent" : ""}>
                                            <td style={{ fontWeight: 600 }}>
                                                {new Date(r.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                                            </td>
                                            <td style={{ fontFamily: "monospace", fontSize: 13 }}>
                                                {r.heure_debut} – {r.heure_fin}
                                            </td>
                                            <td style={{ fontWeight: 500 }}>{r.module_nom}</td>
                                            <td><span className="ma-type-badge">{r.type_seance}</span></td>
                                            <td>{getStatusBadge(r.status)}</td>
                                            <td>
                                                {r.status === "ABSENT" && !r.justification ? (
                                                    <button className="ma-justify-btn" onClick={() => openJustifyModal(r)}>
                                                        <Upload size={14} /> Justifier
                                                    </button>
                                                ) : r.justification ? (
                                                    getJustifBadge(r.justification)
                                                ) : (
                                                    <span style={{ color: "#d1d5db" }}>—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Justification Modal */}
                {showModal && selectedAbsence && (
                    <div className="ma-modal-overlay" onClick={closeModal}>
                        <div className="ma-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="ma-modal-header">
                                <h3>Justifier une absence</h3>
                                <button className="ma-modal-close" onClick={closeModal}><X size={20} /></button>
                            </div>
                            <div className="ma-modal-info">
                                <p><strong>Module :</strong> {selectedAbsence.module_nom}</p>
                                <p><strong>Date :</strong> {new Date(selectedAbsence.date).toLocaleDateString("fr-FR")} · {selectedAbsence.heure_debut} – {selectedAbsence.heure_fin}</p>
                            </div>
                            <form onSubmit={handleSubmitJustification}>
                                <div className="ma-form-group">
                                    <label>Motif de l'absence</label>
                                    <textarea
                                        value={motif}
                                        onChange={(e) => setMotif(e.target.value)}
                                        placeholder="Ex: Certificat médical, urgence familiale…"
                                        rows={3}
                                        required
                                    />
                                </div>
                                <div className="ma-form-group">
                                    <label>Pièce justificative (PDF / Image)</label>
                                    <div className="ma-file-upload">
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(e) => setFichier(e.target.files[0])}
                                            required
                                            id="justif-file"
                                        />
                                        <label htmlFor="justif-file" className="ma-file-label">
                                            <Upload size={18} />
                                            {fichier ? fichier.name : "Choisir un fichier…"}
                                        </label>
                                    </div>
                                </div>

                                {submitMsg.text && (
                                    <div className={`ma-msg ma-msg--${submitMsg.type}`}>{submitMsg.text}</div>
                                )}

                                <button type="submit" className="ma-submit-btn" disabled={submitting || !motif.trim() || !fichier}>
                                    {submitting ? (
                                        <><Loader2 size={18} className="fa-spin" /> Envoi en cours…</>
                                    ) : (
                                        <><Upload size={18} /> Soumettre la justification</>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </main>

            <style>{`
        /* ── Mes Absences styles ── */

        /* Stats grid */
        .ma-stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px;}
        .ma-stat-card{background:#fff;border-radius:14px;padding:20px;display:flex;align-items:center;gap:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:1px solid #f3f4f6;transition:all .2s;}
        .ma-stat-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.08);}
        .ma-stat-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
        .ma-stat-info{display:flex;flex-direction:column;}
        .ma-stat-value{font-size:24px;font-weight:700;color:#111827;line-height:1.2;}
        .ma-stat-label{font-size:13px;color:#6b7280;font-weight:500;}

        /* Card */
        .ma-card{background:#fff;border-radius:14px;padding:24px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border:1px solid #f3f4f6;}
        .ma-card-title{display:flex;align-items:center;gap:8px;font-size:18px;font-weight:600;color:#111827;margin:0 0 16px;}

        /* Table */
        .ma-table-wrap{overflow-x:auto;border-radius:12px;border:1px solid #f3f4f6;}
        .ma-table-wrap table{width:100%;border-collapse:collapse;}
        .ma-table-wrap th{background:#f9fafb;padding:12px 16px;text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e5e7eb;}
        .ma-table-wrap td{padding:14px 16px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;}
        .ma-table-wrap tr:last-child td{border-bottom:none;}
        .ma-row-absent{background:#fef2f2 !important;}

        /* Badges */
        .ma-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap;}
        .ma-badge--present{background:#d1fae5;color:#065f46;}
        .ma-badge--absent{background:#fee2e2;color:#991b1b;}
        .ma-badge--retard{background:#fef3c7;color:#92400e;}
        .ma-type-badge{background:#ede9fe;color:#6d28d9;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;}
        .ma-justif-badge{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:8px;font-size:12px;font-weight:500;white-space:nowrap;}
        .ma-justif-badge--pending{background:#fef3c7;color:#92400e;}
        .ma-justif-badge--approved{background:#d1fae5;color:#065f46;}
        .ma-justif-badge--refused{background:#fee2e2;color:#991b1b;}

        /* Justify button */
        .ma-justify-btn{display:inline-flex;align-items:center;gap:5px;padding:6px 14px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:600;background:linear-gradient(135deg,#8b5cf6,#7c3aed);color:#fff;box-shadow:0 2px 6px rgba(139,92,246,.2);transition:.2s;}
        .ma-justify-btn:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(139,92,246,.3);}

        /* Loading / Empty / Error */
        .ma-loading{display:flex;align-items:center;gap:10px;padding:40px;justify-content:center;color:#6b7280;}
        .ma-empty{display:flex;flex-direction:column;align-items:center;gap:12px;padding:48px;color:#9ca3af;}
        .ma-error{color:#991b1b;background:#fee2e2;padding:16px;border-radius:10px;font-size:14px;}

        /* Modal */
        .ma-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;}
        .ma-modal{background:#fff;border-radius:16px;width:100%;max-width:500px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.15);}
        .ma-modal-header{display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #f3f4f6;}
        .ma-modal-header h3{margin:0;font-size:18px;color:#111827;}
        .ma-modal-close{background:none;border:none;cursor:pointer;color:#6b7280;padding:4px;border-radius:6px;transition:.2s;}
        .ma-modal-close:hover{background:#f3f4f6;color:#111827;}
        .ma-modal-info{padding:16px 24px;background:#f9fafb;font-size:14px;color:#374151;}
        .ma-modal-info p{margin:4px 0;}
        .ma-modal form{padding:20px 24px;}

        /* Form */
        .ma-form-group{margin-bottom:16px;}
        .ma-form-group label{display:block;font-size:13px;font-weight:600;color:#374151;margin-bottom:6px;}
        .ma-form-group textarea{width:100%;padding:10px 14px;border:1px solid #d1d5db;border-radius:10px;font-size:14px;font-family:inherit;resize:vertical;transition:.2s;box-sizing:border-box;}
        .ma-form-group textarea:focus{border-color:#818cf8;outline:none;box-shadow:0 0 0 3px rgba(129,140,248,.15);}

        /* File upload */
        .ma-file-upload{position:relative;}
        .ma-file-upload input[type="file"]{position:absolute;opacity:0;width:0;height:0;}
        .ma-file-label{display:flex;align-items:center;gap:8px;padding:10px 16px;border:2px dashed #d1d5db;border-radius:10px;cursor:pointer;font-size:14px;color:#6b7280;transition:.2s;}
        .ma-file-label:hover{border-color:#818cf8;color:#4f46e5;background:#f5f3ff;}

        /* Submit */
        .ma-submit-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;background:linear-gradient(135deg,#4f46e5,#4338ca);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(79,70,229,.25);transition:.2s;margin-top:8px;}
        .ma-submit-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(79,70,229,.35);}
        .ma-submit-btn:disabled{opacity:.6;cursor:not-allowed;}

        /* Messages */
        .ma-msg{padding:10px 14px;border-radius:8px;font-size:13px;font-weight:500;margin-bottom:12px;}
        .ma-msg--success{background:#d1fae5;color:#065f46;}
        .ma-msg--error{background:#fee2e2;color:#991b1b;}

        /* Reuse fa-spin from Dashboard.css */
        @keyframes fa-rotate{to{transform:rotate(360deg);}}
        .fa-spin{animation:fa-rotate .8s linear infinite;}
      `}</style>
        </div>
    );
}

export default MesAbsences;
