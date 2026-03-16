const formatUSD = (price)=>
    new Intl.NumberFormat("en-US",{
        style: "currency",
        currency: "$" // USD usd MMK mmk THB thb     
}).format(price || 0);


export const formatNumber = (num) =>
  new Intl.NumberFormat("en-US").format(num || 0);

export const formatDate = (d) => d.toISOString().split("T")[0];

export const formatStrDateTime = (dateStr) => {
    const d = new Date(dateStr);
    // return `${d.getFullYear()}-${
    //     String(d.getMonth() + 1).padStart(2, '0')
    // }-${String(d.getDate()).padStart(2, '0')} 
    // ${
    //     String(d.getHours()).padStart(2, '0')
    // }:${String(d.getMinutes()).padStart(2, '0')}`

    return `
        ${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}
        ${ String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}
    `;
};

export const formattDecimalNumber = (num)=> Number(num).toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })
export const formatTo2Decimals = (num) =>  Number(num).toFixed(2);

// utils/dateHelper.js
export const formatLaravelStyleDate = (date, format = "Y-m-d") => {
  if (!date) return "";

  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, "0");

  const map = {
    Y: d.getFullYear(),           // 2026
    y: String(d.getFullYear()).slice(-2), // 26
    m: pad(d.getMonth() + 1),      // 02
    n: d.getMonth() + 1,           // 2
    d: pad(d.getDate()),           // 23
    j: d.getDate(),                // 23
    H: pad(d.getHours()),          // 14
    h: pad(d.getHours() % 12 || 12),// 02
    i: pad(d.getMinutes()),        // 30
    s: pad(d.getSeconds()),        // 05
  };

  return format.replace(/[YymndjHhis]/g, (key) => map[key]);
};