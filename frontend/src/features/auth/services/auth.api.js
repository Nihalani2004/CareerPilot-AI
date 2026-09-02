import axios from 'axios';
import { apiBaseUrl } from '../../../shared/lib/api-base-url';
const api = axios.create({
    baseURL : apiBaseUrl,
    withCredentials: true
})

export function getOAuthSignInUrl(provider) {
    const baseUrl = apiBaseUrl.replace(/\/$/, "");
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
