import { useEffect, useState } from 'react';
import { Table, Checkbox, Pagination } from '@mantine/core';
import '@mantine/core/styles.css';
import { getRequestDiscountData } from '../../api/requestDiscount/requestDiscountData';
import type { IndexData } from '../../utils/requestDiscountUtil';
import NavPath from '../../components/NavPath';
import { Link } from 'react-router-dom';


  
export default function Demo() {
  const [discountData, setDiscountData] = useState<IndexData[] >([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [activePage , setActivePage] = useState<number>(1);
const fetchData = async (): Promise<void> => {
  const token = localStorage.getItem("token");
  if(!token) return ;
  try {
    const data:IndexData[] = await getRequestDiscountData(token);
    setDiscountData(data);
  } catch (error) {
     console.error("Error fetching discount data:", error);
  }
}
useEffect(() => {
  fetchData();
} , []);
const pageSize:number = 10 ;
const start = (activePage - 1 )* pageSize ;
const end = start + pageSize;
const paginateData = discountData?.slice(start , end);

  const rows = paginateData?.map((element) => (
    <Table.Tr
      key={element.id}
      bg={selectedRows.includes(element.id) ? 'var(--mantine-color-blue-light)' : undefined}
    >
      <Table.Td>
        <Checkbox
          aria-label="Select row"
          checked={selectedRows.includes(element.id)}
          onChange={(event) =>
            setSelectedRows(
              event.currentTarget.checked
                ? [...selectedRows, element.id]
                : selectedRows.filter((id) => id !== element.id)
            )
          }
        />
      </Table.Td>
     <Table.Td>{element.id}</Table.Td>
      <Table.Td>{element.form_doc_no}</Table.Td>
      <Table.Td>{element.from_branch}</Table.Td>
      <Table.Td>{element.from_department}</Table.Td>
      <Table.Td>{element.to_branch}</Table.Td>
      <Table.Td>{element.to_department}</Table.Td>
    </Table.Tr>
  )) ?? [];

  return (
   <div className="">
    <div className="p-6 bg-white shadow-md rounded-lg">
    <NavPath segments={[
      {path: "/dashboard" , label: "Home"} ,
      {path: "/dashboard" , label: "Dashboard"} ,
      {path: '/request-discount-index' , label: 'Request Discount'}
    ]} 
    />
    <div className="flex justify-between mr-4">
      <h2 className="text-xl font-semibold">Request Discount Form</h2>
      <Link to="/request-discount" className="text-white font-bold py-2 px-4 rounded cursor-pointer text-sm" 
      style={{
                                    backgroundColor: '#2ea2d1',
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}
      >
        Add
      </Link>
    </div>
     <Table className="mt-4">
      <Table.Thead>
        <Table.Tr>
          <Table.Th />
         <Table.Th>ID</Table.Th>
          <Table.Th>Form No</Table.Th>
          <Table.Th>From Branch</Table.Th>
          <Table.Th>From Dept</Table.Th>
          <Table.Th>To Branch</Table.Th>
          <Table.Th>To Dept</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {discountData.length > 0 ? rows : 'There is no Data'}
      </Table.Tbody>
    </Table>
    
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