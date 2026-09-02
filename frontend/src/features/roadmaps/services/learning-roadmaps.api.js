import axios from "axios";
import { apiBaseUrl } from "../../../shared/lib/api-base-url";

const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true,
});

export async function createLearningRoadmap(payload) {
    const response = await api.post("/api/learning-roadmaps", payload);
    return response.data;
}

export async function getLearningRoadmaps({ cursor, status, search } = {}) {
    const response = await api.get("/api/learning-roadmaps", {
        params: { ...(cursor ? { cursor } : {}), ...(status ? { status } : {}), ...(search ? { search } : {}) },
    });
    return response.data;
}

export async function getLearningRoadmap(roadmapId) {
    const response = await api.get(`/api/learning-roadmaps/${roadmapId}`);
    return response.data;
}

export async function updateLearningRoadmap(roadmapId, payload) {
    const response = await api.patch(`/api/learning-roadmaps/${roadmapId}`, payload);
    return response.data;
}

export async function updateLearningTask(roadmapId, taskId, payload) {
    const response = await api.patch(`/api/learning-roadmaps/${roadmapId}/tasks/${taskId}`, payload);
    return response.data;
}
