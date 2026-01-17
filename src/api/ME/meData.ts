import axios from "axios";

const API = axios.create({
    baseURL: "/api" ,
    withCredentials: true ,
})

export const getCheckItems = async(token:string) => {
    try {
      const response = await API.get('/me' , {
        headers: {Authorization: `Bearer ${token}`} ,
      }) ;
      return response.data.checkItems ;
    } catch (error) {
        console.error("Error fetching check item data:" , error) ;
        throw error ;
    }
}