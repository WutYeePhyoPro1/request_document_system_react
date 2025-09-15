export interface proCategories {
id:number ,
name:String
}
export interface roles {
id:number ,
name: String ,
}
export interface saleStaffs {
employeecode:String ,
employeename: String ,
brchcode:String ,

}
export interface requestDiscountCreateResponse {
proCategories : proCategories[] ,
roles: roles[],
saleStaffs : saleStaffs[],
}

export interface searchInvoiceNumber {
barnch_name:String,
custcode:String,
custname:String,
docuno:String,
main_category:String,
barcode:String,
barcode_name:String,
saleqty:number | String ,
selling_price: BigInteger | number | String ,
discountamnt: BigInteger | number | String ,
netamount: BigInteger | number | String ,
discountpercentage: number | String ,

}
export interface FormValues {
sale_staff?: string;
customer_name?: string;
customer_code?: string;
sale_invoice?: string;
remark?: string;
discount_type?: string[];
file?: File[];
product_category?:string[];
product_code?:string[];
product_name?:string[];
selprice?:(number | bigint) [] ;
saleqty?:number[];
discountamnt?:(number | bigint) [];
netamount?:(number | bigint) [];
request_discount?:(number | bigint) [];

}

export interface InvoiceFile { id: string; file: File | null };
