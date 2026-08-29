import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000", withCredentials: true });

export async function createResumeAtsScan(file, displayName = "") {
    const formData = new FormData();
    formData.append("resume", file);
    if (displayName.trim()) formData.append("displayName", displayName.trim());
    const response = await api.post("/api/resume-ats/scans", formData);
    return response.data;
}

export async function getResumeAtsScans({ cursor } = {}) {
    const response = await api.get("/api/resume-ats/scans", { params: cursor ? { cursor } : {} });
    return response.data;
}

export async function getResumeAtsScan(scanId) {
    const response = await api.get(`/api/resume-ats/scans/${scanId}`);
    return response.data;
}

export async function compareResumeAtsScans(scanId, otherScanId) {
    const response = await api.get(`/api/resume-ats/scans/${scanId}/compare/${otherScanId}`);
    return response.data;
}

export async function deleteResumeAtsScan(scanId) {
    const response = await api.delete(`/api/resume-ats/scans/${scanId}`);
    return response.data;
}
