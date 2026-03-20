import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
// Admin pages
import Dashboard from "./pages/ADMIN/Dashboard";
import GestionProf from "./pages/ADMIN/gestionProf";
import GestionEtudiant from "./pages/ADMIN/gestionEtudiant";
import GestionDepartement from "./pages/ADMIN/gestionDepartement";
import GestionFiliere from "./pages/ADMIN/gestionFiliere";
import GestionGroupes from "./pages/ADMIN/gestionGroupes";
import GestionSalles from "./pages/ADMIN/gestionSalles";
import GestionModules from "./pages/ADMIN/gestionModules";
import GestionSemestre from "./pages/ADMIN/gestionSemestre";
import GestionEmplois from "./pages/ADMIN/gestionEmplois";
import Parametres from "./pages/ADMIN/Parametres";
// Professor pages
import ProfDashboard from "./pages/PROF/ProfDashboard";
import FaireAppel from "./pages/PROF/FaireAppel";
import MonEmploi from "./pages/PROF/MonEmploi";
import ChangerMotDePasse from "./pages/PROF/ChangerMotDePasse";
import ValidationJustifications from "./pages/PROF/ValidationJustifications";
import SuiviPedagogique from "./pages/PROF/SuiviPedagogique";
import GestionEmploi from "./pages/PROF/GestionEmploi";
import AffectationModules from "./pages/PROF/AffectationModules";
import StatsFiliere from "./pages/PROF/StatsFiliere";
import GestionEquipe from "./pages/PROF/GestionEquipe";
import DepartementStats from "./pages/PROF/DepartementStats";
import MesEtudiants from "./pages/PROF/MesEtudiants";
// Etudiant pages
import StudentDashboard from "./pages/ETUDIANT/StudentDashboard";
import ScanPresence from "./pages/ETUDIANT/ScanPresence";
import EmploiEtudiant from "./pages/ETUDIANT/EmploiEtudiant";
import MesAbsences from "./pages/ETUDIANT/MesAbsences";
import MesSeances from "./pages/ETUDIANT/MesSeances";
import MonProfil from "./pages/ETUDIANT/MonProfil";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

        {/* Professeur */}
        <Route
          path="/prof/dashboard"
          element={
            <ProtectedRoute>
              <ProfDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prof/faire-appel"
          element={
            <ProtectedRoute>
              <FaireAppel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prof/mon-emploi"
          element={
            <ProtectedRoute>
              <MonEmploi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prof/mot-de-passe"
          element={
            <ProtectedRoute>
              <ChangerMotDePasse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prof/validation-justifications"
          element={
            <ProtectedRoute>
              <ValidationJustifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prof/suivi-pedagogique"
          element={
            <ProtectedRoute>
              <SuiviPedagogique />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prof/gestion-emploi"
          element={
            <ProtectedRoute>
              <GestionEmploi />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prof/affectation-modules"
          element={
            <ProtectedRoute>
              <AffectationModules />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prof/stats-filiere"
          element={
            <ProtectedRoute>
              <StatsFiliere />
            </ProtectedRoute>
          }
        />


        <Route
          path="/prof/gestion-equipe"
          element={
            <ProtectedRoute>
              <GestionEquipe />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prof/departement-stats"
          element={
            <ProtectedRoute>
              <DepartementStats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/prof/mes-etudiants"
          element={
            <ProtectedRoute>
              <MesEtudiants />
            </ProtectedRoute>
          }
        />

        {/* Etudiant */}
        <Route
          path="/etudiant/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/etudiant/scan/:seanceId"
          element={
            <ProtectedRoute>
              <ScanPresence />
            </ProtectedRoute>
          }
        />
        <Route
          path="/etudiant/emploi"
          element={
            <ProtectedRoute>
              <EmploiEtudiant />
            </ProtectedRoute>
          }
        />
        <Route
          path="/etudiant/mes-absences"
          element={
            <ProtectedRoute>
              <MesAbsences />
            </ProtectedRoute>
          }
        />
        <Route
          path="/etudiant/mes-seances"
          element={
            <ProtectedRoute>
              <MesSeances />
            </ProtectedRoute>
          }
        />
        <Route
          path="/etudiant/profil"
          element={
            <ProtectedRoute>
              <MonProfil />
            </ProtectedRoute>
          }
        />
        <Route path="/etudiant/*" element={<Navigate to="/etudiant/dashboard" replace />} />
        {/* Admin */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/professeurs"
          element={
            <ProtectedRoute>
              <GestionProf />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/etudiants"
          element={
            <ProtectedRoute>
              <GestionEtudiant />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/departements"
          element={
            <ProtectedRoute>
              <GestionDepartement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/filieres"
          element={
            <ProtectedRoute>
              <GestionFiliere />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/groupes"
          element={
            <ProtectedRoute>
              <GestionGroupes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/salles"
          element={
            <ProtectedRoute>
              <GestionSalles />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/modules"
          element={
            <ProtectedRoute>
              <GestionModules />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/semestres"
          element={
            <ProtectedRoute>
              <GestionSemestre />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/emploi-du-temps"
          element={
            <ProtectedRoute>
              <GestionEmplois />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/parametres"
          element={
            <ProtectedRoute>
              <Parametres />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/prof/*" element={<Navigate to="/prof/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;