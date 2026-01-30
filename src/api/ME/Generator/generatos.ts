import axios from "axios";
import type { meGeneratorDataType } from "../../../utils/meDataUtil/metype";

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

export const getStoreGeneratorData = async (token:string | null , formData:meGeneratorDataType)=>{
  return API.post(`/me/generator/store` , formData , {
    headers: {
      Authorization: `Bearer ${token}` ,
      "Content-Type" : "multipart/form-data" ,
    },
  });
};
export const getUpdateGeneratorData = async (token:string | null , formData:meGeneratorDataType , id:string)=>{
  return API.post(`/me/generator/update/${id}` , formData , {
    headers: {
      Authorization: `Bearer ${token}` ,
      "Content-Type" : "multipart/form-data" ,
    },
  });
};
export const generatorDataDetail = async(token:string , id:string) : Promise<meGeneratorDataType >=> {
  try {
    const response = await API.get(`/me/generator/edit/${id}` , {
      headers : {Authorization: `Bearer ${token}`} ,
    });
    // console.log("ResponseData>>" , response.data);
    return response.data;
  } catch (error) {
    console.error("meDataDetail error:", error);
    return null;
  }
}
export const generatorFileDelete = async(token:string , id:string) : Promise<meGeneratorDataType >=> {
  try {
    const response = await API.get(`/me/generator/deleteFile/${id}` , {
      headers : {Authorization: `Bearer ${token}`} ,
    });
    // console.log("ResponseData>>" , response.data);
    return response.data;
  } catch (error) {
    console.error("generator delete error:", error);
    return null;
  }
}