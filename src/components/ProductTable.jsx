import { FaMinusCircle } from "react-icons/fa";
import {formatNumber} from "./Fomatter.jsx";


export default function ProductTable({data,pricesHandler,removeHandler}){
    const tablestyle = {
        thead: { backgroundColor: "#A9D8E9" },
        th: { backgroundColor: "inherit" },
    }
    // console.log(data);

    return (
        <>
        <div className="overflow-x-auto">
        <table id="productTable" className="table table-striped">
            <thead style={tablestyle['thead']}>
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
                    data.map((item,idx)=>(
                        <tr key={idx}>
                            <td>
                                <span
                                    onClick={(e) => removeHandler(e,item.product_code)}
                                    className="cursor-pointer text-red-500 text-lg hover:text-red-600"
                                    role="button"
                                    aria-label="Remove product"
                                ><FaMinusCircle className="text-red-500 text-lg" /></span>
                            </td>
                            <td>{++idx}</td>
                            <td>{item.product_code}</td>
                            <td>{item.product_name}</td>
                            <td>{item.unit}</td>
                            <td>{formatNumber(item.price)}</td>
                            <td></td>
                            <td>
                                <input type="number" id="price1" name="price1" className="w-28 border focus:outline-none  p-1 w-fulls rounded-md" style={{ borderColor: '#2ea2d1' }} onChange={(e)=>pricesHandler(e,item.product_code)} value={item.price1}/>
                            </td>
                            <td>
                                <input type="number" id="price2" name="price2" className="w-28 border focus:outline-none  p-1 w-fulls rounded-md" style={{ borderColor: '#2ea2d1' }} onChange={(e)=>pricesHandler(e,item.product_code)} value={item.price2}/>
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