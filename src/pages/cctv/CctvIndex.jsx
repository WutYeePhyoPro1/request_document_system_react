import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Pusher from 'pusher-js';

export default function CctvIndex() {
    const [cctvRequests, setCctvRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationInfo, setPaginationInfo] = useState(null);

    useEffect(() => {
        const pusher = new Pusher("7f54d776052e8e1407bf", {
            cluster: "ap1",
            encrypted: true,
        });

        const channel = pusher.subscribe("my-channel");
        channel.bind("my-event", (data) => {
            console.log("Received notification: ", data.message);
            alert(JSON.stringify(data.message));
        });

        return () => {
            pusher.unsubscribe("my-channel");
            pusher.disconnect();
        };
    }, []);



    const [formData, setFormData] = useState({
        formDocNo: '',
        issueDate: '',
        endDate: '',
        status: '',
        branch: 'All Branch'
    });

    const fetchCctvRecords = async (page = 1) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/cctv-records?page=${page}`, {
                method: "GET",
                mode: "cors",
                headers: {
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error(`Error fetching CCTV records: ${response.statusText}`);
            }
            const data = await response.json();
            setCctvRequests(data.data.data);
            setPaginationInfo(data.data);
            setCurrentPage(data.data.current_page);
        } catch (error) {
            console.error("Error fetching CCTV records:", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageClick = (page) => {
        if (page >= 1 && page <= paginationInfo.last_page) {
            fetchCctvRecords(page);
        }
    };

    useEffect(() => {
        fetchCctvRecords();
    }, []);

    const form_id = 15;

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get(`/users/search_notifications/${form_id}`, formData);
            console.log(response.data);
        } catch (error) {
            console.error('Error searching:', error);
        }
    }

    const handleChange = (e) => {
        const { id, value } = e.target;
        console.log(id, value);
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    return (

        <>
            {
                loading ? (
                    <div className="flex justify-center items-center min-h-screen" >
                        <div className="text-xl font-bold text-black">
                            Loading
                            <span className="animate-pulse">.</span>
                            <span className="animate-pulse delay-200">.</span>
                            <span className="animate-pulse delay-400">.</span>
                        </div>
                    </div>

                ) : (
                    < div className="p-6 bg-white shadow-md rounded-lg" >

                        <div className="text-gray-600 text-sm mb-5">
                            <span>Home</span> / <span>Dashboard</span> / <span className="font-semibold">Cctv Request</span>
                        </div>

                        <div className="flex justify-between pb-2">
                            <h2 className="text-xl font-semibold mb-4">CCTV Request Form</h2>
                            <Link to="/cctv-request" className="bg-blue-400 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded">
                                Add
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
                            <div className="flex flex-col">
                                <label htmlFor="formDocNo" className="mb-1 font-medium text-gray-700">
                                    Form Doc No
                                </label>
                                <input
                                    id="formDocNo"
                                    type="text"
                                    placeholder="Enter Form Doc No"
                                    className="border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 p-2 w-full rounded-md"
                                    value={formData.formDocNo}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="startDate" className="mb-1 font-medium text-gray-700">
                                    Issue Date
                                </label>
                                <input
                                    id="startDate"
                                    type="date"
                                    className="border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 p-2 w-full rounded-md"
                                    value={formData.issueDate}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="endDate" className="mb-1 font-medium text-gray-700">
                                    End Date
                                </label>
                                <input
                                    id="endDate"
                                    type="date"
                                    className="border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 p-2 w-full rounded-md"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="status" className="mb-1 font-medium text-gray-700">
                                    Status
                                </label>
                                <input
                                    id="status"
                                    type="text"
                                    placeholder="Status"
                                    className="border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 p-2 w-full rounded-md"
                                    value={formData.status}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="branch" className="mb-1 font-medium text-gray-700">
                                    Branch
                                </label>
                                <select
                                    id="branch"
                                    className="border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 p-2 w-full rounded-md"
                                    value={formData.branch}
                                    onChange={handleChange}
                                >
                                    <option>All Branch</option>
                                    <option>Head Office</option>
                                </select>
                            </div>


                            <div className="flex items-end">
                                <button className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500 w-full" onClick={handleSearch}>
                                    Search
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="hidden xl:table min-w-full bg-white border border-gray-200 text-sm">
                                <thead className="bg-gray-100 text-left">
                                    <tr>
                                        <th className="py-2 px-4 border-b">No</th>
                                        <th className="py-2 px-4 border-b">Status</th>
                                        <th className="py-2 px-4 border-b">Document No</th>
                                        <th className="py-2 px-4 border-b">Branch</th>
                                        <th className="py-2 px-4 border-b">Requested By</th>
                                        <th className="py-2 px-4 border-b">Case Date</th>
                                        <th className="py-2 px-4 border-b">Created Date</th>
                                        <th className="py-2 px-4 border-b">Video</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cctvRequests && cctvRequests.map((item, index) => (
                                        <tr key={item.id}>
                                            <td className="py-2 px-4 border-b">{index + 1}.</td>
                                            <td className="py-2 px-4 border-b">
                                                <span className="text-orange-600 bg-orange-100 rounded-full px-3 py-1 text-xs font-semibold">
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-2 px-4 border-b text-blue-600 font-medium cursor-pointer hover:underline">
                                                {/* {item.form_doc_no} */}

                                                <Link to={`/cctv-details/${item.id}`}>
                                                    {item.form_doc_no}
                                                </Link>


                                            </td>
                                            <td className="py-2 px-4 border-b">Branch {item.to_branch}</td>
                                            <td className="py-2 px-4 border-b">Miss. {item.requester_name}</td>
                                            <td className="py-2 px-4 border-b">{item.date}</td>
                                            <td className="py-2 px-4 border-b">{item.created_at.slice(0, 10)}</td>
                                            <td className="py-2 px-4 border-b text-center">
                                                <button className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700">
                                                    {/* Video Icon */}
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="w-4 h-4"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M15 10l4.553 2.276A2 2 0 0121 14.105V15a2 2 0 01-2 2H5a2 2 0 01-2-2v-.895a2 2 0 011.447-1.829L9 10m6 0V5a3 3 0 00-6 0v5m6 0H9"
                                                        />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="xl:hidden space-y-4 mt-4">
                                {cctvRequests && cctvRequests.map((item) => (
                                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                                        <div className="flex flex-col mb-2">
                                            <span className="font-semibold text-gray-700">Status:</span>
                                            <span className="text-orange-600 bg-orange-100 rounded-full px-3 py-1 text-xs font-semibold w-fit">
                                                {item.status}
                                            </span>
                                        </div>
                                        <div className="flex flex-col mb-2">
                                            <span className="font-semibold text-gray-700">Document No:</span>
                                            <span className="text-blue-600 font-medium">{item.form_doc_no}</span>
                                        </div>
                                        <div className="flex flex-col mb-2">
                                            <span className="font-semibold text-gray-700">Branch:</span>
                                            <span>Branch {item.to_branch}</span>
                                        </div>
                                        <div className="flex flex-col mb-2">
                                            <span className="font-semibold text-gray-700">Requested By:</span>
                                            <span>Miss. {item.requester_name}</span>
                                        </div>
                                        <div className="flex flex-col mb-2">
                                            <span className="font-semibold text-gray-700">Case Date:</span>
                                            <span>{item.date}</span>
                                        </div>
                                        <div className="flex flex-col mb-2">
                                            <span className="font-semibold text-gray-700">Created Date:</span>
                                            <span>{item.created_at.slice(0, 10)}</span>
                                        </div>
                                        <div className="flex flex-col mt-3">
                                            <span className="font-semibold text-gray-700">Video:</span>
                                            <button className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700 mt-1 w-fit">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-4 h-4"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M15 10l4.553 2.276A2 2 0 0121 14.105V15a2 2 0 01-2 2H5a2 2 0 01-2-2v-.895a2 2 0 011.447-1.829L9 10m6 0V5a3 3 0 00-6 0v5m6 0H9"
                                                    />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center text-sm text-gray-600 mt-4">Total 1 Rows</div>
                        </div>

                        {/* <div className="navigation">
                            <ul className="inline-flex -space-x-px text-sm">
                                {paginationInfo?.links?.map((link, index) => (
                                    <li key={index}>
                                        <button
                                            onClick={() => {
                                                if (link.url) {
                                                    const url = new URL(link.url);
                                                    const page = url.searchParams.get('page');
                                                    handlePageClick(Number(page));
                                                }
                                            }}
                                            disabled={!link.url}
                                            className={`flex items-center justify-center px-3 h-8 leading-tight
                                    ${link.active ? 'text-gray-600 border border-blue-300 bg-blue-300' : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700'}
                                    ${index === 0 ? 'rounded-s-lg' : ''}
                                    ${index === paginationInfo.links.length - 1 ? 'rounded-e-lg' : ''}
                                `}
                                        >
                                            {link.label === '&laquo; Previous' ? 'Previous' :
                                                link.label === 'Next &raquo;' ? 'Next' : link.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div> */}

                    </div>
                )}


        </>








    )
}
