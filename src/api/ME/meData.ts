import axios from "axios";
import type { kvaData, meGeneratorDataType } from "../../utils/meDataUtil/metype";

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

export const meDataDetail = async(token:string , id:string | number) : Promise<meGeneratorDataType >=> {
  try {
    const response = await API.get(`/meForm/detail/${id}` , {
      headers : {Authorization: `Bearer ${token}`} ,
    });
    // console.log("ResponseData>>" , response.data);
    return response.data;
  } catch (error) {
    console.error("meDataDetail error:", error);
    throw error ;
  }
}



export const getCommonData = async (token: string) => {
  try {
    const response = await API.get('/meForm/commonData', {
      headers: { Authorization: `Bearer ${token}` },
    });
// console.log("Response>>" , response.data) ;
    return response?.data?.data;
  } catch (error) {
    console.error("meDataDetail error:", error);
    throw error;
  }
};

// export const meApproveForm = async(token:string | formData:meGeneratorDataType | general_form_id:string | sub_form_id:string) => {
//   return API.post(`/meForm/approve/${general_form_id}/${sub_form_id}` , formData , {
//     headers:{
//       Authorization: `Bearer ${token}` 
//     }
//   });
// }

type ApproveFormData = {
  status: string;
  comment: string;
} & Partial<meGeneratorDataType>; 
export const approveFormME = async (
  token: string,
  formData: ApproveFormData,
  form_id:string | number ,
  general_form_id: string | number,
  sub_form_id: string | number
) => {
  return API.post(
    `/meForm/approve/${form_id}/${general_form_id}/${sub_form_id}`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
