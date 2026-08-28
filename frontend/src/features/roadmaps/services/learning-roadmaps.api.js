import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
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
