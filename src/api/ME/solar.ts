import axios from "axios";

const API = axios.create({
    baseURL: "/api" ,
    withCredentials: true ,
})
export const generalSolarData = async (token: string) => {
  try {
    const response = await API.get('/me/solar/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching general transformer data:", error);
    throw error;
  }
}