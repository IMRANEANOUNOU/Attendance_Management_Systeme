# PFE - Attendance Management System (EST)



An advanced Attendance Management System built with **Django REST Framework** and **React (Vite)**. The core feature is its **AI-powered Face Recognition** module, allowing students to mark their presence automatically using their camera.

---

##  Key Features

###  User Roles & Dashboards
- **Students**: View weekly schedules, track attendance stats, and upload medical justifications for absences.
- **Professors**: Managed-role dashboards (Chef de Filière / Chef de Département) for:
  - **Absence Validation**: Review and approve student justifications.
  - **Timetable Management**: Create and modify weekly schedules in an interactive grid.
  - **Module Assignment**: Assign professors to specific courses.
- **Admins**: Full management of Filières, Departments, Groups, and User Accounts.

---

### AI Face Recognition
- **Real-time Detection**: Students mark attendance via a live camera scan.
- **Facial Matching**: Uses `dlib` and `face-recognition` libraries to verify the student's identity against their profile photo.

---

### Smart Scheduling
- **Weekly Grid View**: Specialized UI to manage complex university timetables.
- **Filtering**: Easily filter by Filière, Semester, or Group.

---

## Tech Stack

<p align="left">
  <img src="https://skillicons.dev/icons?i=python,django,react,vite,postgres,sqlite,opencv,css" />
</p>

- **Backend**: Python / Django / Django REST Framework  
- **Frontend**: React.js / Vite / Vanilla CSS  
- **AI/ML**: `dlib`, `face-recognition`, `OpenCV`  
- **Database**: SQLite (Development) / PostgreSQL (Production ready)  
- **Security**: JWT Authentication (JSON Web Tokens)
