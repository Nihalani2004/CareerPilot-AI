import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    withCredentials: true,
});

export async function getAtsAnalysis(interviewReportId) {
    const response = await api.get(`/api/ats-analysis/${interviewReportId}`);
    return response.data;
}

export async function createAtsAnalysis(interviewReportId) {
    const response = await api.post(`/api/ats-analysis/${interviewReportId}`);
    return response.data;
}

export async function updateAtsSuggestion(analysisId, suggestionId, status) {
    const response = await api.patch(`/api/ats-analysis/${analysisId}/suggestions/${suggestionId}`, { status });
    return response.data;
}
