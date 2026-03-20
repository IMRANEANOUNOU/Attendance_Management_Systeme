import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../CSS/Sidebar.css';

const SideBar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [openSubMenu, setOpenSubMenu] = useState(null); // 'gestion' | 'structure' | 'pedagogique' | null
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    setOpenSubMenu(null);
  };

  const toggleSubMenu = (key) => {
    setOpenSubMenu((prev) => {
      const next = prev === key ? null : key;
      if (next && !isOpen) setIsOpen(true);
      return next;
    });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav id="sidebar" className={isOpen ? '' : 'close'}>
      <ul>
        {/* LOGO + TOGGLE */}
        <li>
          <span className="logo">ESTE Portal</span>
          <button
            type="button"
            onClick={toggleSidebar}
            id="toggle-btn"
            className={!isOpen ? 'rotate' : ''}
            aria-label="Toggle sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="m313-480 155 156q11 11 11.5 27.5T468-268q-11 11-28 11t-28-11L228-452q-6-6-8.5-13t-2.5-15q0-8 2.5-15t8.5-13l184-184q11-11 27.5-11.5T468-692q11 11 11 28t-11 28L313-480Zm264 0 155 156q11 11 11.5 27.5T732-268q-11 11-28 11t-28-11L492-452q-6-6-8.5-13t-2.5-15q0-8 2.5-15t8.5-13l184-184q11-11 27.5-11.5T732-692q11 11 11 28t-11 28L577-480Z" />
            </svg>
          </button>
        </li>

        {/* Dashboard */}
        <li className={isActive('/admin/dashboard') ? 'active' : ''}>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/dashboard'); }} role="button">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M520-640v-160q0-17 11.5-28.5T560-840h240q17 0 28.5 11.5T840-800v160q0 17-11.5 28.5T800-600H560q-17 0-28.5-11.5T520-640ZM120-480v-320q0-17 11.5-28.5T160-840h240q17 0 28.5 11.5T440-800v320q0 17-11.5 28.5T400-440H160q-17 0-28.5-11.5T120-480Zm400 320v-320q0-17 11.5-28.5T560-520h240q17 0 28.5 11.5T840-480v320q0 17-11.5 28.5T800-120H560q-17 0-28.5-11.5T520-160Zm-400 0v-160q0-17 11.5-28.5T160-360h240q17 0 28.5 11.5T440-320v160q0 17-11.5 28.5T400-120H160q-17 0-28.5-11.5T120-160Z" />
            </svg>
            <span>Dashboard</span>
          </a>
        </li>

        {/* Gestion Utilisateurs */}
        <li>
          <button
            type="button"
            onClick={() => toggleSubMenu('gestion')}
            className={`dropdown-btn ${openSubMenu === 'gestion' ? 'rotate' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm720 0v-120q0-44-24.5-84.5T666-434q51 6 96 20.5t84 35.5q36 20 55 44.5t19 53.5v120H760ZM247-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47Zm466 0q-47 47-113 47-11 0-28-2.5t-28-5.5q27-32 41.5-71t14.5-81q0-42-14.5-81T544-792q14-5 28-6.5t28-1.5q66 0 113 47t47 113q0 66-47 113ZM120-240h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q440-607 440-640t-23.5-56.5Q393-720 360-720t-56.5 23.5Q280-673 280-640t23.5 56.5Q327-560 360-560t56.5-23.5ZM360-240Zm0-400Z" /></svg>
            <span>Utilisateurs</span>
            <svg className="chevron" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M480-361q-8 0-15-2.5t-13-8.5L268-556q-11-11-11-28t11-28q11-11 28-11t28 11l156 156 156-156q11-11 28-11t28 11q11 11 11 28t-11 28L508-372q-6 6-13 8.5t-15 2.5Z" />
            </svg>
          </button>
          <ul className={`sub-menu ${openSubMenu === 'gestion' ? 'show' : ''}`}>
            <div>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/professeurs'); }} role="button">Liste Professeurs</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/etudiants'); }} role="button">Liste Étudiants</a></li>
            </div>
          </ul>
        </li>

        {/* Structure Académique */}
        <li>
          <button
            type="button"
            onClick={() => toggleSubMenu('structure')}
            className={`dropdown-btn ${openSubMenu === 'structure' ? 'rotate' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M240-200h120v-200q0-17 11.5-28.5T400-440h160q17 0 28.5 11.5T600-400v200h120v-360L480-740 240-560v360Zm-80 0v-360q0-19 8.5-36t23.5-28l240-180q21-16 48-16t48 16l240 180q15 11 23.5 28t8.5 36v360q0 33-23.5 56.5T720-120H560q-17 0-28.5-11.5T520-160v-200h-80v200q0 17-11.5 28.5T400-120H240q-33 0-56.5-23.5T160-200Zm320-270Z" />
            </svg>
            <span>Académique</span>
            <svg className="chevron" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M480-361q-8 0-15-2.5t-13-8.5L268-556q-11-11-11-28t11-28q11-11 28-11t28 11l156 156 156-156q11-11 28-11t28 11q11 11 11 28t-11 28L508-372q-6 6-13 8.5t-15 2.5Z" />
            </svg>
          </button>
          <ul className={`sub-menu ${openSubMenu === 'structure' ? 'show' : ''}`}>
            <div>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/departements'); }} role="button">Départements</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/filieres'); }} role="button">Filières</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/groupes'); }} role="button">Groupes</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/salles'); }} role="button">Salles</a></li>
            </div>
          </ul>
        </li>

        {/* Gestion Pédagogique */}
        <li>
          <button
            type="button"
            onClick={() => toggleSubMenu('pedagogique')}
            className={`dropdown-btn ${openSubMenu === 'pedagogique' ? 'rotate' : ''}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-120 200-272v-240L40-600l440-240 440 240v320h-80v-276l-80 44v240L480-120Zm0-332 274-148-274-148-274 148 274 148Zm0 241 200-108v-151L480-360 280-470v151l200 108Zm0-241Zm0 90Zm0 0Z" /></svg>
            <span>Pédagogique</span>
            <svg className="chevron" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M480-361q-8 0-15-2.5t-13-8.5L268-556q-11-11-11-28t11-28q11-11 28-11t28 11l156 156 156-156q11-11 28-11t28 11q11 11 11 28t-11 28L508-372q-6 6-13 8.5t-15 2.5Z" />
            </svg>
          </button>
          <ul className={`sub-menu ${openSubMenu === 'pedagogique' ? 'show' : ''}`}>
            <div>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/modules'); }} role="button">Modules</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/semestres'); }} role="button">Semestres</a></li>
            </div>
          </ul>
        </li>

        {/* Emploi du Temps */}
        <li>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/emploi-du-temps'); }} role="button">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-40q0-17 11.5-28.5T280-880q17 0 28.5 11.5T320-840v40h320v-40q0-17 11.5-28.5T680-880q17 0 28.5 11.5T720-840v40h40q33 0 56.5 23.5T840-720v560q0 33-23.5 56.5T760-80H200Zm0-80h560v-400H200v400Zm0-480h560v-80H200v80Z" />
            </svg>
            <span>Emploi</span>
          </a>
        </li>

        {/* Paramètres */}
        <li>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/admin/parametres'); }} role="button">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor">
              <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
            </svg>
            <span>Paramètres</span>
          </a>
        </li>

        {/* Déconnexion */}
        <li className="logout-item">
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} role="button">
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#ff4d4d">
              <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h280v80H200Zm440-160-56-58 102-102H360v-80h326L584-622l56-58 200 200-200 200Z" />
            </svg>
            <span>Déconnexion</span>
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default SideBar;
