import React, { useEffect, useState } from "react";
import { getCheckItems } from "../../api/ME/meData";
import { Link } from "react-router-dom";

const MAndE: React.FC = () => {
    const [checkItems , setCheckItems] = useState<{id:number , name:string} []>([]);
    const [loading , setLoading] = useState<boolean> (false) ;
    useEffect(() => {
        const fetchCheckItems = async() => {
            const token = localStorage.getItem("token") ;
            if(!token) return ;
            setLoading(true) ;
            try {
                const items = await getCheckItems(token) ;
                setCheckItems(items) ;
                setLoading(false) ;
            } catch (error) {
                console.log("Error fetching check items:" , error);
            }finally{
                setLoading(false) ;
            }

        }
        fetchCheckItems();

    } , []) ;
    console.log("Check Items>>" , checkItems) ;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
    {
        checkItems.map((items , index) => {
            return(
                <Link key={index} to={`/${items?.name?.toLowerCase().replace(/\s+/g, "-")}`}  className="relative m-2 border rounded-lg shadow-md p-4 flex items-center space-x-3 transition bg-white border-blue-300 hover:shadow-lg cursor-pointer" >
                <span className="font-semibold">{items.name}</span>
                </Link>
            )
        })
    }
    </div>
  );
};

export default MAndE;