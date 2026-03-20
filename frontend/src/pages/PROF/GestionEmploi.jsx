import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import SideBarProf from "../../components/SideBarProf";
import "../../CSS/Dashboard.css";
import api from "../../api/axios";

const DAYS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI", "DIMANCHE"];
const DAY_LABELS = {
  LUNDI: "Lundi",
  MARDI: "Mardi",
  MERCREDI: "Mercredi",
  JEUDI: "Jeudi",
  VENDREDI: "Vendredi",
  SAMEDI: "Samedi",
  DIMANCHE: "Dimanche",
};

function GestionEmploi() {
  const navigate = useNavigate();
  const [groupes, setGroupes] = useState([]);
  const [seances, setSeances] = useState([]);
  const [salles, setSalles] = useState([]);
  const [modules, setModules] = useState([]);
  const [professeurs, setProfesseurs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeance, setEditingSeance] = useState(null);
  const [formData, setFormData] = useState({
    groupe: "",
    jour: "LUNDI",
    heure_debut: "08:30:00",
    heure_fin: "10:30:00",
    module: "",
    professeur: "",
    salle: "",
    type_seance: "COURS",
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const isChefFiliere = localStorage.getItem("is_chef_filiere") === "true";
    if (!token || role !== "PROF" || !isChefFiliere) {
      navigate("/login");
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [grpRes, seanceRes, salleRes, modRes, profRes] = await Promise.all([
        api.get("academic/groupes/"),
        api.get("schedule/seances/"),
        api.get("academic/salles/"),
        api.get("academic/modules/"),
        api.get("accounts/professeurs/"),
      ]);

      setGroupes(Array.isArray(grpRes.data) ? grpRes.data : []);
      setSeances(Array.isArray(seanceRes.data) ? seanceRes.data : []);
      setSalles(Array.isArray(salleRes.data) ? salleRes.data : []);
      const allModules = Array.isArray(modRes.data?.modules) ? modRes.data.modules : Array.isArray(modRes.data) ? modRes.data : [];
      setModules(allModules);
      setProfesseurs(Array.isArray(profRes.data) ? profRes.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getSeancesFor = (groupeId, jour) =>
    seances
      .filter((s) => s.groupe === groupeId && s.jour === jour)
      .sort((a, b) => (a.heure_debut || "").localeCompare(b.heure_debut || ""));

  const fmt = (t) => (t ? t.slice(0, 5) : "");

  const openModal = (groupeId, jour, existing = null) => {
    setMsg({ type: "", text: "" });
    if (existing) {
      setEditingSeance(existing.id);
      setFormData({
        groupe: existing.groupe || groupeId,
        jour: existing.jour || jour,
        heure_debut: existing.heure_debut || "08:30:00",
        heure_fin: existing.heure_fin || "10:30:00",
        module: existing.module || "",
        professeur: existing.professeur || "",
        salle: existing.salle || "",
        type_seance: existing.type_seance || "COURS",
      });
    } else {
      setEditingSeance(null);
      setFormData({
        groupe: groupeId,
        jour: jour,
        heure_debut: "08:30:00",
        heure_fin: "10:30:00",
        module: "",
        professeur: "",
        salle: "",
        type_seance: "COURS",
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMsg({ type: "", text: "" });

      if (editingSeance) {
        await api.put(`schedule/seances/${editingSeance}/`, formData);
        setMsg({ type: "success", text: "Séance modifiée." });
      } else {
        await api.post(`schedule/seances/`, formData);
        setMsg({ type: "success", text: "Séance ajoutée." });
      }

      await fetchData();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      const errText = err.response?.data?.detail || err.response?.data?.error || "Erreur de sauvegarde.";
      setMsg({ type: "error", text: Array.isArray(errText) ? errText[0] : errText });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingSeance) return;
    if (!window.confirm("Supprimer cette séance ?")) return;
    try {
      setSaving(true);
      await api.delete(`schedule/seances/${editingSeance}/`);
      await fetchData();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Erreur lors de la suppression." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard-container">
      <SideBarProf />
      <main className="main-content">
        <header className="top-bar">
          <div className="welcome-text">
            <h1>Gestion des Emplois</h1>
            <p>Vue hebdomadaire des emplois du temps par groupe (filière)</p>
          </div>
          <div className="avatar">GE</div>
        </header>

        {loading ? (
          <p style={{ color: "var(--text-gray)" }}>Chargement…</p>
        ) : groupes.length === 0 ? (
          <p style={{ color: "var(--text-gray)" }}>
            Aucun groupe trouvé pour votre filière.
          </p>
        ) : (
          groupes.map((g) => (
            <section key={g.id} className="recent-activity" style={{ marginBottom: 24 }}>
              <h2>
                Emploi du temps – {g.nom} ({g.filiere_nom})
              </h2>
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Jour</th>
                      <th>Créneaux</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((d) => {
                      const list = getSeancesFor(g.id, d);
                      return (
                        <tr key={d}>
                          <td style={{ fontWeight: 600 }}>
                            {DAY_LABELS[d]}
                            <br />
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: 10, padding: "2px 6px", marginTop: 4 }}
                              onClick={() => openModal(g.id, d)}
                            >
                              + Ajouter
                            </button>
                          </td>
                          <td>
                            {list.length === 0 ? (
                              <span style={{ color: "var(--text-gray)" }}>Aucune séance</span>
                            ) : (
                              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                                {list.map((s) => (
                                  <div
                                    key={s.id}
                                    className="badge"
                                    onClick={() => openModal(g.id, d, s)}
                                    style={{
                                      background: "#eef2ff",
                                      color: "#4f46e5",
                                      borderRadius: 8,
                                      padding: "8px 12px",
                                      fontSize: 12,
                                      display: "inline-flex",
                                      flexDirection: "column",
                                      alignItems: "flex-start",
                                      gap: 4,
                                      cursor: "pointer",
                                      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                                      border: "1px solid #c7d2fe"
                                    }}
                                  >
                                    <span style={{ fontWeight: 700 }}>
                                      {fmt(s.heure_debut)} – {fmt(s.heure_fin)}
                                    </span>
                                    <span style={{ fontWeight: 600, color: "#312e81" }}>{s.module_nom || "—"}</span>
                                    <span style={{ fontSize: 11, color: "#6b7280" }}>
                                      {s.salle_nom || "Salle inconnue"} · {s.type_seance || "COURS"}
                                    </span>
                                    <span style={{ fontSize: 10, color: "#4f46e5" }}>
                                      Prof. {s.prof_nom || "—"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </main>

      {/* Modal */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 12,
              width: "100%",
              maxWidth: 500,
              boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <h2 style={{ marginTop: 0, marginBottom: 16 }}>
              {editingSeance ? "Modifier la Séance" : "Ajouter une Séance"}
            </h2>

            {msg.text && (
              <div style={{ marginBottom: 16, color: msg.type === "error" ? "red" : "green", fontSize: 14 }}>
                {msg.text}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Module *</label>
                <select
                  required
                  value={formData.module}
                  onChange={e => setFormData({ ...formData, module: e.target.value })}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
                >
                  <option value="">-- Choisir un module --</option>
                  {modules.map(m => (
                    <option key={m.id} value={m.id}>{m.nom} ({m.filiere_nom})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Professeur *</label>
                <select
                  required
                  value={formData.professeur}
                  onChange={e => setFormData({ ...formData, professeur: e.target.value })}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
                >
                  <option value="">-- Choisir un professeur --</option>
                  {professeurs.map(p => (
                    <option key={p.id} value={p.id}>{p.user?.last_name} {p.user?.first_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Salle *</label>
                <select
                  required
                  value={formData.salle}
                  onChange={e => setFormData({ ...formData, salle: e.target.value })}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
                >
                  <option value="">-- Choisir une salle --</option>
                  {salles.map(s => (
                    <option key={s.id} value={s.id}>{s.nom} ({s.capacite} places)</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Heure de début *</label>
                  <input
                    type="time"
                    required
                    value={formData.heure_debut}
                    onChange={e => setFormData({ ...formData, heure_debut: e.target.value })}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Heure de fin *</label>
                  <input
                    type="time"
                    required
                    value={formData.heure_fin}
                    onChange={e => setFormData({ ...formData, heure_fin: e.target.value })}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 14, fontWeight: 500 }}>Type de séance</label>
                <select
                  value={formData.type_seance}
                  onChange={e => setFormData({ ...formData, type_seance: e.target.value })}
                  style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #ccc" }}
                >
                  <option value="COURS">COURS</option>
                  <option value="TD">TD</option>
                  <option value="TP">TP</option>
                  <option value="EXAMEN">EXAMEN</option>
                  <option value="ACTIVITE">ACTIVITÉ</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                {editingSeance ? (
                  <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={saving}>
                    Supprimer
                  </button>
                ) : <div />}

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                    Annuler
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GestionEmploi;

