import React from "react";
import { Clock } from "lucide-react";

/**
 * WeeklySchedule Component
 * Displays a weekly schedule (Mon-Sun) for a given list of sessions.
 * @param {Array} seances - List of session objects
 */
const WeeklySchedule = ({ seances }) => {
    const DAYS = [
        "LUNDI",
        "MARDI",
        "MERCREDI",
        "JEUDI",
        "VENDREDI",
        "SAMEDI",
        "DIMANCHE",
    ];

    const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 08:00 to 22:00

    // Helper to parse "HH:MM:SS" or "HH:MM" to minutes from midnight
    const getMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(":").map(Number);
        return h * 60 + m;
    };

    // Filter sessions for a specific day and time slot
    const getSeancesForSlot = (day, hour) => {
        return seances.filter((s) => {
            if (s.jour !== day) return false;
            const startMin = getMinutes(s.heure_debut);
            const slotMin = hour * 60;
            // Check if session starts within this hour (simple logic)
            // or overlaps significantly. For grid, we usually map by start time.
            // Here, let's just place it if it starts in this hour for simplicity,
            // or better, we can use absolute positioning or row-span if we were advanced.
            // For this table, let's just show if it STARTs in this hour.
            return startMin >= slotMin && startMin < slotMin + 60;
        });
    };

    // Improved: Calculate grid position for a session
    // We can use a relative positioning within the cell or just list them.
    // better approach: Just list them in the cell corresponding to the hour.

    return (
        <div className="schedule-container">
            <div className="schedule-grid">
                {/* Header Row */}
                <div className="corner-cell"></div>
                {DAYS.map((day) => (
                    <div key={day} className="day-header">
                        {day.charAt(0) + day.slice(1).toLowerCase()}
                    </div>
                ))}

                {/* Time Rows */}
                {HOURS.map((hour) => (
                    <React.Fragment key={hour}>
                        {/* Time Label */}
                        <div className="time-label">
                            {`${hour.toString().padStart(2, "0")}:00`}
                        </div>

                        {/* Cells for each day */}
                        {DAYS.map((day) => {
                            const slotSeances = getSeancesForSlot(day, hour);
                            return (
                                <div key={`${day}-${hour}`} className="schedule-cell">
                                    {slotSeances.map((s) => (
                                        <div
                                            key={s.id}
                                            className={`event-card ${s.type_seance || "COURS"}`}
                                            title={`${s.module_nom} (${s.type_seance}) - ${s.salle_nom}`}
                                        >
                                            <div className="event-time">
                                                {s.heure_debut?.slice(0, 5)} - {s.heure_fin?.slice(0, 5)}
                                            </div>
                                            <div className="event-title">{s.module_nom}</div>
                                            <div className="event-details">
                                                <span className="event-group">{s.groupe_nom}</span>
                                                <span className="event-room">{s.salle_nom}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>

            <style>{`
        .schedule-container {
          overflow-x: auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          padding: 1rem;
        }
        .schedule-grid {
          display: grid;
          grid-template-columns: 60px repeat(7, minmax(140px, 1fr));
          gap: 1px;
          background: #e5e7eb; /* Grid lines color */
          border: 1px solid #e5e7eb;
        }
        .schedule-grid > div {
          background: white;
          padding: 8px;
        }
        .corner-cell {
            background: #f9fafb;
        }
        .day-header {
          font-weight: 600;
          text-align: center;
          padding: 12px;
          background: #f9fafb;
          color: #4b5563;
          text-transform: capitalize;
        }
        .time-label {
          text-align: right;
          padding-right: 12px;
          color: #6b7280;
          font-size: 0.85rem;
          font-weight: 500;
          display: flex;
          align-items: flex-start;
          justify-content: flex-end;
          padding-top: 8px;
        }
        .schedule-cell {
          min-height: 80px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .event-card {
          padding: 6px;
          border-radius: 6px;
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
          font-size: 0.75rem;
          overflow: hidden;
          transition: transform 0.2s;
        }
        .event-card:hover {
            transform: scale(1.02);
            z-index: 10;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .event-card.TP {
            background: #ecfdf5;
            border-left-color: #10b981;
        }
        .event-card.TD {
            background: #fffbeb;
            border-left-color: #f59e0b;
        }
        .event-time {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
        }
        .event-title {
          font-weight: 700;
          color: #111827;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .event-details {
          display: flex;
          justify-content: space-between;
          color: #4b5563;
        }
      `}</style>
        </div>
    );
};

export default WeeklySchedule;
