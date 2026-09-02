import axios from "axios";
import { apiBaseUrl } from "../../../shared/lib/api-base-url";

const api = axios.create({
    baseURL: apiBaseUrl,
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
