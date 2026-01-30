import axios from "axios";
import type { meGeneratorDataType } from "../../utils/meDataUtil/metype";

const API = axios.create({
    baseURL: "/api" ,
    withCredentials: true ,
})

export const getCheckItems = async(token:string) => {
    try {
      const response = await API.get('/meForm' , {
        headers: {Authorization: `Bearer ${token}`} ,
      }) ;
      return response.data.checkItems ;
    } catch (error) {
        console.error("Error fetching check item data:" , error) ;
        throw error ;
    }
}
export const searchMeData = async (
  token: string,
  params: {
    form_doc_no?: string;
    from_date?: string | null;
    to_date?: string | null;
    status?: string[];
  }
) => {
  try {
    const response = await API.get("meForm/searchNotification", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Search results >>", response.data);
    return response.data ?? [];
  } catch (error) {
    console.log("Error at search Generator", error);
    throw error;
  }
};

export const meDataDetail = async(token:string , id:string) : Promise<meGeneratorDataType >=> {
  try {
    const response = await API.get(`/meForm/detail/${id}` , {
      headers : {Authorization: `Bearer ${token}`} ,
    });
    // console.log("ResponseData>>" , response.data);
    return response.data;
  } catch (error) {
    console.error("meDataDetail error:", error);
    return null;
  }
}