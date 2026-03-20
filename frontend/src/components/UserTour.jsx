import React, { useState, useEffect } from "react";
import api from "../api/axios";
import "./UserTour.css";

const UserTour = ({ steps, onComplete, onSkip }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    if (!isVisible) return null;

    const step = steps[currentStep];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleFinish();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = async () => {
        setIsVisible(false);
        try {
            await api.post("accounts/complete-tour/");
            localStorage.setItem("is_first_login", "false");
        } catch (err) {
            console.error("Failed to skip tour:", err);
        }
        if (onSkip) onSkip();
    };

    const handleFinish = async () => {
        setIsVisible(false);
        try {
            await api.post("accounts/complete-tour/");
            localStorage.setItem("is_first_login", "false");
        } catch (err) {
            console.error("Failed to complete tour:", err);
        }
        if (onComplete) onComplete();
    };

    return (
        <div className="tour-overlay">
            <div className="tour-card">
                <div className="tour-header">
                    <h3>{step.title}</h3>
                    <button className="tour-skip-btn" onClick={handleSkip}>Sauter la visite</button>
                </div>
                <div className="tour-content">
                    <p>{step.content}</p>
                </div>
                <div className="tour-footer">
                    <div className="tour-dots">
                        {steps.map((_, index) => (
                            <span
                                key={index}
                                className={`tour-dot ${index === currentStep ? "active" : ""}`}
                            ></span>
                        ))}
                    </div>
                    <div className="tour-nav">
                        {currentStep > 0 && (
                            <button className="tour-prev-btn" onClick={handlePrev}>Précédent</button>
                        )}
                        <button className="tour-next-btn" onClick={handleNext}>
                            {currentStep === steps.length - 1 ? "Terminer" : "Suivant"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserTour;
