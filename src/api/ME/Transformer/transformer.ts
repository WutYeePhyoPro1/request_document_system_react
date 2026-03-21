import axios from "axios";
import type { meGeneratorDataType } from "../../../utils/meDataUtil/metype";

const API = axios.create({
    baseURL: '/api' ,
    withCredentials: true ,
})

export const generalTransformerData = async(token:string) => {
    try {
        const response = await API.get('/me/transformer/' , {
            headers: {Authorization: `Bearer ${token}`} ,
        });
        return response.data ;
    } catch (error) {
        console.error("Error fetching general transformer data:" , error) ;
        throw error ;
    }
}

export const getStoreTransformerData = async(token:string , formData:meGeneratorDataType , id:string) => {
    try {
        return API.post(`/me/transformer/store` , formData , {
            headers: {
                Authorization: `Bearer ${token}` ,
                "Content-Type" : "multipart/form-data" ,
            } ,
        });
    } catch (error) {
        console.log("Error at store transformer data:" , error);
        throw error ;
    }
} 

export const transformerDetailData = async(token:string , id:string | number) : Promise<meGeneratorDataType> => {
    try {
        const response = await API.get(`/me/transformer/detail/${id}` , {
            headers: {Authorization: `Bearer ${token}`},
        });
        console.log("REsponse Transformr:" , response.data) ;
        return response.data ;
    } catch (error) {
        console.error("transformerDetail error:" , error);
        throw error ;
    }
}