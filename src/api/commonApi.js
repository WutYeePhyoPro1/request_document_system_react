import axios from "axios";
const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

 export const  getFormsList = async(token)  => {
    try{
        
        const response = await API.get("/home" , {
            headers : {Authorization: `Bearer ${token}`} ,
        });
        return response ;
    }catch(error) {
        console.error("Error fetching get forms" , error) ;
        throw error ;
    }
}

export const countFormNoti = async(token , form_id) => {
try {
    const response = await API.get(`/count_notis/${form_id}` , {
        headers: {Authorization: `Bearer ${token}`} ,
    });
    return response.data.count ;
} catch (error) {
    console.error("Error fetch get noti" , error) ;
}
}
