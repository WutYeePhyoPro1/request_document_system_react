export interface meGeneratorDataType {

    id?:number ,
    general_form_id ?: number ,
    generator_date ?: string | undefined ,
    generator_time_ampm?: string ,
    generator_size?: string ,
    generator_use?:string ,
    cost: number | string ,
    generator_time ?: string ,
    engine_oil_level ?: number ,
    fuel_level ?: number ,
    coolant_level ?: number ,
    battery_volt_level ?: number ,
    l1_level ?: number ,
    l2_level ?:number ,
    l3_level ?: number ,
    total_kw_level ?: number ,
    voltagel_l_level?: number ,
    gen_kva_level?:number,
    running_hour?:number,
    generator_service_date?:string,
    generator_cleaning_level?:number ,
    remark?:string ,
    status?: string ,
  generator_id: number;
  file_name: string;
  file_url: string;
  name?: string ;
    generalForm?: {
    id?: number;
    form_doc_no?: string;
    asset_type?: string;
    form_branch?: number;
    form_department?: number;
    to_branch?: number;
    to_department?: number;
    user_id?: number;
    receiver_id?: number;
    form_id?: number;
    date?: string;
    g_remark?: string;
    requester_name?: string;
    total_amount?: number | null;
    created_at?: string | null;
    updated_at?: string | Date;
    reason?: string | number;
    osnb_doc_no?: string | null;
    remark?: string ;
    status?: string ;
    originators?:{
        name?:string ;
        departments?:{
            name?:string ;
        }
    }
  };
  subForm?:{
    id?:number | string ;
    general_form_id?:number | string ;
    sub_form_id ? : number | string ;
  };
  getChecker?:{
    assigned_user ? : {
        title?: string ,
        name?: string ,
        department?:{
            name?: string
        }
    }
    created_at?:string ;
    comment?:string ;
  }
  getApprover?:{
    created_at?:string ;
    comment?:string ;
    approval_users?:{
        title?: string ;
        name?: string ;
        department?:{
            name?: string ;
        }
        
    }
  }
  form?:{
    created_at?: string
  }
  sendManagerAssettype?:{

  }
  checker ? :{

  }
  approver?:{
    
  }
    
    form_rejected?: {
        can_cel_u_ser?:{
            name?: string ,
        }
    }

detailData?:{

} ;

files?:{

} ,
authUserId?:{

}


}

export interface FileItem  {
  id?: number | string ,
   generator_id?: number,
   transformer_id?:number,

  file?: File | null,
  preview?: string | null,
  type?: "image" | "pdf" | "other" | null,
  name?: string | any,
  file_name?: string,
  file_url?: string | any,
  files?:{

  }
};



export interface TableDetailProps {
  detailData?: meGeneratorDataType; // make optional
  onRefresh: () => void;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface meTransDataType {
   id?:number ,
    trans_date ?: string ,
    trans_time?:string ,
    transformer_time_ampm?: string ,
    meter_unit?:number | string | float ,
    tran_kva_level?:number ,
    voltagel_l_level?:number ,
    tran_size?:string,
    l1_level ?: number ,
    l2_level ?:number ,
    l3_level ?: number ,
    oltc_tapping?:number ,
    trans_service_date?:string ,
    remark?:string,
    cost?:number ,
    total_kw_level ?: number ,
    trans_use?:string ,
    
}

export interface kvaData {
  id?:number | string ,
  kva?:string| number ,
}

export interface editDataResponse {
  editData: meGeneratorDataType; // Or just meTransDataType if it's a single object
  files: FileItem[] ;
  kvaData:kvaData ;
 
}


export interface TransformerEditResponse {
  editData: meTransDataType;
  files: FileItem[];
   kvaData:kvaData ;
}

