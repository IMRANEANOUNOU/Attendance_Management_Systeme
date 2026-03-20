import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import SideBarEtudiant from "../../components/SideBarEtudiant";
import {
    User, Mail, CreditCard, MapPin, Calendar,
    GraduationCap, Users, Building2, Loader2, BookOpen
} from "lucide-react";

function MonProfil() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const role = localStorage.getItem("role");
        if (!token || role !== "ETUDIANT") { navigate("/login"); return; }
        fetchProfile();
    }, [navigate]);

    const fetchProfile = async () => {
        try {
            const res = await api.get("accounts/student-profile/");
            setProfile(res.data);
        } catch (e) {
            console.error(e);
            setError("Impossible de charger votre profil.");
        } finally { setLoading(false); }
    };

    const baseUrl = api.defaults.baseURL?.replace(/\/api\/?$/, '') || 'http://localhost:8000';

    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="dashboard-container">
            <SideBarEtudiant />
            <main className="main-content">
                {/* Header */}
                <header className="top-bar">
                    <div className="welcome-text">
                        <h1>Mon Profil</h1>
                        <p>Informations personnelles & académiques</p>
                    </div>
                    <div className="avatar" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
                        <User size={22} color="white" />
                    </div>
                </header>

                {loading ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 60, justifyContent: "center", color: "var(--text-gray)" }}>
                        <Loader2 size={24} className="mp-spin" /> Chargement du profil…
                    </div>
                ) : error ? (
                    <div style={{ color: "#991b1b", background: "#fee2e2", padding: 16, borderRadius: 12, fontSize: 14 }}>{error}</div>
                ) : profile ? (
                    <>
                        {/* Profile Hero - Refined to be centered and circular */}
                        <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", marginBottom: 35, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", background: "#fff" }}>
                            <div style={{ height: 160, background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)" }}></div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 32px 32px", marginTop: -60, position: "relative", zIndex: 1 }}>
                                <div
                                    style={{ flexShrink: 0, cursor: "pointer", transition: "transform .2s" }}
                                    onClick={() => setIsModalOpen(true)}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                                >
                                    {profile.photo_profile ? (
                                        <img src={`${baseUrl}${profile.photo_profile}`} alt="Photo" style={{ width: 120, height: 120, borderRadius: "50%", objectFit: "cover", border: "5px solid #fff", boxShadow: "0 8px 16px rgba(0,0,0,0.15)", background: "#f3f4f6" }} />
                                    ) : (
                                        <div style={{ width: 120, height: 120, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: "#e5e7eb", border: "5px solid #fff", boxShadow: "0 8px 16px rgba(0,0,0,0.15)" }}>
                                            <User size={56} color="#6b7280" />
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: "center", marginTop: 16 }}>
                                    <h2 style={{ fontSize: 26, fontWeight: 800, color: "#111827", margin: 0 }}>{profile.full_name}</h2>
                                    <p style={{ color: "#6b7280", fontSize: 15, margin: "4px 0 12px", fontWeight: 500 }}>{profile.email}</p>
                                    {profile.filiere && (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#ede9fe", color: "#6d28d9", padding: "6px 16px", borderRadius: 12, fontSize: 13, fontWeight: 700 }}>
                                            <GraduationCap size={16} /> {profile.filiere.nom}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Lightbox Modal */}
                        {isModalOpen && (
                            <div
                                onClick={() => setIsModalOpen(false)}
                                style={{
                                    position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                                    background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex",
                                    alignItems: "center", justifyContent: "center", cursor: "zoom-out",
                                    backdropFilter: "blur(5px)"
                                }}
                            >
                                <img
                                    src={`${baseUrl}${profile.photo_profile}`}
                                    alt="Large Photo"
                                    style={{ maxHeight: "90%", maxWidth: "90%", borderRadius: 20, boxShadow: "0 0 50px rgba(0,0,0,0.5)", border: "4px solid #fff" }}
                                />
                                <button
                                    style={{ position: "absolute", display: "flex", alignItems: "center", justifyContent: "center", top: 30, right: 30, background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", width: 44, height: 44, borderRadius: "20%", cursor: "pointer", fontSize: 24 }}
                                    onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
                                >
                                    ×
                                </button>
                            </div>
                        )}

                        {/* Info Cards Grid */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
                            {/* Personal Info */}
                            <div className="stat-card" style={{ flexDirection: "column", alignItems: "stretch", padding: 24 }}>
                                <h3 className="section-title" style={{ fontSize: 16, marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #f3f4f6" }}>
                                    <User size={18} /> Informations Personnelles
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <InfoRow icon={<Mail size={16} />} label="Email" value={profile.email} />
                                    <InfoRow icon={<CreditCard size={16} />} label="CNE" value={profile.cne} />
                                    <InfoRow
                                        icon={<Calendar size={16} />}
                                        label="Date de Naissance"
                                        value={profile.date_naissance ? new Date(profile.date_naissance).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }) : "Non renseignée"}
                                    />
                                    <InfoRow icon={<MapPin size={16} />} label="Adresse" value={profile.adresse || "Non renseignée"} />
                                </div>
                            </div>

                            {/* Academic Info */}
                            <div className="stat-card" style={{ flexDirection: "column", alignItems: "stretch", padding: 24 }}>
                                <h3 className="section-title" style={{ fontSize: 16, marginBottom: 20, paddingBottom: 12, borderBottom: "1px solid #f3f4f6" }}>
                                    <GraduationCap size={18} /> Informations Académiques
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                    <InfoRow gradient="linear-gradient(135deg,#818cf8,#6366f1)" icon={<BookOpen size={16} color="white" />} label="Filière" value={profile.filiere ? profile.filiere.nom : "Non assignée"} />
                                    {profile.filiere && (
                                        <InfoRow gradient="linear-gradient(135deg,#a78bfa,#8b5cf6)" icon={<GraduationCap size={16} color="white" />} label="Diplôme" value={profile.filiere.type_diplome} />
                                    )}
                                    <InfoRow gradient="linear-gradient(135deg,#34d399,#10b981)" icon={<Users size={16} color="white" />} label="Groupe" value={profile.groupe ? `${profile.groupe.nom} — ${profile.groupe.niveau}` : "Non assigné"} />
                                    <InfoRow gradient="linear-gradient(135deg,#f97316,#ea580c)" icon={<Building2 size={16} color="white" />} label="Département" value={profile.departement ? profile.departement.nom : "Non assigné"} />
                                </div>
                            </div>
                        </div>
                    </>
                ) : null}
            </main>

            <style>{`
                .mp-spin { animation: spin .8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}

const InfoRow = ({ icon, label, value, gradient, color = "#6b7280" }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
            width: 38, height: 38, borderRadius: 10, background: gradient || "#f3f4f6",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: gradient ? "white" : color
        }}>
            {icon}
        </div>
        <div>
            <span style={{ display: "block", fontSize: 12, color: "#9ca3af", fontWeight: 500, textTransform: "uppercase", letterSpacing: ".3px" }}>{label}</span>
            <span style={{ display: "block", fontSize: 14, color: "#111827", fontWeight: 500, marginTop: 1 }}>{value}</span>
        </div>
    </div>
);

export default MonProfil;
