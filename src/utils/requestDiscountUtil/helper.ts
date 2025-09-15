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