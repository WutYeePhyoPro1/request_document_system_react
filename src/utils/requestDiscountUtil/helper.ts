// export function dateFormat(dateString:string | undefined | null , withTime:boolean = false):string {
// if(!dateString) return "" ;
// const date = new Date(dateString) ;
// if(withTime) {
//     return date.toLocaleDateString("en-GB" , {
//         year: 'numeric' ,
//         month:'2-digit',
//         day:'2-digit',
//         hour:'2-digit',
//         minute:'2-digit',
//         hour12:false,
//     });
// }
// return date.toLocaleDateString("en-GB" , {
//     year: 'numeric',
//     month: '2-digit',
//     day:'2-digit',
// });
// }
export function dateFormat(
  dateString: string | undefined | null,
  withTime: boolean = false
): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  if (withTime) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }

  return `${day}-${month}-${year}`;
}
// export function dateTimeFormat(dateString:string | undefined | null , withTime:boolean = false):string {
// if(!dateString) return "" ;
// const date = new Date(dateString) ;
// if(withTime) {
//     return date.toLocaleDateString("en-GB" , {
//         year: 'numeric' ,
//         month:'2-digit',
//         day:'2-digit',
//         hour:'2-digit',
//         minute:'2-digit',
//         second: '2-digit' ,
//         hour12:false,
//     });
// }
// return date.toLocaleDateString("en-GB" , {
//     year: 'numeric',
//     month: '2-digit',
//     day:'2-digit',
//     hour: '2-digit' ,
//     minute: '2-digit' ,
//     second:'2-digit',
// });
// } 
export function dateTimeFormat(
  dateString: string | undefined | null
): string {
  if (!dateString) return "";

  const date = new Date(dateString);

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${day}-${month}-${year}, ${hours}:${minutes}:${seconds}`;
}


export const getFormDocNo = (detailData:any):string => {
    return detailData?.form?.form_doc_no ?? "" ;
}
export const fallbackCopy = (
    text:string ,
    onSuccess?: () => void ,
    onError?: (err: any) => void
): void => {
    const textArea = document.createElement("textarea") ;
    textArea.value = text ;
    textArea.style.position = "fixed" ;
    textArea.style.top = "0" ;
    textArea.style.left = "0" ;
    document.body.appendChild(textArea) ;
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand("copy") ;
        if(successful) {
            console.log("Fallback: Copying text was successful") ;
            onSuccess?.() ;
        }else{
            console.log("Fallback: Copying text was unsuccessful");
        }
    } catch (error) {
        console.error("Fallback:unable copy" , error);
        onError?.(error);
    }
    document.body.removeChild(textArea) ;
};

export const handleCopy = async (
    text: string ,
    onSuccess?: () => void ,
    onError?:(err:any) => void
): Promise<void> => {
    if(navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            onSuccess?.() ;
        } catch (error) {
            console.error("Clipboard copy Failed:" , error);
            onError?.(error);
            fallbackCopy(text , onSuccess , onError);
        }
    }else{
        fallbackCopy(text , onSuccess , onError);
    }
};


export const numberFormat = (
  value: number | string | null | undefined,
  decimal = 2
): string => {
  if (value === null || value === undefined || value === "") return "-";

  const num = Number(value);
  if (isNaN(num)) return "-";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  }).format(num);
};

export const fullNumberFormat = (
  value: number | string | null | undefined,
  decimal = 0
): string => {
  if (value === null || value === undefined || value === "") return "-";

  const num = Number(value);
  if (isNaN(num)) return "-";

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimal,
    maximumFractionDigits: decimal,
  }).format(num);
};

