import React, { useEffect, useState} from "react";
import { FaMinusCircle } from "react-icons/fa";
import {formatNumber,formattDecimalNumber,formatTo2Decimals} from "./Fomatter.jsx";
import {useDispatch,useSelector} from "react-redux"

export default function ProductTable({data,pricesHandler,removeHandler,pricesErrors,authorizedEdit=true}){
    const tablestyle = {
        thead: { backgroundColor: "#A9D8E9" },
        th: { backgroundColor: "inherit" , position: "sticky", top:0, zIndex:10},
        thNumber: { backgroundColor: "inherit" , position: "sticky", top:0, zIndex:10, textAlign: "right"},
    }
    const [focusedProduct, setFocusedProduct] = useState(null);
    // console.log(data);
    // console.log(pricesErrors);

    const {columns, visibleColumns} = useSelector((state)=>state.pricechanges)
    const isVisible = (slug) => visibleColumns.includes(slug);

    return (
        <>
        <div className="overflow-auto max-h-[500px]">
        <table id="productTable" className="table table-striped" style={{ tableLayout: "auto" }}>
            <thead className="sticky top-0 z-30" style={tablestyle['thead']}>
                <tr>
                {columns.map((col) =>
                    isVisible(col.slug) &&
                    (!col.requireAuth || authorizedEdit) && (
                    <th
                        key={col.slug}
                        style={col.numeric ? tablestyle['thNumber'] : tablestyle['th']}
                    >
                        <span className={col.slug == 'price' ? "text-gray-500" : ""}>
                        {col.name}
                        </span>
                    </th>
                    )
                )}
                </tr>
            </thead>
            <tbody>

                {
                    data.map((item,index)=>(
                        <tr key={index}>
                            {
                                authorizedEdit && isVisible('actions') &&
                                <td>
                                    <span
                                        onClick={(e) => removeHandler(e,item.product_code)}
                                        className="cursor-pointer text-red-500 text-lg hover:text-red-600"
                                        role="button"
                                        aria-label="Remove product"
                                    ><FaMinusCircle className="text-red-500 text-lg" /></span>
                                </td>
                            }

                            {
                                isVisible('no') &&
                                <td>{++index}</td>
                            }

                            {
                                isVisible('product_code') &&
                                <td>{item.product_code}</td>
                            }

                            {
                                isVisible('product_name') &&
                                <td>{item.product_name}</td>
                            }

                            {
                                isVisible('unit') &&
                                <td>{item.unit}</td>
                            }

                            {
                                isVisible('price') &&
                                <td className="text-right text-gray-500">{formatNumber(item.price)}</td>
                            }

                            {
                                isVisible('new_cost_price') &&
                                <td className="text-right">
                                    {
                                        authorizedEdit ?
                                            <input type="number" id="new_cost_price" name="new_cost_price"    className={`w-28 p-1 rounded-md focus:outline-none border text-right
                                                ${
                                                    pricesErrors?.[item.product_code]?.['new_cost_price'] || pricesErrors?.[item.product_code]?.['New Cost Price'] || pricesErrors?.[item.id]?.['new_cost_price']
                                                        ? 'border-red-600 focus:border-red-600'
                                                        : 'border-cyan-500 focus:border-cyan-500'
                                                }
                                            `} 
                                            onChange={(e)=>pricesHandler(e,item.product_code)} 
                                            onFocus={(e) => e.target.select()} 
                                            value={item.new_cost_price}
                                            readOnly={!authorizedEdit}
                                            />
                                        : formatNumber(item.new_cost_price)
                                    }
                                </td>
                            }

                            {
                                isVisible('price1') &&
                                <td className={`text-right ${
                                    focusedProduct === item.product_code
                                            ? 'bg-gray-200'
                                            : Number(item.price1) > Number(item.price)
                                            ? 'bg-green-600 text-white'
                                            : Number(item.price1) === Number(item.price)
                                            ? 'bg-yellow-400 text-black'
                                            : 'bg-red-500 text-white'
                                    }`}>
                                    {/* { item.price1 }, {item.price} */}
                                    {
                                        authorizedEdit ?
                                            <input type="number" id="price1" name="price1"    className={`w-28 p-1 rounded-md focus:outline-none border text-right
                                                ${
                                                    ((pricesErrors?.[item.product_code]?.['price1'] || pricesErrors?.[item.product_code]?.['Price 1'] || pricesErrors?.[item.id]?.['price1']) && focusedProduct === item.product_code)
                                                        ? 'border-red-600 focus:border-red-600'
                                                        : 'border-gray-600 focus:border-gray-600'
                                                }
                                            `} 
                                            data-priceError = {pricesErrors?.[item.product_code]?.['price1'] || pricesErrors?.[item.product_code]?.['Price 1'] || pricesErrors?.[item.id]?.['price1']}
                                            onChange={(e)=>pricesHandler(e,item.product_code)} 
                                            onFocus={(e)=>{
                                                setFocusedProduct(item.product_code);
                                                e.target.select();
                                            }}
                                            onBlur={() => setFocusedProduct(null)}
                                            value={item.price1}
                                            readOnly={!authorizedEdit}
                                            />
                                        : formatNumber(item.price1)
                                    }
                                </td>
                            }

                            {
                                isVisible('price2') &&
                                <td className="text-right">
                                {
                                    authorizedEdit ?
                                        <input type="number" id="price2" name="price2"    className={`w-28 p-1 rounded-md focus:outline-none border text-right
                                            ${
                                                pricesErrors?.[item.product_code]?.['price2'] || pricesErrors?.[item.product_code]?.['Price 2'] || pricesErrors?.[item.id]?.['price2']
                                                    ? 'border-red-600 focus:border-red-600'
                                                    : 'border-cyan-500 focus:border-cyan-500'
                                            }
                                        `} 
                                        onChange={(e)=>pricesHandler(e,item.product_code)} 
                                        onFocus={(e) => e.target.select()} 
                                        value={item.price2}
                                        readOnly={!authorizedEdit}
                                        />
                                    : formatNumber(item.price2)
                                }
                            </td>
                            }

                            {
                                isVisible('profit') &&
                                <td className={`text-right ${formatTo2Decimals(item.profit * 100) <= 0 ? 'bg-red-500 text-white' : ( formatTo2Decimals(item.profit * 100) < 100 ? 'bg-green-600 text-white' : 'bg-green-800 text-white')}`} style={{ whiteSpace: "nowrap"}}>
                                    {formatTo2Decimals(item.profit * 100)} %
                                </td>
                            }


                         
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