
import type { requestDiscountFetchData } from "../../utils/requestDiscountUtil";
import axios from "axios";
import type { InvoiceFile, requestDiscountCreateResponse, searchInvoiceNumber } from "../../utils/requestDiscountUtil/create";

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

export const getDetailData = async (
  token: string,
  id: number | any
): Promise<FormData[]> => {
  try {
    const response = await API.get<FormData[]>(`/request_discount/show/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data; 
  } catch (error) {
    console.error("Error fetching request discount Detail data:", error);
    throw error;
  }
};

export const getStoreData = async (token: string | null, formData: FormData) => {
  return API.post(`/request_discount/store`, formData, {
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

    console.log("Search Invoice>>", response.data);
    return response.data;
  } catch (error) {
    console.error("Error fetching request discount search invoice data:", error);
    throw error;
  }
};

export const reUploadFile = async (
  token:string , formData: InvoiceFile)  => {
    return API.post(`/request_discount/upload-request-discount`,formData , {
      headers: {
        Authorization: `Bearer ${token}` ,
        "Content-Type" : "multipart/form-data" ,
      }
    })
  }
