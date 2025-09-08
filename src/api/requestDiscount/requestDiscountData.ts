
import type { requestDiscountFetchData } from "../../utils/requestDiscountUtil";
import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
});


export const getRequestDiscountData = async(token:string): Promise<requestDiscountFetchData[] > => {
    try{
        const response = await API.get('/request_discount' , {
            headers: {Authorization: `Bearer ${token}`} ,
        });
        // console.log("ApiData>>" , response.data , response.data.data.length);
        return response.data.data ?? [];
    } catch (error) {
    console.error("Error fetching PI data:", error);
    throw error;
  }
};
