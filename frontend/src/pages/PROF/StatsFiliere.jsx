import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarProf from "../../components/SideBarProf";
import "../../CSS/Dashboard.css";
import api from "../../api/axios";

function StatsFiliere() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [topGroups, setTopGroups] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const isChefFiliere = localStorage.getItem("is_chef_filiere") === "true";
    if (!token || role !== "PROF" || !isChefFiliere) {
      navigate("/login");
      return;
    }
    fetchStats();
  }, [navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const filiereId = localStorage.getItem("filiere_id");
      const res = await api.get(`academic/filieres/${filiereId}/stats/`);
      const data = res.data;

      setStats({
        totalEtudiants: data.totalEtudiants,
        totalAbsences: data.totalAbsences,
        justifiees: data.justifiees,
      });

      setTopGroups(data.topGroups || []);
      setTopStudents(data.topStudents || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <SideBarProf />
      <main className="main-content">
        <header className="top-bar">
          <div className="welcome-text">
            <h1>Statistiques de la Filière</h1>
            <p>Vue d&apos;ensemble des absences et groupes</p>
          </div>
          <div className="avatar">SF</div>
        </header>

        {loading ? (
          <p style={{ color: "var(--text-gray)" }}>Chargement…</p>
        ) : !stats ? (
          <p style={{ color: "var(--text-gray)" }}>
            Aucune donnée disponible pour cette filière.
          </p>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Étudiants</h3>
                  <h1>{stats.totalEtudiants}</h1>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Absences totales</h3>
                  <h1>{stats.totalAbsences}</h1>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-info">
                  <h3>Absences justifiées</h3>
                  <h1>{stats.justifiees}</h1>
                </div>
              </div>
            </div>

            <section className="recent-activity" style={{ marginBottom: 24 }}>
              <h2>Taux d&apos;absence par groupe (Top)</h2>
              {topGroups.length === 0 ? (
                <p style={{ color: "var(--text-gray)" }}>
                  Aucune donnée par groupe.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Groupe</th>
                        <th>Absences</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topGroups.map((g) => (
                        <tr key={g.id}>
                          <td>{g.nom}</td>
                          <td>{g.absences}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="recent-activity">
              <h2>Top étudiants les plus absents</h2>
              {topStudents.length === 0 ? (
                <p style={{ color: "var(--text-gray)" }}>
                  Aucune donnée étudiante.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Étudiant</th>
                        <th>Groupe</th>
                        <th>Absences</th>
                        <th>Justifiées</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topStudents.map((e) => (
                        <tr key={e.id}>
                          <td>
                            {e.user?.last_name} {e.user?.first_name}
                          </td>
                          <td>{e.groupe_nom || "—"}</td>
                          <td>{e.nb_absences || 0}</td>
                          <td>{e.nb_absences_justifiees || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default StatsFiliere;

