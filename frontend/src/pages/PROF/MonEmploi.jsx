import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBarProf from "../../components/SideBarProf";
import "../../CSS/Dashboard.css";
import { Calendar, Loader2 } from "lucide-react";

/* ─── constants ────────────────────────────────────── */
const DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];
const DAY_LABELS = {
    LUNDI: "Lundi", MARDI: "Mardi", MERCREDI: "Mercredi",
    JEUDI: "Jeudi", VENDREDI: "Vendredi", SAMEDI: "Samedi", DIMANCHE: "Dimanche",
};
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08 → 22
const WEEKEND = new Set(["SAMEDI", "DIMANCHE"]);

const fmt = (t) => (t ? t.slice(0, 5) : "");
const getMinutes = (t) => { if (!t) return 0; const [h, m] = t.split(":").map(Number); return h * 60 + m; };

/* ─── component ────────────────────────────────────── */
function MonEmploi() {
    const navigate = useNavigate();
    const [seances, setSeances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || role !== "PROF") { navigate("/login"); return; }
        fetchData();
    }, [navigate]);

    const fetchData = async () => {
        try {
            const res = await api.get("schedule/seances/");
            setSeances(Array.isArray(res.data) ? res.data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    /* get seances that START within a given hour slot */
    const getSlot = (day, hour) =>
        seances.filter((s) => {
            if (s.jour !== day) return false;
            const startMin = getMinutes(s.heure_debut);
            return startMin >= hour * 60 && startMin < (hour + 1) * 60;
        });

    /* Determine formation type from the group */
    const getFormationType = (s) => {
        // Check if the session's groupe data indicates FTA
        // The API returns groupe as ID and groupe_nom as string
        const gnom = (s.groupe_nom || "").toUpperCase();
        if (gnom.includes("FTA") || gnom.includes("SOIR") || gnom.includes("CONTINUE")) return "FTA";
        // Weekend sessions are likely FTA
        if (WEEKEND.has(s.jour)) return "FTA";
        return "FI";
    };

    return (
        <div className="dashboard-container">
            <SideBarProf />
            <main className="main-content">
                <header className="top-bar">
                    <div className="welcome-text">
                        <h1>Mon Emploi du Temps</h1>
                        <p>Vue hebdomadaire – 7 jours (Formation Initiale & Continue)</p>
                    </div>
                    <div className="avatar"><Calendar size={22} color="white" /></div>
                </header>

                {loading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 40, color: "var(--text-gray)" }}>
                        <Loader2 size={28} className="me-spin" /> Chargement de l'emploi du temps…
                    </div>
                ) : (
                    <>
                        {/* Legend */}
                        <div className="me-legend">
                            <span className="me-legend-item"><span className="me-dot me-dot--fi"></span>Formation Initiale (FI)</span>
                            <span className="me-legend-item"><span className="me-dot me-dot--fta"></span>Formation Continue (FTA)</span>
                            <span className="me-legend-item"><span className="me-dot me-dot--weekend"></span>Weekend</span>
                        </div>

                        <div className="me-container">
                            <div className="me-grid">
                                {/* Header */}
                                <div className="me-corner"></div>
                                {DAYS.map((d) => (
                                    <div key={d} className={`me-day-header${WEEKEND.has(d) ? " me-day-header--weekend" : ""}`}>
                                        {DAY_LABELS[d]}
                                    </div>
                                ))}

                                {/* Body */}
                                {HOURS.map((hour) => (
                                    <React.Fragment key={hour}>
                                        <div className="me-time">{`${hour.toString().padStart(2, "0")}:00`}</div>
                                        {DAYS.map((d) => {
                                            const slotSeances = getSlot(d, hour);
                                            const isWeekend = WEEKEND.has(d);
                                            return (
                                                <div key={`${d}-${hour}`} className={`me-cell${isWeekend ? " me-cell--weekend" : ""}`}>
                                                    {slotSeances.map((s) => {
                                                        const ft = getFormationType(s);
                                                        return (
                                                            <div
                                                                key={s.id}
                                                                className={`me-event me-event--${ft.toLowerCase()}`}
                                                                title={`${s.module_nom} (${s.type_seance}) – ${s.salle_nom} – ${s.groupe_nom}`}
                                                            >
                                                                <div className="me-event-time">{fmt(s.heure_debut)} – {fmt(s.heure_fin)}</div>
                                                                <div className="me-event-title">{s.module_nom || "—"}</div>
                                                                <div className="me-event-meta">
                                                                    <span>{s.groupe_nom || "—"}</span>
                                                                    <span>{s.salle_nom || "—"}</span>
                                                                </div>
                                                                <span className={`me-event-tag me-event-tag--${ft.toLowerCase()}`}>{ft}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </main>

            <style>{`
        /* ── Mon Emploi specific styles ── */
        .me-spin{animation:me-rotate .8s linear infinite;}
        @keyframes me-rotate{to{transform:rotate(360deg);}}

        .me-legend{display:flex;gap:24px;margin-bottom:20px;flex-wrap:wrap;}
        .me-legend-item{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-gray);font-weight:500;}
        .me-dot{width:12px;height:12px;border-radius:3px;}
        .me-dot--fi{background:#3b82f6;}
        .me-dot--fta{background:#8b5cf6;}
        .me-dot--weekend{background:#f3e8ff;}

        .me-container{overflow-x:auto;background:#fff;border-radius:var(--radius);box-shadow:var(--shadow);padding:1rem;}
        .me-grid{display:grid;grid-template-columns:64px repeat(7,minmax(140px,1fr));gap:1px;background:#e5e7eb;border:1px solid #e5e7eb;}
        .me-grid>div{background:#fff;padding:8px;}

        .me-corner{background:#f9fafb;}
        .me-day-header{font-weight:700;text-align:center;padding:14px 8px;background:#f9fafb;color:var(--text-dark);font-size:14px;letter-spacing:.3px;}
        .me-day-header--weekend{background:#f3e8ff;color:#7c3aed;}

        .me-time{text-align:right;padding-right:10px;color:var(--text-gray);font-size:.82rem;font-weight:500;display:flex;align-items:flex-start;justify-content:flex-end;padding-top:8px;font-variant-numeric:tabular-nums;}

        .me-cell{min-height:76px;display:flex;flex-direction:column;gap:4px;}
        .me-cell--weekend{background:#faf5ff;}

        .me-event{padding:6px 8px;border-radius:6px;font-size:.75rem;overflow:hidden;transition:transform .2s,box-shadow .2s;cursor:default;}
        .me-event:hover{transform:scale(1.02);z-index:10;box-shadow:0 4px 8px rgba(0,0,0,.12);}

        .me-event--fi{background:#eff6ff;border-left:3px solid #3b82f6;}
        .me-event--fta{background:#f5f3ff;border-left:3px solid #8b5cf6;}

        .me-event-time{font-weight:600;color:#1f2937;margin-bottom:1px;}
        .me-event-title{font-weight:700;color:#111827;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .me-event-meta{display:flex;justify-content:space-between;color:#6b7280;font-size:.7rem;margin-top:2px;}

        .me-event-tag{display:inline-block;margin-top:3px;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;letter-spacing:.5px;}
        .me-event-tag--fi{background:#dbeafe;color:#1d4ed8;}
        .me-event-tag--fta{background:#ede9fe;color:#6d28d9;}
      `}</style>
        </div>
    );
}

export default MonEmploi;
