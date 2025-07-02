import { store } from "@/utils";
import axios from "axios";

export const baseUrl = process.env.EXPO_PUBLIC_BE_URL;
const apiClient = axios.create({
    baseURL: baseUrl,
});

apiClient.interceptors.request.use(async (config) => {
    const authToken = await store.get("token");
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
});

export default apiClient;