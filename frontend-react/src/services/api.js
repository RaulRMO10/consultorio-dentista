import axios from 'axios';

// Configure the base URL for the FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor: Attach JWT token if it exists
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: Handle global errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // The request was made and the server responded with a status code
            // outside the range of 2xx
            if (error.response.status === 401) {
                // Token expired or invalid
                console.warn('Unauthorized access. Logging out...');
                localStorage.removeItem('token');
                // Redirect to login (assuming a client-side routing strategy is in place)
                window.location.href = '/';
            }
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Network error - FastAPI server might be down:', error.request);
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error in request setup:', error.message);
        }
        return Promise.reject(error);
    }
);

export default api;
