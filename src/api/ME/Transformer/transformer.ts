import axios from "axios";
import type { editDataResponse, FileItem, meGeneratorDataType, meTransDataType, TransformerEditResponse } from "../../../utils/meDataUtil/metype";

const API = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

export const generalTransformerData = async (token: string) => {
  try {
    const response = await API.get('/me/transformer/', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching general transformer data:", error);
    throw error;
  }
}

export const getStoreTransformerData = async (token: string | null, formData: FormData) => {
  try {
    return API.post(`/me/transformer/store`, formData, {
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

export const transformerDetailData = async (token: string, id: string | number): Promise<meGeneratorDataType> => {
  try {
    const response = await API.get(`/me/transformer/detail/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("REsponse Transformr:", response.data);
    return response.data;
  } catch (error) {
    console.error("transformerDetail error:", error);
    throw error;
  }
}

export const searchTransformerData = async (
  token: string,
  params: {
    form_doc_no?: string;
    from_date?: string | null;
    to_date?: string | null;
    status?: string[];
  }
) => {
  try {
    const response = await API.get("me/transformer/searchNotification", {
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

export const transformerDelete = async (
  token: string,
  generalFormId: string | number,
  formId: string | number,
) => {
  const response = await API.get(
    `/me/transformer/delete/${generalFormId}/${formId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  return response.data;
};
// Define the shape of the API response


export const transformerEditData = async (token: string, id: string): Promise<TransformerEditResponse> => {
  try {
    const response = await API.get(`/me/transformer/edit/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("meDataDetail error:", error);
    throw error;
  }
};

export const transformerFileDelete = async (token: string, id: string | number | undefined): Promise<FileItem> => {
  try {
    const response = await API.get(`/me/transformer/deleteFile/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // console.log("ResponseData>>" , response.data);
    return response.data;
  } catch (error) {
    console.error("generator delete error:", error);
    throw error;
  }
}

// export const getUpdateTransformerData = async (token:string|null , formData:meTransDataType , id:string) => {
//   return API.post(`me/transformer/update/${id}` , formData , {
//     headers: {
//       Authorization: `Bearer ${token}` ,
//       "Content-Type" : "multipart/form-data" ,
//     },
//   });
// };
export const getUpdateTransformerData = async (
  token: string | null,
  formData: FormData,
  id: string | number | undefined
) => {
  return API.post(`me/transformer/update/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};
