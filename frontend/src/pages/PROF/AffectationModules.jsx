import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarProf from "../../components/SideBarProf";
import "../../CSS/Dashboard.css";
import api from "../../api/axios";

function AffectationModules() {
  const navigate = useNavigate();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [profInput, setProfInput] = useState({});
  const [professeurs, setProfesseurs] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const isChefFiliere = localStorage.getItem("is_chef_filiere") === "true";
    if (!token || role !== "PROF" || !isChefFiliere) {
      navigate("/login");
      return;
    }
    fetchModules();
    fetchProfesseurs();
  }, [navigate]);

  const fetchProfesseurs = async () => {
    try {
      const res = await api.get("accounts/professeurs/");
      setProfesseurs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      const res = await api.get("academic/modules/");
      const list = Array.isArray(res.data?.modules) ? res.data.modules : [];
      setModules(list);
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Impossible de charger les modules." });
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (m) => {
    const profId = (profInput[m.id] || "").trim();
    if (!profId) return;
    try {
      setSavingId(m.id);
      setMessage({ type: "", text: "" });
      await api.post(`academic/modules/${m.id}/assign-prof/`, {
        professeur: profId,
      });
      setMessage({
        type: "success",
        text: "Professeur affecté au module avec succès.",
      });
      setProfInput((prev) => ({ ...prev, [m.id]: "" }));
      fetchModules();
    } catch (e) {
      const msg =
        e.response?.data?.error ||
        e.response?.data?.detail ||
        "Erreur lors de l'affectation.";
      setMessage({ type: "error", text: msg });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="dashboard-container">
      <SideBarProf />
      <main className="main-content">
        <header className="top-bar">
          <div className="welcome-text">
            <h1>Affectation des Modules</h1>
            <p>Affecter les professeurs aux modules de votre filière</p>
          </div>
          <div className="avatar">AM</div>
        </header>

        <section className="recent-activity">
          <h2>Liste des modules</h2>

          {loading ? (
            <p style={{ color: "var(--text-gray)" }}>Chargement…</p>
          ) : modules.length === 0 ? (
            <p style={{ color: "var(--text-gray)" }}>
              Aucun module trouvé pour votre filière.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Module</th>
                    <th>Filière</th>
                    <th>Professeur actuel</th>
                    <th>Nouvel ID Professeur</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {modules.map((m) => (
                    <tr key={m.id}>
                      <td>{m.nom}</td>
                      <td>{m.filiere_nom}</td>
                      <td>{m.professeur_nom}</td>
                      <td>
                        <select
                          value={profInput[m.id] || ""}
                          onChange={(e) =>
                            setProfInput((prev) => ({
                              ...prev,
                              [m.id]: e.target.value,
                            }))
                          }
                          style={{
                            padding: "6px 8px",
                            borderRadius: 6,
                            border: "1px solid #e5e7eb",
                            fontSize: 13,
                            width: 200,
                          }}
                        >
                          <option value="">-- Sélectionner --</option>
                          {professeurs.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.user?.last_name} {p.user?.first_name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={savingId === m.id || !(profInput[m.id] || "").trim()}
                          onClick={() => handleAssign(m)}
                        >
                          {savingId === m.id ? "En cours…" : "Affecter"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {message.text && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 14px",
                borderRadius: 8,
                backgroundColor:
                  message.type === "success" ? "#d1fae5" : "#fee2e2",
                color: message.type === "success" ? "#065f46" : "#991b1b",
                fontSize: 14,
              }}
            >
              {message.text}
            </div>
          )}

        </section>
      </main>
    </div>
  );
}

export default AffectationModules;

