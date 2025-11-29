import { useEffect, useMemo, useState } from "react";
import {
  Table,
  Pagination,
  Select,
  MultiSelect,
  Loader,
} from "@mantine/core";
import type { IndexData } from "../../utils/requestDiscountUtil";
import NavPath from "../../components/NavPath";
import { Link, useNavigate, useParams } from "react-router-dom";
import { dateFormat } from "../../utils/requestDiscountUtil/helper";
import { DatePickerInput } from "@mantine/dates";
import StatusBadge from "../../components/ui/StatusBadge";

import {
  getRequestDiscountData,
  searchDiscountProduct,
} from "../../api/requestDiscount/requestDiscountData";

export default function Demo() {
  
  const [discountData, setDiscountData] = useState<IndexData[]>([]);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [activePage, setActivePage] = useState<number>(1);
  const [value, setValue] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState({
    form_doc_no: "",
    product_category: "",
    from_date: null as string | null,
    to_date: null as string | null,
    status: [] as string[],
  });
  const [loading, setLoading] = useState(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchTerm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (
    name: "from_date" | "to_date",
    value: string | null
  ) => {
    setSearchTerm((prev) => ({ ...prev, [name]: value }));
  };
  const handleStatusChange = (value: string[]) => {
    if (value.includes("All")) {
      setSearchTerm((prev) => ({ ...prev, status: ["All"] }));
    } else {
      setSearchTerm((prev) => ({ ...prev, status: value }));
    }
  };
  const handleBranchChange = (value: string) => {
    setSearchTerm((prev) => ({ ...prev, branch_id: value }));
  };
  const navigate = useNavigate();
  

  const fetchData = async (): Promise<void> => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true)
    try {
      const data = await getRequestDiscountData(token);
      setDiscountData(data);
      setLoading(false) ;
    } catch (error) {
      console.error("Error fetching discount data:", error);
    }finally{
      setLoading(false) ;
    }
  };
  


  useEffect(() => {
    fetchData();
  }, []);
  console.log("Data Check>>", discountData);
  const pageSize: number = 10;
  const start = (activePage - 1) * pageSize;
  const end = start + pageSize;
  // const paginateData = discountData?.data?.slice(start, end) ?? [];
  const paginateData = useMemo(() => {
    const start = (activePage - 1) * pageSize ;
    return discountData?.data?.slice(start , start + pageSize) ?? [] ;
  } , [discountData , activePage]) ;
//Hello test git conflig
  const handleSearch = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const results = await searchDiscountProduct(token, searchTerm);
      setDiscountData(results);
      setActivePage(1);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };
  const handleRestart = async () => {
    setSearchTerm({
      form_doc_no: "",
      product_category: "",
      from_date: null,
      to_date: null,
      status: [],
    });
    setActivePage(1);
    setDiscountData([]);
    await fetchData();
    navigate("/request_discount");
  };

  const rows = useMemo(() => {
    return paginateData?.map((element , index) => (
       <Table.Tr
        key={element.id}
        bg={
          selectedRows.includes(element.id)
            ? "var(--mantine-color-blue-light)"
            : undefined
        }
      >
        <Link
          to={`/request_discount_detail/${element.id}`}
          className="contents"
         
        >
          <Table.Td>{start + index + 1}</Table.Td>
          <Table.Td>
            <StatusBadge status={element.status} />
          </Table.Td>
          <Table.Td>{element.form_doc_no}</Table.Td>
          <Table.Td>{element.from_branches?.branch_name}</Table.Td>
          <Table.Td>{element.originators?.name}</Table.Td>
          <Table.Td>{dateFormat(element.created_at)}</Table.Td>
          <Table.Td>{dateFormat(element.updated_at)}</Table.Td>
          <Table.Td className="text-blue-600 font-medium underline">
            View
          </Table.Td>
        </Link>
      </Table.Tr>
    ))
  } , [paginateData , selectedRows])
  const showLoading = loading ||  !discountData;
  if (showLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader size="xl" color="blue" />
          <div className="text-lg font-semibold text-gray-700 animate-pulse">
            Loading Detail Data...
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="">
      <div className="p-6 bg-white">
        <NavPath
          segments={[
            { path: "/dashboard", label: "Home" },
            { path: "/dashboard", label: "Dashboard" },
            { path: "/request-discount-index", label: "Request Discount" },
          ]}
        />
        <div className="flex justify-between mr-4">
          <h2 className="text-xl font-semibold">Request Discount Form</h2>
          {(discountData?.authenticatedUser?.role_id == 1 ||
            discountData?.authenticatedUser?.role_id == 10) && (
            <Link
              to="/request-discount-create"
              className="text-white font-bold py-2 px-4 rounded cursor-pointer text-sm"
              style={{
                backgroundColor: "#2ea2d1",
              }}
              onMouseEnter={(e) => (e.target.style.backgroundColor = "#6fc3df")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "#2ea2d1")}
            >
              Add
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-8 gap-4 mb-6 text-sm mt-4">
          <div className="flex flex-col">
            <label
              htmlFor="formDocNo"
              className="mb-1 font-medium text-gray-700"
            >
              Product Category
            </label>

            <input
              id="formDocNo"
              type="text"
              placeholder="Enter product category or name or code"
              className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
              name="product_category"
              value={searchTerm.product_category}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="formDocNo"
              className="mb-1 font-medium text-gray-700"
            >
              Form Doc No
            </label>

            <input
              id="formDocNo"
              type="text"
              placeholder="Enter Form Doc No"
              className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
              name="form_doc_no"
              value={searchTerm.form_doc_no}
              onChange={handleInputChange}
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="formDocNo"
              className="mb-1 font-medium text-gray-700"
            >
              From Date
            </label>

            <DatePickerInput
              className="border border-blue-500 focus:outline-none w-full rounded-md"
              placeholder="Pick date"
              name="from_date"
              value={searchTerm.from_date}
              onChange={(value) => handleDateChange("from_date", value)}
            />
          </div>
          <div className="flex flex-col">
            <label
              htmlFor="formDocNo"
              className="mb-1 font-medium text-gray-700"
            >
              To Date
            </label>

            <DatePickerInput
              placeholder="Pick date"
              className="border border-blue-500 focus:outline-none w-full rounded-md"
              name="to_date"
              value={searchTerm.to_date}
              onChange={(value) => handleDateChange("to_date", value)}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="status" className="mb-1 font-medium text-gray-700">
              Status
            </label>
            <MultiSelect
              id="status"
              placeholder="Select Status"
              data={[
                "All",
                "Ongoing",
                "BM Approved",
                "Approved",
                "Acknowledged",
                "Completed",
              ]}
              className="border border-blue-500 focus:outline-none w-full rounded-md"
              value={searchTerm.status}
              onChange={handleStatusChange}
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="status" className="mb-1 font-medium text-gray-700">
              Branch
            </label>
            {discountData?.authenticatedUser?.emp_id == "000-000046" ||
            discountData?.authenticatedUser?.emp_id == "000-000024" ||
            discountData?.authenticatedUser?.emp_id == "000-000067" ? (
              <Select
                id="branch_id"
                searchable
                data={discountData?.branch?.map((item) => ({
                  value: item.id,
                  label: item.branch_name,
                }))}
                placeholder="Select Status"
                className="border border-blue-500 focus:outline-none w-full rounded-md"
              />
            ) : (
              <Select
                id="branch_id"
                name="branch_id"
                searchable
                data={discountData?.authenticatedUser?.user_branches?.map(
                  (item) => ({
                    value: String(item.branch_id),
                    label: item.branches?.branch_name,
                  })
                )}
                onChange={handleBranchChange}
                placeholder="Select Status"
                className="border border-blue-500 focus:outline-none w-full rounded-md"
              />
            )}
          </div>
          <div className="flex items-end">
            <button
              className="text-white px-4 py-2 rounded w-full cursor-pointer"
              style={{
                backgroundColor: "#2ea2d1",
              }}
              onClick={handleSearch}
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
              onClick={handleRestart}
            >
              Restart
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
              {discountData?.data?.length > 0 ? (
                rows
              ) : (
               
                  <Table.Tr>
          <Table.Td colSpan={7}>
            <div className="flex flex-col items-center justify-center py-10">
              {/* <Loader size="xl" color="blue" /> */}
              <p className="mt-4 text-lg font-semibold text-gray-700 animate-pulse">
                There has no data
              </p>
            </div>
          </Table.Td>
        </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </div>
      </div>
      <div className="mx-auto mt-6">
        <Pagination
          total={Math.ceil((discountData?.data?.length ?? 0) / pageSize)}
          value={activePage}
          onChange={setActivePage}
          boundaries={1}
        />
      </div>
    </div>
  );
}