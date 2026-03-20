import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarProf from "../../components/SideBarProf";
import "../../CSS/Dashboard.css";
import api from "../../api/axios";

const STATUS_LABELS = {
  PENDING: "En attente",
  VALIDATED: "Validée",
  REJECTED: "Rejetée",
};

function ValidationJustifications() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });

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

      const res = await api.get("attendance/chef/justifications/");
      const data = Array.isArray(res.data) ? res.data : [];

      setRows(
        data.map((j) => {
          let fileUrl = j.fichier_url;
          // Ensure absolute URL for media files to avoid React dev server redirection
          if (fileUrl && fileUrl.startsWith("/")) {
            fileUrl = `http://127.0.0.1:8000${fileUrl}`;
          }
          return {
            id: j.id,
            presence_prof_id: j.presence_prof_id,
            etudiant_nom: j.etudiant_nom,
            groupe_nom: j.groupe_nom,
            date: j.date,
            justification_file: fileUrl,
            status: j.etat === "EN_ATTENTE" ? "PENDING" : j.etat,
          };
        })
      );
    } catch (e) {
      console.error(e);
      setMessage({ type: "error", text: "Impossible de charger les justificatifs." });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (absenceId, status) => {
    try {
      setSavingId(absenceId);
      setMessage({ type: "", text: "" });
      try {
        await api.post("attendance/chef/traiter-justification/", {
          justification_id: absenceId,
          decision: status === "VALIDATED" ? "APPROUVE" : "REFUSE",
        });
      } catch {
      }
      setRows((prev) => prev.filter((r) => r.id !== absenceId));
      setMessage({
        type: "success",
        text:
          status === "VALIDATED"
            ? "Justificatif validé avec succès."
            : "Justificatif rejeté.",
      });
    } catch (e) {
      console.error(e);
      setMessage({
        type: "error",
        text: "Erreur lors de la mise à jour du statut.",
      });
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
            <h1>Validation des Justificatifs</h1>
            <p>Gestion des certificats médicaux et justificatifs d'absence</p>
          </div>
          <div className="avatar">JF</div>
        </header>

        <section className="recent-activity">
          <h2>Justificatifs en attente</h2>

          {loading ? (
            <p style={{ color: "var(--text-gray)" }}>Chargement…</p>
          ) : rows.length === 0 ? (
            <p style={{ color: "var(--text-gray)" }}>
              Aucun justificatif en attente de validation.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table>
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Groupe</th>
                    <th>Date</th>
                    <th>Fichier</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((a) => (
                    <tr key={a.id}>
                      <td>{a.etudiant_nom || "—"}</td>
                      <td>{a.groupe_nom || "—"}</td>
                      <td>{a.date}</td>
                      <td>
                        {a.justification_file ? (
                          <a
                            href={a.justification_file}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-link"
                          >
                            Ouvrir le fichier
                          </a>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <span className="badge">
                          {STATUS_LABELS[a.status] || a.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-success"
                          disabled={savingId === a.id}
                          onClick={() => updateStatus(a.id, "VALIDATED")}
                        >
                          ✅ Valider
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          disabled={savingId === a.id}
                          onClick={() => updateStatus(a.id, "REJECTED")}
                          style={{ marginLeft: 8 }}
                        >
                          ❌ Rejeter
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

export default ValidationJustifications;

