import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api',
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
                await axios.post('http://localhost:3000/api/auth/refresh/', {}, { withCredentials: true });

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
