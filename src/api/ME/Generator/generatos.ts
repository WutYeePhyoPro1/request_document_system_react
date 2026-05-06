import axios from "axios";
import type { editDataResponse, FileItem, meGeneratorDataType } from "../../../utils/meDataUtil/metype";

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

export const getStoreGeneratorData = async (token:string | null , formData:FormData)=>{
  return API.post(`/me/generator/store` , formData , {
    headers: {
      Authorization: `Bearer ${token}` ,
      "Content-Type" : "multipart/form-data" ,
    },
  });
};
export const getUpdateGeneratorData = async (token:string | null , formData:FormData , id:string | undefined)=>{
  return API.post(`/me/generator/update/${id}` , formData , {
    headers: {
      Authorization: `Bearer ${token}` ,
      "Content-Type" : "multipart/form-data" ,
    },
  });
};
export const generatorDataDetail = async(token:string , id:string) : Promise<editDataResponse >=> {
  try {
    const response = await API.get(`/me/generator/edit/${id}` , {
      headers : {Authorization: `Bearer ${token}`} ,
    });
    // console.log("ResponseData>>" , response.data);
    return response.data;
  } catch (error) {
    console.error("meDataDetail error:", error);
    throw error;
  }
}
export const generatorFileDelete = async(token:string , id:string|number) : Promise<FileItem >=> {
  try {
    const response = await API.get(`/me/generator/deleteFile/${id}` , {
      headers : {Authorization: `Bearer ${token}`} ,
    });
    // console.log("ResponseData>>" , response.data);
    return response.data;
  } catch (error) {
    console.error("generator delete error:", error);
    throw error;
  }
}

export const generatorDelete = async (
  token: string,
  generalFormId: string | number,
  formId: string | number,
) => {
  const response = await API.get(
    `/me/generator/delete/${generalFormId}/${formId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
};
