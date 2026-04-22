export interface requestDiscountFetchData {
    url?:string ,
    token?:string ,
    baseURL?: string ,
    withCredentials?:boolean ,
    params?:Record<string , any > ;

}
export interface metaData {
  authenticatedUser?: any;
  branch?: any;
  user_branches?: any;
  noti_data?: any;
  authBranch?: any;
  createdUser?: any;
}
export interface indexData {
   
    id?:number ,
    form_doc_no ?: string ,
    form_branch ?: number ,
    form_department ?: number ,
    to_branch ?: number ,
    to_department ?: number ,
    user_id ?: number ,
    receiver_id ?: number ,
    form_id ?:number ,
    status ?: string ,
    date ?: string ,
    g_remark ?: string ,
    asset_type ?: string ,
    requester_name ?: string ,
    total_amount ?: number ,
    created_at ?:any ,
    updated_at ?:any ,
    remark ?: string ,
    reason ?: string ,
    osnb_doc_no ?: string ,
    specific_form_id?:number | string ,
    from_branches?:{
        branch_name?:string ,

    },
    originators?:{
        name?:string 
    }
    branch_name?:string ,
    branch_id?:number | string ,
    branches?:{
        branch_name?:string,
    }


}

export interface fetchAPi {
    token:string ;
    id:number ;
}

export interface ApproveFormData{
    
    bm_discount?:number[];
    product_id?:number[] ;
    status?: string ;
    comment?:string;
   

}
