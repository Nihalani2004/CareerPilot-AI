import axios from 'axios';
const api = axios.create({
    baseURL : import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    withCredentials: true
})

export function getOAuthSignInUrl(provider) {
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
    return `${baseUrl}/api/auth/oauth/${provider}`;
}


export async function register({username,email,password}){

    try{
        const response = await api.post('/api/auth/register', {
        username,email,password
    })

    return response.data
}catch(err){
    console.log(err);
}
}


export async function login({email,password}){
    const response = await api.post("/api/auth/login", {
        email, password
    });

    return response.data;
}


export async function logout(){
    try{
        const response = await api.post("/api/auth/logout")
        return response.data
    }catch(err){
        console.log(err);
    }
}

export async function getMe() {
    try{
        const response = await api.get("/api/auth/get-me")

        return response.data
    }catch(err){
        if (err.response?.status !== 401) {
            console.error(err);
        }
        return null;
    }
}
