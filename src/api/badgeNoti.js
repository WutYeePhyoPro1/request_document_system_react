import axios from "axios";

const API = axios.create({
    baseURL: "/api" ,
    withCredentials: true ,
})

export const badgeNoti = async(token) => {
    try{
        const response = await API.get("/badgeNoti" , {
            headers: {Authorization: `Bearer ${token}`} ,
        });
        return response.data ;
    }catch(error) {
        console.log("Error a badgeError>>" , error) ;
        throw error ;
    }
}