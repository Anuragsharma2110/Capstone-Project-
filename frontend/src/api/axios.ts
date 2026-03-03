import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true, // Important for cookies
});

// Add a response interceptor to handle token refreshing
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Attempt to refresh the token
                await axios.post(`${BASE_URL}/auth/refresh/`, {}, { withCredentials: true });

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, logout the user (handled in AuthContext ideally, but we can reject here)
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
