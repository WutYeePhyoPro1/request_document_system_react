import React from "react";
import NavPath from "../../../components/NavPath";
import { Link } from "react-router-dom";
import { Table } from "@mantine/core";

const Index: React.FC = () => {
  return (
    <div>
    <div className="p-6 bg-white">
        <NavPath 
        segments={[
            {path: "/dashboard" , label: "Home"} ,
            {path:"/dashboard" , label: "Dashboard"} ,
            {path: "/generator" , label:"Generator"} ,
        ]}
        />
        <div className="flex justify-between mr-4">
            <h2 className="text-xl font-semibold">Generator Form</h2> 
            <Link to="/generator_create" 
            className="text-white fonr-bold py-2 px-4 rounded cursor-pointer text-sm" 
            style={{background: "#2ea2d1"}}
            onMouseEnter={(e) => (e.target.style.backgroundColor = "#6fc3df")} 
            onMouseLeave = {(e) => {e.target.style.backgroundColor = "#2ea2d1"}}
            >
                Add
            
            </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mb-6 text-sm mt-4">
            <div className="flex flex-col">
                <label htmlFor="" className="mb-1 font-medium text-gray-700">
                    Form Doc No
                </label>
                <input
              id="formDocNo"
              type="text"
              placeholder="Enter Form Doc No"
              className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
              name="form_doc_no"
             
            />
            </div>
            <div className="flex items-end">
            <button
              className="text-white px-4 py-2 rounded w-full cursor-pointer"
              style={{
                backgroundColor: "#2ea2d1",
              }}
              
            >
              Search
            </button>
          </div>
           <div className="flex items-end">
            <button
              className="text-white px-4 py-2 rounded w-full cursor-pointer"
              style={{
                backgroundColor: "#2ea2d1",
              }}
              
            >
              Clear Search
            </button>
          </div>
        </div>
        <div className="overflow-x-auto mt-4">
            <Table className="min-w-[700px]">
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>No</Table.Th>
                         <Table.Th>Status</Table.Th>
                          <Table.Th>Form No</Table.Th>
                           <Table.Th>Form Branch</Table.Th>
                            <Table.Th>Requested By</Table.Th>
                             <Table.Th>Created Date</Table.Th>
                              <Table.Th>Modified</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                                                      
                </Table.Tbody>
            </Table>
        </div>
    </div>
    </div>
  );
};

export default Index;