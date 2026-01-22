const formatUSD = (price)=>
    new Intl.NumberFormat("en-US",{
        style: "currency",
        currency: "$" // USD usd MMK mmk THB thb     
}).format(price || 0);


export const formatNumber = (num) =>
  new Intl.NumberFormat("en-US").format(num || 0);

export const formatDate = (d) => d.toISOString().split("T")[0];