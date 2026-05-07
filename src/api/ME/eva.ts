import axios from "axios";
import type { EvaEditResponse, FileItem, meGeneratorDataType } from "../../utils/meDataUtil/metype";

const API = axios.create({
    baseURL: "/api" ,
    withCredentials: true ,
})
export const generalEvaData = async (token: string) => {
  try {
    const response = await API.get('/me/eva/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching general transformer data:", error);
    throw error;
  }
} 

export const getStoreEvaData = async (token: string | null, formData: FormData) => {
  try {
    return API.post(`/me/eva/store`, formData, {
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

export const evaDetailData = async (token: string, id: string | number): Promise<meGeneratorDataType> => {
  try {
    const response = await API.get(`/me/eva/detail/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("REsponse eva:", response.data);
    return response.data;
  } catch (error) {
    console.error("transformerDetail error:", error);
    throw error;
  }
}
export const evaEditData = async (token: string, id: string): Promise<EvaEditResponse> => {
  try {
    const response = await API.get(`/me/eva/edit/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("meDataDetail error:", error);
    throw error;
  }
};
export const getUpdateEvaData = async (
  token: string | null,
  formData: FormData,
  id: string | number | undefined
) => {
  return API.post(`me/eva/update/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

export const searchEvaData = async (
  token: string,
  params: {
    form_doc_no?: string;
    from_date?: string | null;
    to_date?: string | null;
    status?: string[];
  }
) => {
  try {
    const response = await API.get("me/eva/searchNotification", {
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

export const evaDelete = async (
  token: string,
  generalFormId: string | number,
  formId: string | number,
) => {
  const response = await API.get(
    `/me/eva/delete/${generalFormId}/${formId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
}; 

export const evaFileDelete = async (token: string, id: string | number | undefined): Promise<FileItem> => {
  try {
    const response = await API.get(`/me/eva/deleteFile/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // console.log("ResponseData>>" , response.data);
    return response.data;
  } catch (error) {
    console.error("generator delete error:", error);
    throw error;
  }
}