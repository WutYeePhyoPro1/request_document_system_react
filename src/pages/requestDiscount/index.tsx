import { useEffect, useState } from 'react';
import { Table, Checkbox, Pagination, Select, MultiSelect } from '@mantine/core';
import '@mantine/core/styles.css';
import type { IndexData } from '../../utils/requestDiscountUtil';
import NavPath from '../../components/NavPath';
import { Link } from 'react-router-dom';
import { dateFormat } from '../../utils/requestDiscountUtil/helper';
import { DatePickerInput } from '@mantine/dates';
import '@mantine/dates/styles.css';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { fetchRequestDiscountData } from '../../store/discountSlice';


  
export default function Demo() {
  const dispatch = useDispatch<AppDispatch>();
  const {mainData , loading} = useSelector((state:RootState) => state.discount)
  const [discountData, setDiscountData] = useState<IndexData[] >([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [activePage , setActivePage] = useState<number>(1);
  const [value , setValue] = useState<string | null>(null);
   useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    if (token) {
      dispatch(fetchRequestDiscountData({ token }));
    }
  }, [dispatch]);

  // Add this useEffect to sync mainData with discountData
  useEffect(() => {
    if (mainData?.length) {
      console.log("Setting discount data from mainData");
      setDiscountData(mainData);
    }
  }, [mainData]); 

  console.log("MainData>", mainData);
const pageSize:number = 10 ;
const start = (activePage - 1 )* pageSize ;
const end = start + pageSize;
const paginateData = discountData?.slice(start , end);

  const rows = paginateData?.map((element , index) => (
    <Table.Tr
      key={element.id}
      bg={selectedRows.includes(element.id) ? 'var(--mantine-color-blue-light)' : undefined}
    >
     
     <Table.Td>{start + index + 1}</Table.Td>
     <Table.Td>{element.status}</Table.Td>
      <Table.Td>{element.form_doc_no}</Table.Td>
      <Table.Td>{element.from_branches.branch_name}</Table.Td>
      <Table.Td>{element.originators.name}</Table.Td>
      <Table.Td>{dateFormat(element.created_at)}</Table.Td>
      <Table.Td>{dateFormat(element.updated_at)}</Table.Td>
      <Link to={`/request-discount-detail/${element.id}`}>
      <Table.Td  >Detail</Table.Td>
      </Link>
    </Table.Tr>
  )) ?? [];

  return (
   <div className="">
    <div className="p-6 bg-white">
    <NavPath segments={[
      {path: "/dashboard" , label: "Home"} ,
      {path: "/dashboard" , label: "Dashboard"} ,
      {path: '/request-discount-index' , label: 'Request Discount'}
    ]} 
    />
    <div className="flex justify-between mr-4">
      <h2 className="text-xl font-semibold">Request Discount Form</h2>
      <Link to="/request-discount-create" className="text-white font-bold py-2 px-4 rounded cursor-pointer text-sm" 
      style={{
                                    backgroundColor: '#2ea2d1',
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}
      >
        Add
      </Link>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6 text-sm mt-4">
        <div className="flex flex-col">
        <label htmlFor="formDocNo" className="mb-1 font-medium text-gray-700">
          Product Category 
        </label>
        
        <input id="formDocNo" type="text" placeholder='Enter product category or name or code' 
        className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
        name=""  />
      </div>
      <div className="flex flex-col">
        <label htmlFor="formDocNo" className="mb-1 font-medium text-gray-700">
          Form Doc No
        </label>
        
        <input id="formDocNo" type="text" placeholder='Enter Form Doc No' 
        className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
        name=""  />
      </div>
      <div className="flex flex-col">
        <label htmlFor="formDocNo" className="mb-1 font-medium text-gray-700">
          From Date
        </label>
        
      <DatePickerInput
     className="border border-blue-500 focus:outline-none w-full rounded-md"
      placeholder="Pick date"
      value={value}
      onChange={setValue}

    />
      </div>
        <div className="flex flex-col">
        <label htmlFor="formDocNo" className="mb-1 font-medium text-gray-700">
          To Date
        </label>
        
      <DatePickerInput
      placeholder="Pick date" 
      className="border border-blue-500 focus:outline-none w-full rounded-md"
      value={value}
      onChange={setValue}

    />
      </div>
         <div className="flex flex-col">
                                      <label htmlFor="status" className="mb-1 font-medium text-gray-700">
                                          Status
                                      </label>
                                      <MultiSelect
                                          id="status"
                                          placeholder="Select Status"
                                          data={['React', 'Angular', 'Vue', 'Svelte']}
                                          className="border border-blue-500 focus:outline-none w-full rounded-md"
                                      />
                                  </div>
                                   <div className="flex flex-col">
                                      <label htmlFor="status" className="mb-1 font-medium text-gray-700">
                                          Status
                                      </label>
                                      <Select
                                          id="status"
                                          data={['React', 'Angular', 'Vue', 'Svelte']}
                                          placeholder="Select Status"
                                          className="border border-blue-500 focus:outline-none w-full rounded-md"
                                      />
                                  </div>
                                    <div className="flex items-end">
                                <button className="text-white px-4 py-2 rounded w-full cursor-pointer"  style={{
                                    backgroundColor: '#2ea2d1',
                                }}
                                  >
                                    Search
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
          <Table.Th>From Branch</Table.Th>
          <Table.Th>Requested By</Table.Th>
          <Table.Th>Created Date</Table.Th>
          <Table.Th>Modified</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {discountData.length > 0 ? rows : 'There is no Data'}
      </Table.Tbody>
    </Table>
    </div>
    
   </div>
   <div className="mx-auto mt-6">
     <Pagination
          total={Math.ceil((discountData?.length ?? 0) / pageSize)}
          value={activePage}
          onChange={setActivePage}
          boundaries={1}
        />
   </div>
   </div>
  );
}