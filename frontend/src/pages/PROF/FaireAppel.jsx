import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBarProf from "../../components/SideBarProf";
import "../../CSS/Dashboard.css";
import { ClipboardList, Users, Check, X, Loader2, Calendar, ScanFace, Pencil, Play, Lock, RefreshCw } from "lucide-react";

/* ─── helpers ──────────────────────────────────────── */
const JOURS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];
const JOUR_LABELS = {
    LUNDI: "Lundi", MARDI: "Mardi", MERCREDI: "Mercredi",
    JEUDI: "Jeudi", VENDREDI: "Vendredi", SAMEDI: "Samedi", DIMANCHE: "Dimanche",
};
const fmt = (t) => (t ? t.slice(0, 5) : "");

function getTodayJour() {
    const d = new Date().getDay();
    if (d === 0) return JOURS[6];
    return JOURS[d - 1];
}
function getTodayISO() { return new Date().toISOString().slice(0, 10); }

/*
 * Each student row has:
 *   etudiant_id, name, cne,
 *   status   : "PRESENT" | "ABSENT" | "PENDING"
 *   method   : "face_id" | "manual" | null
 */

/* ─── component ────────────────────────────────────── */
function FaireAppel() {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [todaySessions, setTodaySessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [isStarted, setIsStarted] = useState(false);
    const [isClosed, setIsClosed] = useState(false);

    const [students, setStudents] = useState([]);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingSave, setLoadingSave] = useState(false);
    const [loadingStop, setLoadingStop] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const pollRef = React.useRef(null);  // live-refresh interval

    /* derived: session is locked only if explicitly closed by the professor */
    const isLocked = isClosed;

    const todayJour = getTodayJour();
    const todayISO = getTodayISO();

    /* ── auth guard + fetch sessions ── */
    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || role !== "PROF") { navigate("/login"); return; }
        fetchSessions();
    }, [navigate]);

    useEffect(() => {
        if (!todayJour) return;
        setTodaySessions(
            sessions
                .filter((s) => s.jour === todayJour)
                .sort((a, b) => (a.heure_debut || "").localeCompare(b.heure_debut || ""))
        );
    }, [sessions, todayJour]);

    const fetchSessions = async () => {
        try {
            setLoadingSessions(true);
            const res = await api.get("schedule/seances/");
            setSessions(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); setSessions([]); }
        finally { setLoadingSessions(false); }
    };

    /* ── live-refresh: merge face_id scans without wiping manual changes ── */
    const refreshPresenceLines = React.useCallback(async (seance) => {
        if (!seance) return;
        try {
            const presRes = await api.get("attendance/prof/presence/", {
                params: { seance_id: seance.id, date: getTodayISO() },
            });
            const lines = presRes.data?.lines || [];
            if (!lines.length) return;

            // Build a map of what the backend knows
            const byId = {};
            lines.forEach((l) => { byId[l.etudiant_id] = l; });

            setStudents((prev) =>
                prev.map((row) => {
                    const remote = byId[row.etudiant_id];
                    if (!remote) return row;

                    // Only update if the remote record is a face_id scan
                    // AND the local row is still PENDING (no manual override)
                    if (remote.method === "face_id" && row.status === "PENDING") {
                        return { ...row, status: remote.status, method: "face_id" };
                    }
                    // Also sync if the remote record is newer than what we have
                    // (e.g. prof saved from another tab)
                    if (row.status === "PENDING" && remote.status !== "PENDING") {
                        return { ...row, status: remote.status, method: remote.method || row.method };
                    }
                    return row;
                })
            );
        } catch (_) { /* silent fail — don't disrupt the UI */ }
    }, []);

    /* ── start / stop polling based on session state ── */
    useEffect(() => {
        if (isStarted && !isLocked && selectedSession) {
            // Poll every 5 seconds for live face-scan updates
            pollRef.current = setInterval(() => {
                refreshPresenceLines(selectedSession);
            }, 5000);
        } else {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        }
        return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
    }, [isStarted, isLocked, selectedSession, refreshPresenceLines]);

    /* ── select session → load students + existing presence ── */
    const selectSession = async (seance) => {
        setSelectedSession(seance);
        setStudents([]);
        setMessage({ type: "", text: "" });
        if (!seance || !seance.groupe) return;

        // Note: we do NOT check client-side time here.
        // The backend's is_time_over flag and statut_seance are the source of truth.

        try {
            setLoadingStudents(true);

            // 1. Get group students
            const groupRes = await api.get(`academic/groupes/${seance.groupe}/`);
            const etudiants = groupRes.data?.etudiants || [];
            let rows = etudiants.map((e) => ({
                etudiant_id: e.user?.id,
                name: [e.user?.first_name, e.user?.last_name].filter(Boolean).join(" ") || "—",
                cne: e.cne || "—",
                status: "PENDING",   // default: waiting for attendance
                method: null,        // no method yet
            })).filter((r) => r.etudiant_id != null);

            // 2. Check existing professor-recorded attendance
            try {
                const presRes = await api.get("attendance/prof/presence/", {
                    params: { seance_id: seance.id, date: todayISO },
                });

                // Check status from response
                const statusSeance = presRes.data?.statut_seance;
                setIsStarted(statusSeance === 'EN_COURS' || statusSeance === 'CLOTUREE');
                setIsClosed(statusSeance === 'CLOTUREE');
                // is_time_over is informational only — we no longer hard-lock the UI on it

                const lines = presRes.data?.lines || [];
                if (lines.length) {
                    const byId = {};
                    lines.forEach((l) => {
                        byId[l.etudiant_id] = {
                            status: l.status,
                            method: l.method || null,
                        };
                    });
                    rows = rows.map((r) => {
                        const existing = byId[r.etudiant_id];
                        if (existing) {
                            return { ...r, status: existing.status, method: existing.method };
                        }
                        return r;
                    });
                }
            } catch (_) {
                // If it fails or returns 404, assume not started or just standard error
                // But for safety, check seance status if possible. 
                // Actually, if presence API fails, we might default isStarted to false.
                setIsStarted(false);
            }

            setStudents(rows);
        } catch (e) {
            console.error(e);
            setMessage({ type: "error", text: "Impossible de charger la liste des étudiants." });
        } finally { setLoadingStudents(false); }
    };

    /* ── start session ── */
    const handleStartSession = async () => {
        if (!selectedSession) return;
        try {
            await api.post(`schedule/seances/${selectedSession.id}/start/`);
            setIsStarted(true);
            setIsClosed(false);
            setMessage({ type: "success", text: "Séance démarrée avec succès !" });
        } catch (e) {
            console.error(e);
            setMessage({ type: "error", text: "Erreur lors du démarrage de la séance." });
        }
    };

    /* ── stop session ── */
    const handleStopSession = async () => {
        if (!selectedSession) return;
        if (!window.confirm("Voulez-vous vraiment arrêter le pointage ?\nTous les étudiants « En attente » seront marqués Absent.")) return;

        try {
            setLoadingStop(true);

            // Build lines: convert PENDING → ABSENT
            const lines = students.map((s) => ({
                etudiant_id: s.etudiant_id,
                status: s.status === "PENDING" ? "ABSENT" : s.status,
                method: s.method || null,
            }));

            // Atomic call: save attendance + close session in one request.
            // The backend /stop/ endpoint bypasses the time-over guard.
            await api.post(`schedule/seances/${selectedSession.id}/stop/`, {
                lines,
                date: todayISO,
            });

            // Reflect final state in UI
            setIsClosed(true);
            setStudents((prev) =>
                prev.map((s) => s.status === "PENDING" ? { ...s, status: "ABSENT" } : s)
            );
            setMessage({ type: "success", text: "Pointage arrêté. Les présences ont été enregistrées." });
        } catch (e) {
            console.error("Stop Error:", e);
            const errorMsg = e.response?.data?.error || e.response?.data?.message || "Erreur lors de l'arrêt de la séance.";
            setMessage({ type: "error", text: errorMsg });
        } finally {
            setLoadingStop(false);
        }
    };



    /* ── one-click manual validation ── */
    const handleManualPresence = (etudiantId) => {
        setStudents((prev) =>
            prev.map((s) =>
                s.etudiant_id === etudiantId
                    ? { ...s, status: "PRESENT", method: "manual" }
                    : s
            )
        );
    };

    /* ── cancel / mark absent ── */
    const handleMarkAbsent = (etudiantId) => {
        setStudents((prev) =>
            prev.map((s) =>
                s.etudiant_id === etudiantId
                    ? { ...s, status: "ABSENT", method: null }
                    : s
            )
        );
    };

    /* ── bulk save ── */
    const submitAttendance = async () => {
        if (!selectedSession) return;
        try {
            setLoadingSave(true);
            setMessage({ type: "", text: "" });

            // Map PENDING → ABSENT for submission
            const lines = students.map((s) => ({
                etudiant_id: s.etudiant_id,
                status: s.status === "PENDING" ? "ABSENT" : s.status,
                method: s.method || null,
            }));

            await api.post("attendance/prof/presence/", {
                seance_id: selectedSession.id,
                date: todayISO,
                lines,
            });
            setMessage({ type: "success", text: "Présences enregistrées avec succès !" });

            // Update PENDING to ABSENT in local state after save
            setStudents((prev) =>
                prev.map((s) => s.status === "PENDING" ? { ...s, status: "ABSENT" } : s)
            );
        } catch (e) {
            const msg = e.response?.data?.error || e.response?.data?.message || "Erreur lors de l'enregistrement.";
            setMessage({ type: "error", text: msg });
        } finally { setLoadingSave(false); }
    };

    /* ── counts ── */
    const presentCount = students.filter((s) => s.status === "PRESENT").length;
    const pendingCount = students.filter((s) => s.status === "PENDING").length;
    const absentCount = students.filter((s) => s.status === "ABSENT").length;
    const faceIdCount = students.filter((s) => s.method === "face_id").length;
    const manualCount = students.filter((s) => s.method === "manual").length;

    /* ── render ── */
    return (
        <div className="dashboard-container">
            <SideBarProf />
            <main className="main-content">
                <header className="top-bar">
                    <div className="welcome-text">
                        <h1>Faire l'appel</h1>
                        <p>{JOUR_LABELS[todayJour] || ""} – {todayISO}</p>
                    </div>
                    <div className="avatar"><ClipboardList size={22} color="white" /></div>
                </header>

                {/* ── Session selector ── */}
                <div className="recent-activity" style={{ marginBottom: 24 }}>
                    <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Calendar size={20} /> Sélectionner une séance du jour
                    </h2>
                    {loadingSessions ? (
                        <div className="fa-loading"><Loader2 size={24} className="fa-spin" /> Chargement…</div>
                    ) : todaySessions.length === 0 ? (
                        <p className="fa-empty">Aucune séance prévue aujourd'hui.</p>
                    ) : (
                        <div className="fa-session-grid">
                            {todaySessions.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    className={`fa-session-card${selectedSession?.id === s.id ? " fa-session-card--active" : ""}`}
                                    onClick={() => selectSession(s)}
                                >
                                    <span className="fa-session-time">{fmt(s.heure_debut)} – {fmt(s.heure_fin)}</span>
                                    <span className="fa-session-module">{s.module_nom || "—"}</span>
                                    <span className="fa-session-meta">{s.groupe_nom || "—"} · {s.type_seance || "COURS"}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Student list ── */}
                {selectedSession && (
                    <div className="recent-activity">
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                            <h2 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                                <Users size={20} />
                                {selectedSession.module_nom} – {selectedSession.groupe_nom}
                            </h2>
                            {isStarted && !isLocked && (
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                                    <button
                                        type="button"
                                        className="fa-btn"
                                        onClick={() => refreshPresenceLines(selectedSession)}
                                        title="Actualiser les présences"
                                        style={{ background: '#fff', border: '1px solid #e5e7eb', color: '#6b7280' }}
                                    >
                                        <RefreshCw size={14} /> Actualiser
                                    </button>
                                    <button
                                        type="button"
                                        className="fa-btn fa-btn--stop"
                                        onClick={handleStopSession}
                                        disabled={loadingStop}
                                        style={{ backgroundColor: '#ef4444', color: 'white' }}
                                    >
                                        {loadingStop ? (
                                            <Loader2 size={16} className="fa-spin" />
                                        ) : (
                                            <X size={16} />
                                        )}
                                        Arrêter le pointage
                                    </button>
                                </div>
                            )}
                            {isLocked && (
                                <span className="fa-locked-banner" style={{ marginLeft: 'auto' }}>
                                    <Lock size={16} /> Séance Clôturée — Le pointage est clos
                                </span>
                            )}
                        </div>

                        {/* Stats bar */}
                        {!isStarted ? (
                            <div className="start-session-container">
                                <div className="start-session-card">
                                    <div className="icon-circle">
                                        <Play size={40} fill="currentColor" />
                                    </div>
                                    <h2>La séance n'est pas encore démarrée</h2>
                                    <p>Veuillez démarrer la séance pour commencer l'appel et permettre aux étudiants de scanner leur présence.</p>
                                    <button className="start-btn-large" onClick={handleStartSession}>
                                        Démarrer le cours maintenant
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>

                                <div className="fa-stats-bar">
                                    <span className="fa-stat fa-stat--present">✓ Présent : {presentCount}</span>
                                    <span className="fa-stat fa-stat--pending">En attente : {pendingCount}</span>
                                    <span className="fa-stat fa-stat--absent">✗ Absent : {absentCount}</span>
                                    {faceIdCount > 0 && <span className="fa-stat fa-stat--faceid">Face ID : {faceIdCount}</span>}
                                    {manualCount > 0 && <span className="fa-stat fa-stat--manual">Manuel : {manualCount}</span>}
                                </div>

                                {loadingStudents ? (
                                    <div className="fa-loading"><Loader2 size={24} className="fa-spin" /> Chargement de la liste…</div>
                                ) : students.length === 0 ? (
                                    <p className="fa-empty">Aucun étudiant dans ce groupe.</p>
                                ) : (
                                    <>
                                        <div className="fa-table-wrap">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Nom</th>
                                                        <th>CNE</th>
                                                        <th>Statut</th>
                                                        <th>Méthode</th>
                                                        <th>Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {students.map((row) => (
                                                        <tr
                                                            key={row.etudiant_id}
                                                            className={
                                                                row.status === "ABSENT" ? "fa-row-absent" :
                                                                    row.status === "PENDING" ? "fa-row-pending" : ""
                                                            }
                                                        >
                                                            {/* Name */}
                                                            <td style={{ fontWeight: 600 }}>{row.name}</td>

                                                            {/* CNE */}
                                                            <td style={{ fontFamily: "monospace", fontSize: 13 }}>{row.cne}</td>

                                                            {/* Status badge */}
                                                            <td>
                                                                {row.status === "PRESENT" && (
                                                                    <span className="fa-badge fa-badge--present">Validé</span>
                                                                )}
                                                                {row.status === "PENDING" && (
                                                                    <span className="fa-badge fa-badge--pending">En attente…</span>
                                                                )}
                                                                {row.status === "ABSENT" && (
                                                                    <span className="fa-badge fa-badge--absent">Absent</span>
                                                                )}
                                                            </td>

                                                            {/* Method indicator */}
                                                            <td>
                                                                {row.method === "face_id" && (
                                                                    <span className="fa-method fa-method--faceid" title="Validé par reconnaissance faciale">
                                                                        <ScanFace size={14} /> Face ID
                                                                    </span>
                                                                )}
                                                                {row.method === "manual" && (
                                                                    <span className="fa-method fa-method--manual" title="Validé manuellement par le professeur">
                                                                        <Pencil size={14} /> Manuel
                                                                    </span>
                                                                )}
                                                                {!row.method && (
                                                                    <span className="fa-method fa-method--none">—</span>
                                                                )}
                                                            </td>

                                                            {/* Action buttons */}
                                                            <td>
                                                                {isLocked ? (
                                                                    <span style={{ color: '#9ca3af', fontSize: 13 }}>—</span>
                                                                ) : row.status === "PRESENT" ? (
                                                                    <button
                                                                        type="button"
                                                                        className="fa-btn fa-btn--cancel"
                                                                        onClick={() => handleMarkAbsent(row.etudiant_id)}
                                                                        title="Annuler et marquer absent"
                                                                    >
                                                                        <X size={14} /> Annuler
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        className="fa-btn fa-btn--validate"
                                                                        onClick={() => handleManualPresence(row.etudiant_id)}
                                                                        title="Valider manuellement la présence"
                                                                    >
                                                                        Valider Manuellement
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Submit — hidden when locked */}
                                        {!isLocked && (
                                            <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                                                <button
                                                    type="button"
                                                    className="fa-submit-btn"
                                                    onClick={submitAttendance}
                                                    disabled={loadingSave}
                                                >
                                                    {loadingSave ? (
                                                        <><Loader2 size={18} className="fa-spin" /> Enregistrement…</>
                                                    ) : (
                                                        <><Check size={18} /> Enregistrer les présences</>
                                                    )}
                                                </button>
                                                <span style={{ fontSize: 12, color: "var(--text-gray)" }}>
                                                    Les étudiants « En attente » seront marqués <strong>Absent</strong> lors de l'enregistrement.
                                                </span>
                                            </div>
                                        )}

                                    </>
                                )}
                            </>
                        )}

                        {message.text && (
                            <div className={`fa-msg fa-msg--${message.type === "success" ? "success" : "error"}`} role="alert">
                                {message.text}
                            </div>
                        )}
                    </div>
                )}
            </main>

            <style>{`
        /* ── Faire l'appel styles ── */
        .fa-loading{display:flex;align-items:center;gap:10px;padding:20px;color:var(--text-gray);}
        .fa-empty{color:var(--text-gray);padding:16px 0;margin:0;}
        .fa-spin{animation:fa-rotate .8s linear infinite;}
        @keyframes fa-rotate{to{transform:rotate(360deg);}}

        /* Session cards */
        .fa-session-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;}
        .fa-session-card{text-align:left;padding:16px 20px;background:#fff;border:2px solid #e5e7eb;border-radius:12px;cursor:pointer;transition:all .2s;}
        .fa-session-card:hover{border-color:var(--primary-color);box-shadow:0 4px 12px rgba(79,70,229,.12);}
        .fa-session-card--active{border-color:var(--primary-color);background:#eef2ff;box-shadow:0 4px 14px rgba(79,70,229,.18);}
        .fa-session-time{display:block;font-weight:700;color:var(--primary-color);font-size:15px;margin-bottom:4px;}
        .fa-session-module{display:block;color:var(--text-dark);font-size:14px;font-weight:500;}
        .fa-session-meta{display:block;margin-top:4px;font-size:12px;color:var(--text-gray);}

        /* Stats bar */
        .fa-stats-bar{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px;padding:12px 16px;background:#f9fafb;border-radius:10px;}
        .fa-stat{font-size:13px;font-weight:600;padding:4px 12px;border-radius:20px;}
        .fa-stat--present{background:#d1fae5;color:#065f46;}
        .fa-stat--pending{background:#fef3c7;color:#92400e;}
        .fa-stat--absent{background:#fee2e2;color:#991b1b;}
        .fa-stat--faceid{background:#dbeafe;color:#1d4ed8;}
        .fa-stat--manual{background:#ede9fe;color:#6d28d9;}

        /* Table */
        .fa-table-wrap{overflow-x:auto;border-radius:12px;border:1px solid #f3f4f6;}
        .fa-row-absent{background:#fef2f2 !important;}
        .fa-row-absent td{color:#991b1b;}
        .fa-row-pending{background:#fffbeb !important;}
        .fa-row-pending td{color:#92400e;}

        /* Badges */
        .fa-badge{display:inline-flex;align-items:center;gap:4px;padding:5px 12px;border-radius:20px;font-size:12px;font-weight:600;white-space:nowrap;}
        .fa-badge--present{background:#d1fae5;color:#065f46;}
        .fa-badge--pending{background:#fef3c7;color:#92400e;}
        .fa-badge--absent{background:#fee2e2;color:#991b1b;}

        /* Method indicator */
        .fa-method{display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;padding:3px 8px;border-radius:6px;white-space:nowrap;}
        .fa-method--faceid{background:#dbeafe;color:#1d4ed8;}
        .fa-method--manual{background:#ede9fe;color:#6d28d9;}
        .fa-method--none{color:#d1d5db;font-size:13px;}

        /* Action buttons */
        .fa-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:none;cursor:pointer;font-size:13px;font-weight:600;transition:.2s;white-space:nowrap;}

        .fa-btn--validate{background:linear-gradient(135deg,#8b5cf6 0%,#7c3aed 100%);color:#fff;box-shadow:0 2px 8px rgba(139,92,246,.25);}
        .fa-btn--validate:hover{transform:translateY(-1px);box-shadow:0 4px 12px rgba(139,92,246,.35);}

        .fa-btn--cancel{background:#fff;border:1px solid #e5e7eb;color:#6b7280;}
        .fa-btn--cancel:hover{background:#fef2f2;color:#dc2626;border-color:#fecaca;}

        /* Submit */
        .fa-submit-btn{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:linear-gradient(135deg,#4f46e5 0%,#4338ca 100%);color:#fff;border:none;border-radius:10px;font-weight:600;font-size:15px;cursor:pointer;box-shadow:0 4px 14px rgba(79,70,229,.25);transition:.2s;}
        .fa-submit-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 20px rgba(79,70,229,.35);}
        .fa-submit-btn:disabled{opacity:.7;cursor:not-allowed;}

        /* Messages */
        .fa-msg{padding:14px 18px;border-radius:10px;margin-top:16px;font-size:14px;font-weight:500;}
        .fa-msg--success{background:#d1fae5;color:#065f46;}
        .fa-msg--error{background:#fee2e2;color:#991b1b;}

        /* Locked banner */
        .fa-locked-banner{display:inline-flex;align-items:center;gap:6px;margin-left:auto;padding:8px 18px;border-radius:10px;font-size:14px;font-weight:600;background:linear-gradient(135deg,#fef3c7 0%,#fde68a 100%);color:#92400e;border:1px solid #f59e0b;box-shadow:0 2px 8px rgba(245,158,11,.15);}


        /* Start Session */
        .start-session-container {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px 20px;
        }
        .start-session-card {
            background: #fff;
            padding: 40px;
            border-radius: 16px;
            text-align: center;
            max-width: 500px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            border: 1px solid #e5e7eb;
        }
        .icon-circle {
            width: 80px;
            height: 80px;
            background: #eef2ff;
            color: #4f46e5;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
        }
        .start-session-card h2 {
            font-size: 24px;
            color: #111827;
            margin-bottom: 12px;
        }
        .start-session-card p {
            color: #6b7280;
            margin-bottom: 32px;
            line-height: 1.5;
        }
        .start-btn-large {
            background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
            color: white;
            padding: 16px 32px;
            font-size: 18px;
            font-weight: 600;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
        }
        .start-btn-large:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 24px rgba(79, 70, 229, 0.4);
        }
      `}</style>
        </div>
    );
}

export default FaireAppel;
