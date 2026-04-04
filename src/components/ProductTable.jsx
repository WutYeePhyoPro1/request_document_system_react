import React, { useEffect, useState, useRef} from "react";
import { FaMinusCircle } from "react-icons/fa";
import {formatNumber,formattDecimalNumber,formatTo2Decimals} from "./Fomatter.jsx";
import {useDispatch,useSelector} from "react-redux"

export default function ProductTable({data,pricesHandler,removeHandler,pricesErrors,authorizedEdit=true, activeProcess=false}){
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

    const [selectedCell, setSelectedCell] = useState({
        rowIndex: null,
        colKey: null
    });
    const [editingCell, setEditingCell] = useState({
        rowIndex: null,
        colKey: null
    });
    const isSelected = (rowIndex, colKey) => {
        return selectedCell.rowIndex === rowIndex && selectedCell.colKey === colKey;
    };

    const isEditing = (rowIndex, colKey) => {
        return editingCell.rowIndex === rowIndex && editingCell.colKey === colKey;
    };



    const selectCell = (rowIndex, colKey) => {
        const isSameCell =
            selectedCell.rowIndex === rowIndex &&
            selectedCell.colKey === colKey;

        if (isSameCell) {
            activateEditWithDelay(rowIndex, colKey);
        } else {
            // normal behavior → select new cell + close edit
            setSelectedCell({ rowIndex, colKey });
            setEditingCell({ rowIndex: null, colKey: null });
        }
    };

    const editTimer = useRef(null);
    const activateEditWithDelay = (rowIndex, colKey, delay = 200) => {
        clearTimeout(editTimer.current);

        editTimer.current = setTimeout(() => {
            setEditingCell({ rowIndex, colKey });
        }, delay);
    };

    const hasPriceError = (productCode, productId, inputColumn, excelColumn) => {
        //  || (pricesErrors?.[item.product_code]?.['price1'] || pricesErrors?.[item.product_code]?.['Price 1'] || pricesErrors?.[item.id]?.['price1']) 
        return Boolean(
            pricesErrors?.[productCode]?.[inputColumn] ||                   
            pricesErrors?.[productCode]?.[excelColumn] || 
            pricesErrors?.[productId]?.[inputColumn]
        );
    };

    const inputRef = useRef(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editingCell]);


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
                                <td
                                onClick={() => selectCell(index, 'no')}
                                className={isSelected(index, 'no') ? 'selected-cell' : ''}
                                >{index+1}</td>
                            }

                            {
                                isVisible('product_code') &&
                                <td
                                onClick={() => selectCell(index, 'product_code')}
                                className={isSelected(index, 'product_code') ? 'selected-cell' : ''}
                                >{item.product_code}</td>
                            }

                            {
                                isVisible('product_name') &&
                                <td
                                onClick={() => selectCell(index, 'product_name')}
                                className={isSelected(index, 'product_name') ? 'selected-cell' : ''}
                                >{item.product_name}</td>
                            }

                            {
                                isVisible('unit') &&
                                <td
                                onClick={() => selectCell(index, 'unit')}
                                className={isSelected(index, 'unit') ? 'selected-cell' : ''}
                                >{item.unit}</td>
                            }

                            {
                                isVisible('price') &&
                                <td 
                                onClick={() => selectCell(index, 'price')}
                                className={`text-right text-gray-500 ${isSelected(index, 'price') ? 'selected-cell' : ''}`}
                                >{formatNumber(item.price)}</td>
                            }

                            {
                                isVisible('new_cost_price') &&
                                <td 
                                onClick={() => selectCell(index, 'new_cost_price')}
                                // onDoubleClick={() => activateEditWithDelay(index, 'new_cost_price')}
                                className={`text-right ${isSelected(index, 'new_cost_price') ? 'selected-cell' : ''}`}
                                >
                                    {
                                        (activeProcess && isEditing(index, 'new_cost_price')) || hasPriceError(item.product_code,item.id, 'new_cost_price', 'New Cost Price') || authorizedEdit ?
                                            <input type="number" id="new_cost_price" name="new_cost_price"    className={`w-28 p-1 rounded-md focus:outline-none border text-right pricecols
                                                ${
                                                    pricesErrors?.[item.product_code]?.['new_cost_price'] || pricesErrors?.[item.product_code]?.['New Cost Price'] || pricesErrors?.[item.id]?.['new_cost_price']
                                                        ? 'border-red-600 focus:border-red-600'
                                                        : 'border-cyan-500 focus:border-cyan-500'
                                                }
                                            `} 
                                            onChange={(e)=>pricesHandler(e,item.product_code)} 
                                            // autoFocus
                                            ref={isEditing(index, 'new_cost_price') ? inputRef : null}
                                            onFocus={(e) => e.target.select()} 
                                            value={item.new_cost_price}
                                            readOnly={!authorizedEdit}
                                            />
                                        : <span className="block w-28 text-right ms-auto">{formatNumber(item.new_cost_price)}</span>
                                    }
                                </td>
                            }

                            {
                                isVisible('price1') &&
                                <td 
                                onClick={() => selectCell(index, 'price1')}
                                // onDoubleClick={() => activateEditWithDelay(index, 'price1')}
                                className={`
                                    text-right
                                    ${isSelected(index, 'price1') ? 'selected-cell' : ''}
                                    ${
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
                                        (activeProcess && isEditing(index, 'price1')) || hasPriceError(item.product_code,item.id, 'price1', 'Price 1') || authorizedEdit  ?
                                            <input type="number" id="price1" name="price1"    className={`w-28 p-1 rounded-md focus:outline-none border text-right pricecols
                                                ${
                                                    ((pricesErrors?.[item.product_code]?.['price1'] || pricesErrors?.[item.product_code]?.['Price 1'] || pricesErrors?.[item.id]?.['price1']) && focusedProduct === item.product_code)
                                                        ? 'border-red-600 focus:border-red-600'
                                                        : 'border-gray-600 focus:border-gray-600'
                                                }
                                            `} 
                                            data-priceError = {pricesErrors?.[item.product_code]?.['price1'] || pricesErrors?.[item.product_code]?.['Price 1'] || pricesErrors?.[item.id]?.['price1']}
                                            onChange={(e)=>pricesHandler(e,item.product_code)} 
                                            // autoFocus
                                            ref={isEditing(index, 'price1') ? inputRef : null}
                                            onFocus={(e)=>{
                                                setFocusedProduct(item.product_code);
                                                e.target.select();
                                            }}
                                            onBlur={() => setFocusedProduct(null)}
                                            value={item.price1}
                                            readOnly={!authorizedEdit}
                                            />
                                        : <span className="block w-28 text-right ms-auto">{formatNumber(item.price1)}</span>
                                    }
                                </td>
                            }

                            {
                                isVisible('price2') &&
                                <td 
                                onClick={() => selectCell(index, 'price2')}
                                // onDoubleClick={() => activateEditWithDelay(index, 'price2')}
                                className={`text-right ${isSelected(index, 'price2') ? 'selected-cell' : ''}`}
                                >
                                {
                                    (activeProcess && isEditing(index, 'price2')) || hasPriceError(item.product_code,item.id, 'price2', 'Price 2') || authorizedEdit ?
                                        <input type="number" id="price2" name="price2"    className={`w-28 p-1 rounded-md focus:outline-none border text-right pricecols
                                            ${
                                                pricesErrors?.[item.product_code]?.['price2'] || pricesErrors?.[item.product_code]?.['Price 2'] || pricesErrors?.[item.id]?.['price2']
                                                    ? 'border-red-600 focus:border-red-600'
                                                    : 'border-cyan-500 focus:border-cyan-500'
                                            }
                                        `} 
                                        onChange={(e)=>pricesHandler(e,item.product_code)} 
                                        // autoFocus
                                        ref={isEditing(index, 'price2') ? inputRef : null}
                                        onFocus={(e) => e.target.select()} 
                                        value={item.price2}
                                        readOnly={!authorizedEdit}
                                        />
                                    : <span className="block w-28 text-right ms-auto">{formatNumber(item.price2)}</span>
                                }
                                </td>
                            }

                            {
                                isVisible('profit') &&
                                <td 
                                onClick={() => selectCell(index, 'profit')}
                                className={`text-right 
                                ${isSelected(index, 'profit') ? 'selected-cell' : ''}
                                ${formatTo2Decimals(item.profit * 100) <= 0 ? 'bg-red-500 text-white' : ( formatTo2Decimals(item.profit * 100) < 100 ? 'bg-green-600 text-white' : 'bg-green-800 text-white')}`} style={{ whiteSpace: "nowrap"}}>
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