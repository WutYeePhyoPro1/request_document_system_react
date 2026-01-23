import axios from "axios";

const API = axios.create({
    baseURL: "/api" ,
    withCredentials: true ,
})

export const generalGeneratorData = async(token:string) => {
    try {
      const response = await API.get('/me/generator/' , {
        headers: {Authorization: `Bearer ${token}`} ,
      }) ;
      return response.data ;
    } catch (error) {
        console.error("Error fetching check item data:" , error) ;
        throw error ;
    }
}