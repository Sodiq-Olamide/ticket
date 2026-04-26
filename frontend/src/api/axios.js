import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
    baseURL: baseURL,
});

export const setupInterceptors = (authTokens, setAuthTokens, logoutUser) => {
    // Request Interceptor
    axiosInstance.interceptors.request.clear();
    axiosInstance.interceptors.request.use(async req => {
        if (authTokens) {
            req.headers.Authorization = `Bearer ${authTokens.access}`;
        }
        return req;
    });

    // Response Interceptor
    axiosInstance.interceptors.response.clear();
    axiosInstance.interceptors.response.use(
        response => response,
        async error => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry && authTokens) {
                originalRequest._retry = true;
                try {
                    const response = await axios.post(`${baseURL}/api/token/refresh/`, {
                        refresh: authTokens.refresh
                    });
                    setAuthTokens(response.data);
                    localStorage.setItem('authTokens', JSON.stringify(response.data));
                    originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    logoutUser();
                    return Promise.reject(refreshError);
                }
            }
            return Promise.reject(error);
        }
    );
};

export default axiosInstance;
