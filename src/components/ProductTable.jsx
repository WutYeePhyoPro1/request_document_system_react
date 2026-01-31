import { FaMinusCircle } from "react-icons/fa";
import {formatNumber} from "./Fomatter.jsx";


export default function ProductTable({data,pricesHandler,removeHandler,pricesErrors,authorizedEdit=true}){
    const tablestyle = {
        thead: { backgroundColor: "#A9D8E9" },
        th: { backgroundColor: "inherit" , position: "sticky", top:0, zIndex:10},
    }
    // console.log(data);
    // console.log(pricesErrors);

    return (
        <>
        <div className="overflow-auto max-h-[500px]">
        <table id="productTable" className="table table-striped">
            <thead className="sticky top-0 z-30" style={tablestyle['thead']}>
                <tr>
                    <th style={tablestyle['th']}>Actions</th>
                    <th style={tablestyle['th']}>No</th>
                    <th style={tablestyle['th']}>Product Code</th>
                    <th style={tablestyle['th']}>Product Name</th>
                    <th style={tablestyle['th']}>Unit</th>
                    <th style={tablestyle['th']}>Price</th>
                    <th style={tablestyle['th']}>Net Cost Price</th>
                    <th style={tablestyle['th']}>Price 1</th>
                    <th style={tablestyle['th']}>Price 2</th>
                    <th style={tablestyle['th']}>Profit</th>
                </tr>

            </thead>
            <tbody>

                {
                    data.map((item,index)=>(
                        <tr key={index}>
                            <td>
                                <span
                                    onClick={(e) => removeHandler(e,item.product_code)}
                                    className="cursor-pointer text-red-500 text-lg hover:text-red-600"
                                    role="button"
                                    aria-label="Remove product"
                                ><FaMinusCircle className="text-red-500 text-lg" /></span>
                            </td>
                            <td>{++index}</td>
                            <td>{item.product_code}</td>
                            <td>{item.product_name}</td>
                            <td>{item.unit}</td>
                            <td>{formatNumber(item.price)}</td>
                            <td></td>
                            <td >
                                {
                                    authorizedEdit ?
                                        <input type="number" id="price1" name="price1"    className={`w-28 p-1 rounded-md focus:outline-none border
                                            ${
                                                pricesErrors?.[`Product_${index}_price1`] || pricesErrors?.[`Product_${index}_Price 1`]
                                                    ? 'border-red-600 focus:border-red-600'
                                                    : 'border-cyan-500 focus:border-cyan-500'
                                            }
                                        `} 
                                        onChange={(e)=>pricesHandler(e,item.product_code)} 
                                        value={item.price1}
                                        readOnly={!authorizedEdit}
                                        />
                                    : item.price1
                                }

                            
                            </td>
                            <td>
                                {
                                    authorizedEdit ?
                                        <input type="number" id="price2" name="price2"    className={`w-28 p-1 rounded-md focus:outline-none border
                                            ${
                                                pricesErrors?.[`Product_${index}_price2`] || pricesErrors?.[`Product_${index}_Price 2`]
                                                    ? 'border-red-600 focus:border-red-600'
                                                    : 'border-cyan-500 focus:border-cyan-500'
                                            }
                                        `} 
                                        onChange={(e)=>pricesHandler(e,item.product_code)} 
                                        value={item.price2}
                                        readOnly={!authorizedEdit}
                                        />
                                    : item.price2
                                }

                            </td>
                            <td></td>
                        </tr>
                    ))
                }
            </tbody>
        </table>
        </div>
        </>
    )
}