export interface requestDiscountFetchData {
    url?:string ,
    token?:string ,
    baseURL?: string ,
    withCredentials?:boolean ,
    params?:Record<string , any > ;

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
    created_at ?:string | Date ,
    updated_at ?:string | Date ,
    remark ?: string ,
    reason ?: string ,
    osnb_doc_no ?: string ,


}

