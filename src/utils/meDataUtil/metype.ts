export interface meGeneratorDataType {

    id?:number ,
    general_form_id ?: number ,
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
    generator_date ?: string ,
    generator_time_ampm?: string ,
    generator_size?: string ,
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
  id?: number | string ;
   generator_id?: number;

  file?: File | null;
  preview?: string | null;
  type?: "image" | "pdf" | "other" | null;
  name?: string | null;

  file_name?: string;
  file_url?: string;
};