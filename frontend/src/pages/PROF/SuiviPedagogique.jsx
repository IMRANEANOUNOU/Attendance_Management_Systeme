import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarProf from "../../components/SideBarProf";
import "../../CSS/Dashboard.css";
import api from "../../api/axios";

function SuiviPedagogique() {
  const navigate = useNavigate();
  const [data, setData] = useState({ filieres: [], modules: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "PROF") {
      navigate("/login");
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const departementId = localStorage.getItem("departement_id");
      if (!departementId) return;

      const res = await api.get(`academic/departements/${departementId}/suivi-pedagogique/`);
      setData(res.data || { filieres: [], modules: [] });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getPct = (m) => m.progression || 0;
  const isLate = (m) => getPct(m) < 50;

  return (
    <div className="dashboard-container">
      <SideBarProf />
      <main className="main-content">
        <header className="top-bar">
          <div className="welcome-text">
            <h1>Suivi Pédagogique ({data.departement || "Département"})</h1>
            <p>Supervision des programmes et avancement des modules</p>
          </div>
          <div className="avatar">SP</div>
        </header>

        {/* Programs Supervision: Global Overview of Filières */}
        <section className="recent-activity" style={{ marginBottom: "2rem" }}>
          <h2>Supervision des Programmes (Filières)</h2>
          {loading ? (
            <p style={{ color: "var(--text-gray)" }}>Chargement…</p>
          ) : data.filieres.length === 0 ? (
            <p style={{ color: "var(--text-gray)" }}>Aucune filière trouvée.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
              {data.filieres.map((fil) => (
                <div key={fil.id} className="stat-card" style={{ flexDirection: "column", alignItems: "flex-start", padding: "20px" }}>
                  <h3 style={{ margin: "0 0 12px 0", fontSize: "16px", color: "var(--text-dark)" }}>{fil.nom}</h3>
                  <div style={{ width: "100%", marginBottom: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "var(--text-gray)", marginBottom: "4px" }}>
                      <span>Progression globale</span>
                      <span style={{ fontWeight: 600, color: fil.progression < 50 ? "#b91c1c" : "var(--primary-color)" }}>{fil.progression}%</span>
                    </div>
                    <div style={{ height: "8px", background: "#e5e7eb", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${fil.progression}%`, height: "100%", background: fil.progression < 50 ? "#ef4444" : "var(--primary-color)", transition: "width 0.3s ease" }} />
                    </div>
                  </div>
                  <span style={{ fontSize: "12px", color: "var(--text-gray)" }}>{fil.modules_count} modules actifs</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pedagogical Follow-up: Modules Table */}
        <section className="recent-activity">
          <h2>Avancement Détaillé par Module</h2>

          {loading ? (
            <p style={{ color: "var(--text-gray)" }}>Chargement…</p>
          ) : data.modules.length === 0 ? (
            <p style={{ color: "var(--text-gray)" }}>
              Aucun module trouvé pour ce département.
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Filière</th>
                  <th>Module</th>
                  <th>Professeur</th>
                  <th>Heures effectuées</th>
                  <th>Progression</th>
                </tr>
              </thead>
              <tbody>
                {data.modules.map((m) => {
                  const pct = getPct(m);
                  const danger = isLate(m);
                  return (
                    <tr
                      key={m.id}
                      style={
                        danger
                          ? { backgroundColor: "#fef2f2" }
                          : undefined
                      }
                    >
                      <td style={{ fontWeight: 500 }}>{m.filiere_nom}</td>
                      <td>{m.module_nom}</td>
                      <td>{m.prof_nom}</td>
                      <td>
                        {m.heures_faites} / {m.heures_totales} h
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              flex: 1,
                              height: 10,
                              borderRadius: 999,
                              backgroundColor: "#e5e7eb",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: "100%",
                                borderRadius: "999px",
                                background:
                                  danger ? "#ef4444" : "var(--primary-color)",
                                transition: "width 0.2s ease",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: danger ? "#b91c1c" : "#111827",
                              minWidth: 40,
                              textAlign: "right",
                            }}
                          >
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </div>
  );
}

export default SuiviPedagogique;
