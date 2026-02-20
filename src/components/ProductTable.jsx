import { FaMinusCircle } from "react-icons/fa";
import {formatNumber,formattDecimalNumber,formatTo2Decimals} from "./Fomatter.jsx";


export default function ProductTable({data,pricesHandler,removeHandler,pricesErrors,authorizedEdit=true}){
    const tablestyle = {
        thead: { backgroundColor: "#A9D8E9" },
        th: { backgroundColor: "inherit" , position: "sticky", top:0, zIndex:10},
        thNumber: { backgroundColor: "inherit" , position: "sticky", top:0, zIndex:10, textAlign: "right"},
    }
    // console.log(data);
    // console.log(pricesErrors);

    return (
        <>
        <div className="overflow-auto max-h-[500px]">
        <table id="productTable" className="table table-striped" style={{ tableLayout: "auto" }}>
            <thead className="sticky top-0 z-30" style={tablestyle['thead']}>
                <tr>
                    {
                        authorizedEdit &&
                            <th style={tablestyle['th']}>Actions</th>
                    }
                    <th style={tablestyle['th']}>No</th>
                    <th style={tablestyle['th']}>Product Code</th>
                    <th style={tablestyle['th']}>Product Name</th>
                    <th style={tablestyle['th']}>Unit</th>
                    <th style={tablestyle['thNumber']}>Price</th>
                    <th style={tablestyle['thNumber']}>New Cost Price</th>
                    <th style={tablestyle['thNumber']}>Price 1</th>
                    <th style={tablestyle['thNumber']}>Price 2</th>
                    <th style={tablestyle['thNumber']}>Profit</th>
                </tr>

            </thead>
            <tbody>

                {
                    data.map((item,index)=>(
                        <tr key={index}>
                            {
                                authorizedEdit &&
                                <td>
                                    <span
                                        onClick={(e) => removeHandler(e,item.product_code)}
                                        className="cursor-pointer text-red-500 text-lg hover:text-red-600"
                                        role="button"
                                        aria-label="Remove product"
                                    ><FaMinusCircle className="text-red-500 text-lg" /></span>
                                </td>
                            }
                            <td>{++index}</td>
                            <td>{item.product_code}</td>
                            <td>{item.product_name}</td>
                            <td>{item.unit}</td>
                            <td className="text-right">{formatNumber(item.price)}</td>
                            <td className="text-right">
                                {
                                    authorizedEdit ?
                                        <input type="number" id="new_cost_price" name="new_cost_price"    className={`w-28 p-1 rounded-md focus:outline-none border
                                            ${
                                                pricesErrors?.[item.product_code]?.['new_cost_price'] || pricesErrors?.[item.product_code]?.['New Cost Price']
                                                    ? 'border-red-600 focus:border-red-600'
                                                    : 'border-cyan-500 focus:border-cyan-500'
                                            }
                                        `} 
                                        onChange={(e)=>pricesHandler(e,item.product_code)} 
                                        value={item.new_cost_price}
                                        readOnly={!authorizedEdit}
                                        />
                                    : formatNumber(item.new_cost_price)
                                }
                            </td>
                            <td className="text-right">
                                {
                                    authorizedEdit ?
                                        <input type="number" id="price1" name="price1"    className={`w-28 p-1 rounded-md focus:outline-none border
                                            ${
                                                pricesErrors?.[item.product_code]?.['price1'] || pricesErrors?.[item.product_code]?.['Price 1']
                                                    ? 'border-red-600 focus:border-red-600'
                                                    : 'border-cyan-500 focus:border-cyan-500'
                                            }
                                        `} 
                                        data-priceError = {pricesErrors?.[`Product_${item.product_code}_price1`] || pricesErrors?.[`Product_${item.product_code}_Price 1`]}
                                        onChange={(e)=>pricesHandler(e,item.product_code)} 
                                        value={item.price1}
                                        readOnly={!authorizedEdit}
                                        />
                                    : formatNumber(item.price1)
                                }

                            
                            </td>
                            <td className="text-right">
                                {
                                    authorizedEdit ?
                                        <input type="number" id="price2" name="price2"    className={`w-28 p-1 rounded-md focus:outline-none border
                                            ${
                                                pricesErrors?.[item.product_code]?.['price2'] || pricesErrors?.[item.product_code]?.['Price 2']
                                                    ? 'border-red-600 focus:border-red-600'
                                                    : 'border-cyan-500 focus:border-cyan-500'
                                            }
                                        `} 
                                        onChange={(e)=>pricesHandler(e,item.product_code)} 
                                        value={item.price2}
                                        readOnly={!authorizedEdit}
                                        />
                                    : formatNumber(item.price2)
                                }

                            </td>
                            <td className={`text-right ${formatTo2Decimals(item.profit * 100) <= 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`} style={{ whiteSpace: "nowrap"}}>
                                {formatTo2Decimals(item.profit * 100)} %
                            </td>
                            {/* <td>
                                {(item.profit)}
                            </td> */}
                        </tr>
                    ))
                }
            </tbody>
        </table>
        </div>
        </>
    )
}