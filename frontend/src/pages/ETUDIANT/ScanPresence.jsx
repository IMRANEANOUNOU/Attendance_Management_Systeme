import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { Check, AlertTriangle, Loader2, ArrowLeft, MapPin, Camera, XCircle, User } from "lucide-react";

const MAX_FACE_ATTEMPTS = 25; // ~37s of trying (every 1.5s)

const ScanPresence = () => {
    const { seanceId } = useParams();
    const navigate = useNavigate();

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const intervalRef = useRef(null);
    const streamRef = useRef(null);
    const isSendingRef = useRef(false);
    const locationRef = useRef(null);
    const attemptsRef = useRef(0);
    const videoReadyRef = useRef(false);

    const [phase, setPhase] = useState("init");
    // "init" | "scanning" | "success" | "error"

    const [gpsStatus, setGpsStatus] = useState("pending"); // "pending"|"ok"|"fail"
    const [camStatus, setCamStatus] = useState("pending");
    const [gpsMessage, setGpsMessage] = useState("Localisation en cours…");
    const [camMessage, setCamMessage] = useState("Ouverture de la caméra…");
    const [verifying, setVerifying] = useState(false);
    const [matchScore, setMatchScore] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");
    const [errorType, setErrorType] = useState(""); // "zone"|"face"|"cam"|"gps"|"other"
    const [faceDetected, setFaceDetected] = useState(false);

    // ── Stop everything ───────────────────────────────────────────────────
    const stopEverything = useCallback(() => {
        if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
        if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
        isSendingRef.current = false;
    }, []);

    useEffect(() => () => stopEverything(), [stopEverything]);

    // ── Fail helper ───────────────────────────────────────────────────────
    const fail = useCallback((msg, type = "other") => {
        stopEverything();
        setErrorMsg(msg);
        setErrorType(type);
        setPhase("error");
    }, [stopEverything]);

    // ── Capture loop ──────────────────────────────────────────────────────
    const startLoop = useCallback(() => {
        if (intervalRef.current) return;

        intervalRef.current = setInterval(async () => {
            if (isSendingRef.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const loc = locationRef.current;
            if (!video || !canvas || !loc) return;

            // Wait until video is truly ready
            if (!videoReadyRef.current || video.readyState < 2 || video.videoWidth === 0) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext("2d").drawImage(video, 0, 0);

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                isSendingRef.current = true;
                setVerifying(true);

                const fd = new FormData();
                fd.append("seance_id", seanceId);
                // fd.append("latitude", loc.latitude);
                fd.append("latitude", 33.5731104);
                // fd.append("longitude", loc.longitude);
                fd.append("longitude", -7.5898434);
                fd.append("photo", new File([blob], "frame.jpg", { type: "image/jpeg" }));

                try {
                    const res = await api.post("/attendance/marquer-presence/", fd, {
                        headers: { "Content-Type": "multipart/form-data" }
                    });
                    if (res.data.success) {
                        stopEverything();
                        setMatchScore(res.data.score);
                        setFaceDetected(true);
                        setPhase("success");
                    }
                } catch (err) {
                    const msg = (err.response?.data?.message || "").toLowerCase();
                    const status = err.response?.status;

                    // ── Zone not authorized ────────────────────────────────
                    if (msg.includes("zone")) {
                        fail(
                            "Vous n'êtes pas dans la zone autorisée pour cette séance. Rapprochez-vous de la salle.",
                            "zone"
                        );
                        return;
                    }

                    // ── Session closed ─────────────────────────────────────
                    if (status === 403) {
                        fail("La séance est terminée. Le pointage est clos.", "other");
                        return;
                    }

                    // ── Face detected but not matched (count as attempt) ───
                    // Only increment attempts for face-related failures (400 = no face or no match)
                    if (status === 400) {
                        if (msg.includes("face") || msg.includes("visage") || msg.includes("reconnu")) {
                            attemptsRef.current += 1;
                            setFaceDetected(false);
                        }
                        if (attemptsRef.current >= MAX_FACE_ATTEMPTS) {
                            fail(
                                "Visage non reconnu après plusieurs tentatives. Assurez-vous d'être bien éclairé et que votre visage est bien centré.",
                                "face"
                            );
                        }
                    }
                    // For other errors (network, 500...) don't count as face failure
                } finally {
                    isSendingRef.current = false;
                    setVerifying(false);
                }
            }, "image/jpeg", 0.85);
        }, 1500);
    }, [seanceId, stopEverything, fail]);

    // ── Auto-start on mount ───────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        const init = async () => {
            // ─ 1. GPS ─────────────────────────────────────────────────────
            const gpsPromise = new Promise((resolve) => {
                if (!navigator.geolocation) {
                    return resolve({ ok: false, msg: "Géolocalisation non supportée." });
                }
                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve({ ok: true, loc: { latitude: pos.coords.latitude, longitude: pos.coords.longitude } }),
                    (err) => {
                        const m = { 1: "Accès GPS refusé. Autorisez la localisation.", 2: "Position introuvable.", 3: "Délai GPS dépassé." };
                        resolve({ ok: false, msg: m[err.code] || "Erreur GPS." });
                    },
                    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
                );
            });

            // ─ 2. Camera ──────────────────────────────────────────────────
            const camPromise = navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
                audio: false
            }).then(s => ({ ok: true, stream: s }))
                .catch(err => {
                    const m = {
                        NotAllowedError: "Accès caméra refusé. Autorisez la caméra.",
                        NotFoundError: "Aucune caméra détectée.",
                        NotReadableError: "Caméra occupée par une autre application."
                    };
                    return { ok: false, msg: m[err.name] || "Impossible d'accéder à la caméra." };
                });

            const [gps, cam] = await Promise.all([gpsPromise, camPromise]);
            if (cancelled) return;

            // ─ GPS result ──────────────────────────────────────────────────
            if (gps.ok) {
                locationRef.current = gps.loc;
                setGpsStatus("ok");
                setGpsMessage("GPS obtenu — vérification de la zone…");
            } else {
                setGpsStatus("fail");
                setGpsMessage(gps.msg);
            }

            // ─ Camera result ──────────────────────────────────────────────
            if (cam.ok) {
                streamRef.current = cam.stream;
                setCamStatus("ok");
                setCamMessage("Caméra active");
                if (videoRef.current) {
                    videoRef.current.srcObject = cam.stream;
                    videoRef.current.onloadedmetadata = () => {
                        videoReadyRef.current = true;
                        videoRef.current.play().catch(() => { });
                    };
                }
            } else {
                setCamStatus("fail");
                setCamMessage(cam.msg);
            }

            // ─ Start only if both browser-level checks pass ────────────────
            if (gps.ok && cam.ok) {
                setTimeout(() => {
                    if (!cancelled) {
                        setPhase("scanning");
                        startLoop();
                    }
                }, 900);
            } else {
                setPhase("error");
                setErrorMsg(!gps.ok ? gps.msg : cam.msg);
                setErrorType(!gps.ok ? "gps" : "cam");
            }
        };

        init();
        return () => { cancelled = true; };
    }, [startLoop]);

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div style={S.page}>
            {/* Header */}
            <header style={S.header}>
                <button style={S.backBtn} onClick={() => { stopEverything(); navigate(-1); }}>
                    <ArrowLeft size={22} />
                </button>
                <span style={S.headerTitle}>Pointage Présence</span>
            </header>

            {/* Video — always in DOM, fills the whole background */}
            <video
                ref={videoRef}
                autoPlay playsInline muted
                style={{ ...S.video, opacity: phase === "scanning" ? 1 : 0 }}
            />

            {/* Dark overlay on top of video */}
            <div style={S.videoOverlay} />

            <div style={S.overlay}>
                {/* ── INIT ── */}
                {phase === "init" && (
                    <div style={S.card}>
                        <div style={S.initIcon}>
                            <Camera size={32} color="#6366f1" />
                        </div>
                        <h2 style={S.cardTitle}>Initialisation…</h2>

                        <div style={S.statusRow}>
                            <MapPin size={20} color={gpsStatus === "ok" ? "#f59e0b" : gpsStatus === "fail" ? "#ef4444" : "#6b7280"} />
                            <span style={{ color: gpsStatus === "fail" ? "#ef4444" : "#d1d5db", flex: 1, fontSize: 14 }}>{gpsMessage}</span>
                            {gpsStatus === "pending" && <Loader2 size={16} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />}
                            {gpsStatus === "ok" && <span style={{ color: "#f59e0b", fontSize: 12 }}>✓</span>}
                        </div>

                        <div style={S.statusRow}>
                            <Camera size={20} color={camStatus === "ok" ? "#10b981" : camStatus === "fail" ? "#ef4444" : "#6b7280"} />
                            <span style={{ color: camStatus === "ok" ? "#10b981" : camStatus === "fail" ? "#ef4444" : "#d1d5db", flex: 1, fontSize: 14 }}>{camMessage}</span>
                            {camStatus === "pending" && <Loader2 size={16} style={{ animation: "spin 1s linear infinite", flexShrink: 0 }} />}
                            {camStatus === "ok" && <Check size={16} color="#10b981" />}
                        </div>

                        <p style={{ color: "#6b7280", fontSize: 12, textAlign: "center", margin: 0 }}>
                            Autorisez la caméra et la localisation dans votre navigateur.
                        </p>
                    </div>
                )}

                {/* ── SCANNING ── */}
                {phase === "scanning" && (
                    <>
                        {/* Circular face ring */}
                        <div style={S.faceRingWrapper}>
                            {/* Outer glow ring (animated) */}
                            <div style={{
                                ...S.faceRingOuter,
                                ...(verifying ? S.faceRingVerifying : {}),
                            }} />
                            {/* Rotating arc */}
                            <div style={S.faceRingArc} />
                            {/* Inner circle (semi-transparent) */}
                            <div style={S.faceRingInner} />
                            {/* Face icon placeholder */}
                            <div style={S.faceIconCenter}>
                                <User size={36} color="rgba(255,255,255,0.15)" />
                            </div>
                        </div>

                        {/* HUD bottom */}
                        <div style={S.hud}>
                            <div style={S.badge}>
                                <MapPin size={13} color="#f59e0b" />
                                <span style={{ color: "#f59e0b", fontSize: 12 }}>Vérification de la zone…</span>
                            </div>

                            <div style={S.scanStatus}>
                                <div style={{
                                    ...S.dot,
                                    background: verifying ? "#f59e0b" : "#10b981",
                                    boxShadow: verifying ? "0 0 8px #f59e0b" : "0 0 8px #10b981"
                                }} />
                                <span style={{ fontSize: 14, fontWeight: 500 }}>
                                    {verifying ? "Analyse du visage…" : "Recherche du visage…"}
                                </span>
                            </div>

                            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, margin: 0, textAlign: "center" }}>
                                Centrez votre visage dans le cercle
                            </p>
                        </div>
                    </>
                )}

                {/* ── ERROR ── */}
                {phase === "error" && (
                    <div style={{ ...S.card, borderColor: "#ef4444", borderWidth: 1.5 }}>
                        <div style={S.errorIcon}>
                            {errorType === "zone"
                                ? <MapPin size={32} color="#ef4444" />
                                : errorType === "face"
                                    ? <Camera size={32} color="#ef4444" />
                                    : <XCircle size={32} color="#ef4444" />
                            }
                        </div>
                        <h2 style={{ color: "#ef4444", margin: "12px 0 8px", fontSize: 18, textAlign: "center", fontWeight: 700 }}>
                            {errorType === "zone" ? "Zone non autorisée"
                                : errorType === "face" ? "Visage non reconnu"
                                    : "Erreur"}
                        </h2>
                        <p style={{ color: "#9ca3af", textAlign: "center", fontSize: 14, lineHeight: 1.6, margin: 0 }}>{errorMsg}</p>
                        <button style={S.retryBtn} onClick={() => window.location.reload()}>
                            ↩ Réessayer
                        </button>
                    </div>
                )}

                {/* ── SUCCESS ── */}
                {phase === "success" && (
                    <div style={S.successCard}>
                        <div style={S.successRing}>
                            <div style={S.successIcon}><Check size={44} color="#fff" strokeWidth={3} /></div>
                        </div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, margin: "20px 0 8px", letterSpacing: -0.5 }}>Présence Confirmée !</h2>
                        <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 24, textAlign: "center", lineHeight: 1.6 }}>
                            Votre présence a été enregistrée avec succès.
                        </p>
                        {matchScore && (
                            <div style={S.scoreBadge}>
                                <span style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1 }}>Score IA</span>
                                <span style={{ fontSize: 26, fontWeight: 800 }}>{Math.round(matchScore * 100)}%</span>
                            </div>
                        )}
                        <button style={S.dashBtn} onClick={() => navigate("/etudiant/dashboard")}>
                            Retour au Tableau de Bord
                        </button>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />

            <style>{`
                @keyframes spin        { to { transform: rotate(360deg); } }
                @keyframes ringRotate  { to { transform: rotate(360deg); } }
                @keyframes ringPulse   {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.55), 0 0 30px rgba(99,102,241,0.25); }
                    50%      { box-shadow: 0 0 0 10px rgba(99,102,241,0), 0 0 60px rgba(99,102,241,0.45); }
                }
                @keyframes ringVerify  {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.55), 0 0 30px rgba(245,158,11,0.25); }
                    50%      { box-shadow: 0 0 0 10px rgba(245,158,11,0), 0 0 60px rgba(245,158,11,0.45); }
                }
                @keyframes successGlow {
                    0%, 100% { box-shadow: 0 0 30px rgba(16,185,129,0.5); }
                    50%      { box-shadow: 0 0 60px rgba(16,185,129,0.8); }
                }
                @keyframes fadeSlideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

/* ── Styles ── */
const RING_SIZE = 270;

const S = {
    page: {
        position: "fixed", inset: 0,
        background: "#0a0a0f",
        color: "#fff",
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden"
    },
    header: {
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
        display: "flex", alignItems: "center", gap: 14,
        padding: "16px 18px",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, transparent 100%)"
    },
    backBtn: {
        background: "rgba(255,255,255,0.1)",
        border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff", cursor: "pointer",
        padding: "8px", borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(8px)"
    },
    headerTitle: { fontSize: 17, fontWeight: 600, letterSpacing: -0.3 },

    video: {
        position: "absolute", inset: 0,
        width: "100%", height: "100%",
        objectFit: "cover",
        transition: "opacity 0.6s ease",
        zIndex: 1
    },
    videoOverlay: {
        position: "absolute", inset: 0, zIndex: 2,
        background: "radial-gradient(ellipse 70% 70% at 50% 40%, transparent 30%, rgba(0,0,0,0.72) 100%)"
    },
    overlay: {
        position: "absolute", inset: 0, zIndex: 10,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center"
    },

    // Init card
    card: {
        background: "rgba(17,24,39,0.92)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24, padding: "28px 24px",
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 14,
        width: "88%", maxWidth: 370,
        backdropFilter: "blur(20px)",
        animation: "fadeSlideUp 0.4s ease forwards"
    },
    initIcon: {
        width: 64, height: 64, borderRadius: "50%",
        background: "rgba(99,102,241,0.12)",
        border: "1px solid rgba(99,102,241,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center"
    },
    cardTitle: { fontSize: 18, fontWeight: 700, margin: 0 },
    statusRow: {
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "10px 14px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 14
    },

    // Face ring (scanning state)
    faceRingWrapper: {
        position: "relative",
        width: RING_SIZE, height: RING_SIZE,
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    faceRingOuter: {
        position: "absolute", inset: 0,
        borderRadius: "50%",
        border: "3px solid rgba(99,102,241,0.85)",
        animation: "ringPulse 2s ease-in-out infinite",
        pointerEvents: "none"
    },
    faceRingVerifying: {
        border: "3px solid rgba(245,158,11,0.85)",
        animation: "ringVerify 1s ease-in-out infinite"
    },
    faceRingArc: {
        position: "absolute",
        inset: -6,
        borderRadius: "50%",
        border: "4px solid transparent",
        borderTopColor: "#6366f1",
        borderRightColor: "rgba(99,102,241,0.3)",
        animation: "ringRotate 1.6s linear infinite",
        pointerEvents: "none"
    },
    faceRingInner: {
        position: "absolute",
        inset: 14,
        borderRadius: "50%",
        border: "1px solid rgba(255,255,255,0.08)",
        pointerEvents: "none"
    },
    faceIconCenter: {
        position: "absolute",
        display: "flex", alignItems: "center", justifyContent: "center"
    },

    // HUD
    hud: {
        position: "absolute", bottom: 56,
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 14, width: "100%",
        paddingLeft: 24, paddingRight: 24
    },
    badge: {
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 16px",
        background: "rgba(245,158,11,0.12)",
        border: "1px solid rgba(245,158,11,0.28)",
        borderRadius: 20
    },
    scanStatus: {
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 24px",
        background: "rgba(0,0,0,0.55)",
        borderRadius: 32,
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255,255,255,0.1)"
    },
    dot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0, transition: "background 0.3s, box-shadow 0.3s" },

    // Error
    errorIcon: {
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(239,68,68,0.1)",
        border: "1px solid rgba(239,68,68,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center"
    },
    retryBtn: {
        marginTop: 12, padding: "13px 32px",
        fontSize: 14, fontWeight: 600,
        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        color: "#fff", border: "none", borderRadius: 14,
        cursor: "pointer",
        boxShadow: "0 6px 20px rgba(239,68,68,0.3)"
    },

    // Success
    successCard: {
        background: "rgba(17,24,39,0.96)",
        borderRadius: 28, padding: "40px 28px",
        display: "flex", flexDirection: "column",
        alignItems: "center", width: "88%", maxWidth: 370,
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(16,185,129,0.2)",
        animation: "fadeSlideUp 0.5s ease forwards"
    },
    successRing: {
        padding: 6, borderRadius: "50%",
        background: "linear-gradient(135deg, #10b981, #059669)",
        animation: "successGlow 2s ease-in-out infinite"
    },
    successIcon: {
        width: 80, height: 80, borderRadius: "50%",
        background: "linear-gradient(135deg, #10b981, #059669)",
        display: "flex", alignItems: "center", justifyContent: "center"
    },
    scoreBadge: {
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "14px 32px",
        background: "rgba(16,185,129,0.1)",
        border: "1px solid rgba(16,185,129,0.2)",
        borderRadius: 18, color: "#10b981", marginBottom: 24
    },
    dashBtn: {
        padding: "14px 32px", fontSize: 15, fontWeight: 700,
        background: "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
        color: "#fff", border: "none", borderRadius: 16, cursor: "pointer",
        boxShadow: "0 8px 24px rgba(79,70,229,0.4)",
        transition: "transform 0.15s, box-shadow 0.15s"
    },
};

export default ScanPresence;
