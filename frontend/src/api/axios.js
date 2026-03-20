import axios from "axios";


const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/", 
  timeout: 10000, 
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },      
  (error) => {
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401) {
      console.warn("Session expirée ou Token invalide. Déconnexion...");

      localStorage.clear();

      if (window.location.pathname !== "/login") {
          window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;