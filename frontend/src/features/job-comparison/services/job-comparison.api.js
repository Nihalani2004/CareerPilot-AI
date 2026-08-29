import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    withCredentials: true,
});

export async function createJobComparison(payload) {
    const response = await api.post("/api/job-comparisons", payload);
    return response.data;
}

export async function getJobComparisons({ cursor, search } = {}) {
    const response = await api.get("/api/job-comparisons", { params: { ...(cursor ? { cursor } : {}), ...(search ? { search } : {}) } });
    return response.data;
}

export async function getJobComparison(comparisonId) {
    const response = await api.get(`/api/job-comparisons/${comparisonId}`);
    return response.data;
}

export async function refreshJobComparison(comparisonId) {
    const response = await api.post(`/api/job-comparisons/${comparisonId}/analyze`);
    return response.data;
}

export async function addJobDescription(comparisonId, payload) {
    const response = await api.post(`/api/job-comparisons/${comparisonId}/job-descriptions`, payload);
    return response.data;
}

export async function deleteJobDescription(comparisonId, descriptionId) {
    const response = await api.delete(`/api/job-comparisons/${comparisonId}/job-descriptions/${descriptionId}`);
    return response.data;
}
