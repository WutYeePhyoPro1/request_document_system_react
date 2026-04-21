import axios from "axios";
import type { FileItem, meGeneratorDataType, SolarEditResponse } from "../../utils/meDataUtil/metype";

const API = axios.create({
    baseURL: "/api" ,
    withCredentials: true ,
})
export const generalSolarData = async (token: string) => {
  try {
    const response = await API.get('/me/solar/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching general transformer data:", error);
    throw error;
  }
} 

export const getStoreSolarData = async (token: string | null, formData: FormData) => {
  try {
    return API.post(`/me/solar/store`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
  } catch (error) {
    console.log("Error at store transformer data:", error);
    throw error;
  }
} 

export const solarDetailData = async (token: string, id: string | number): Promise<meGeneratorDataType> => {
  try {
    const response = await API.get(`/me/solar/detail/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("REsponse solar:", response.data);
    return response.data;
  } catch (error) {
    console.error("transformerDetail error:", error);
    throw error;
  }
}
export const solarEditData = async (token: string, id: string): Promise<SolarEditResponse> => {
  try {
    const response = await API.get(`/me/solar/edit/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("meDataDetail error:", error);
    throw error;
  }
};
export const getUpdateSolarData = async (
  token: string | null,
  formData: FormData,
  id: string | number | undefined
) => {
  return API.post(`me/solar/update/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const searchSolarData = async (
  token: string,
  params: {
    form_doc_no?: string;
    from_date?: string | null;
    to_date?: string | null;
    status?: string[];
  }
) => {
  try {
    const response = await API.get("me/solar/searchNotification", {
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

export const solarDelete = async (
  token: string,
  generalFormId: string | number,
  formId: string | number,
) => {
  const response = await API.get(
    `/me/solar/delete/${generalFormId}/${formId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}; 

export const solarFileDelete = async (token: string, id: string | number | undefined): Promise<FileItem> => {
  try {
    const response = await API.get(`/me/solar/deleteFile/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // console.log("ResponseData>>" , response.data);
    return response.data;
  } catch (error) {
    console.error("generator delete error:", error);
    throw error;
  }
}