export function dateFormat(dateString:string | undefined | null , withTime:boolean = false):string {
if(!dateString) return "" ;
const date = new Date(dateString) ;
if(withTime) {
    return date.toLocaleDateString("en-GB" , {
        year: 'numeric' ,
        month:'2-digit',
        day:'2-digit',
        hour:'2-digit',
        minute:'2-digit',
        hour12:false,
    });
}
return date.toLocaleDateString("en-GB" , {
    year: 'numeric',
    month: '2-digit',
    day:'2-digit',
});
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