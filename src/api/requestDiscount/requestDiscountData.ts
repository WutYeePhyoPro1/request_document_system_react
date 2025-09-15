
import type { requestDiscountFetchData } from "../../utils/requestDiscountUtil";
import axios from "axios";
import type { requestDiscountCreateResponse, searchInvoiceNumber } from "../../utils/requestDiscountUtil/create";

const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
});


export const getRequestDiscountData = async(token:string): Promise<requestDiscountFetchData[] > => {
    try{
        const response = await API.get('/request_discount' , {
            headers: {Authorization: `Bearer ${token}`} ,
        });
        //  console.log("ApiData>>" , response.data , response.data.data.length);
        return response.data.data ?? [];
    } catch (error) {
    console.error("Error fetching request discount index data:", error);
    throw error;
  }
};

export const getCreateData = async(token:string): Promise<requestDiscountCreateResponse[] > => {
  try{
   const response = await API.get<requestDiscountCreateResponse>('/request_discount/create' , {
      headers: {Authorization: `Bearer ${token}`} ,
    });
    // console.log("apiCreateData>>" , response.data);
    return response.data ?? [];
  }catch(error){
    console.error("Error fetching request discount create data:" , error);
    throw error ;
  }
};


export const getStoreData = async (token: string | null, data: FormData) => {
  return API.post(`/request_discount/store`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};



export const searchInvoiceData = async (
  token: string,
  invoice_number: string
): Promise<searchInvoiceNumber> => {
  try {
    const response = await API.get(
      `/request_discount/search_sale_invoice/${invoice_number}`, 
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("Search Invoice>>", response.data.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching request discount search invoice data:", error);
    throw error;
  }
};
