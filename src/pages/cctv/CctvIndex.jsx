import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Pusher from 'pusher-js';
import NavPath from '../../components/NavPath';
import StatusBadge from '../../components/ui/StatusBadge';
import { fetchData } from '../../api/FetchApi';
import { useAuth } from '../../context/AuthContext';

export default function CctvIndex() {
    const [cctvRequests, setCctvRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationInfo, setPaginationInfo] = useState(null);
    const [branches, setBranches] = useState([]);
    const { user } = useAuth();
    const userId = user?.id ?? '';
    const [UserNotification, setUserNotification] = useState([]);

    // useEffect(() => {
    //     const pusher = new Pusher("7f54d776052e8e1407bf", {
    //         cluster: "ap1",
    //         encrypted: true,
    //     });

    //     const channel = pusher.subscribe("my-channel");
    //     channel.bind("my-event", (data) => {
    //         console.log("Received notification: ", data.message);
    //         alert(JSON.stringify(data.message));
    //     });

    //     return () => {
    //         pusher.unsubscribe("my-channel");
    //         pusher.disconnect();
    //     };
    // }, []);

    const [formData, setFormData] = useState({
        formDocNo: '',
        issueDate: '',
        endDate: '',
        status: '',
        branch: 'All Branch'
    });

    const token = localStorage.getItem('token');

    const fetchCctvRecords = async (page = 1) => {
        try {

            const response = await fetch(`/api/cctv-records?page=${page}`, {
                method: "GET",
                // mode: "cors",
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


    const fetchBranches = async () => {
        try {
            if (!token) {
                throw new Error('No authentication token found');
            }
            const response = await fetch('/api/branches', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
            });
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setBranches(data);
        } catch (error) {
            console.error('Fetch branches error:', error);
        } finally {
            setLoading(false);
        }
    }

    const handlePageClick = (page) => {
        if (page >= 1 && page <= paginationInfo.last_page) {
            fetchCctvRecords(page);
        }
    };


    useEffect(() => {
        fetchCctvRecords();
        fetchBranches();

        fetchData(`/api/user/notifications/${userId}`, token, 'user unread notification', setUserNotification);
    }, []);

    const form_id = 15;

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.get(`/users/search_notifications/${form_id}`, formData);
        } catch (error) {
            console.error('Error searching:', error);
        }
    }

    const handleChange = (e) => {
        const { id, value } = e.target;
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
                        <NavPath
                            segments={[
                                { path: "/dashboard", label: "Home" },
                                { path: "/dashboard", label: "Dashboard" },
                                { path: "/cctv-index", label: "Cctv Request" }
                            ]}
                        />

                        <div className="flex justify-between pb-2">
                            <h2 className="text-xl font-semibold mb-4">CCTV Request Form</h2>
                            <Link to="/cctv-request" className="text-white font-bold py-2 px-4 rounded cursor-pointer"
                                style={{
                                    backgroundColor: '#2ea2d1',
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}
                            >
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
                                    className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                                    onFocus={(e) => e.target.style.borderColor = '#6fc3df'}
                                    onBlur={(e) => e.target.style.borderColor = '#2ea2d1'}
                                    style={{ borderColor: '#2ea2d1' }}
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
                                    className="border border-blue-500 focus:outline-none p-2 w-full rounded-md"
                                    style={{ borderColor: '#2ea2d1' }}
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
                                    className="border  focus:outline-none p-2 w-full rounded-md"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    style={{ borderColor: '#2ea2d1' }}
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
                                    className="border  focus:outline-none p-2 w-full rounded-md"
                                    value={formData.status}
                                    onChange={handleChange}
                                    style={{ borderColor: '#2ea2d1' }}
                                />
                            </div>

                            <div className="flex flex-col">
                                <label htmlFor="branch" className="mb-1 font-medium text-gray-700">
                                    Branch
                                </label>
                                <select
                                    id="branch"
                                    className="border focus:outline-none p-2 w-full rounded-md"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    style={{ borderColor: '#2ea2d1' }}
                                >
                                    <option>All Branch</option>
                                    <option>Head Office</option>
                                </select>
                            </div>


                            <div className="flex items-end">
                                <button className="text-white px-4 py-2 rounded w-full cursor-pointer" onClick={handleSearch} style={{
                                    backgroundColor: '#2ea2d1',
                                }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}>

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
                                            <td className="py-2 px-4 border-b">
                                                {(paginationInfo.current_page - 1) * paginationInfo.per_page + index + 1}.
                                            </td>
                                            <td className="py-2 px-4 border-b">

                                                <StatusBadge status={item.status} />
                                                {/* <span
                                                    className={`text-orange-600 bg-orange-100 rounded-full px-3 py-1 text-xs font-semibold ${item.status === 'Ongoing'
                                                        ? 'bg-[#fbb193] text-[#e1341e]'
                                                        : item.status === 'BM Approved'
                                                            ? 'bg-[#ffeaab] text-[#e6ac00]'
                                                            : 'bg-gray-200 text-gray-600'
                                                        }`}
                                                >
                                                    {item.status}
                                                </span> */}


                                            </td>
                                            <td className="py-2 px-4 border-b text-blue-600 font-medium cursor-pointer hover:underline">
                                                <Link to={`/cctv-details/${item.id}`}>
                                                    {item.form_doc_no}
                                                    {UserNotification.some(noti =>
                                                        noti.form_id === item.form_id &&
                                                        noti.specific_form_id === item.id &&
                                                        noti.form_doc_no === item.form_doc_no
                                                    ) && (
                                                            <span className="inline-flex items-center justify-center w-3.5 h-3 rounded bg-red-600 text-white text-[10px] leading-none ml-1">
                                                                ...
                                                            </span>
                                                        )}
                                                </Link>
                                            </td>

                                            <td className="py-2 px-4 border-b">Branch {item.to_branch}</td>
                                            <td className="py-2 px-4 border-b">Miss. {item.requester_name}</td>
                                            <td className="py-2 px-4 border-b">{item.date}</td>
                                            <td className="py-2 px-4 border-b">{item.created_at.slice(0, 10)}</td>
                                            <td className="py-2 px-4 border-b text-center">

                                                <button className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700" title={item.asset_type === 1 ? "Camera On" : "Camera Off"}>
                                                    {item.asset_type === 1 || item.asset_type === 'on' ? (
                                                        // Camera ON
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" className="bi bi-camera-video-fill" viewBox="0 0 16 16">
                                                            <path d="M0 5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v.5l3.106-1.553A.5.5 0 0 1 15 4.5v7a.5.5 0 0 1-.894.316L11 10.5V11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5z" />
                                                        </svg>
                                                    ) : (
                                                        // Camera OFF
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" className="bi bi-camera-video-off-fill" viewBox="0 0 16 16">
                                                            <path d="M10.961 12.365 8.596 10H6.5A1.5 1.5 0 0 1 5 8.5V6.404L2.635 4.04a.5.5 0 1 1 .707-.707l11 11a.5.5 0 0 1-.707.707l-2.674-2.674z" />
                                                            <path d="M5 5.121v3.379a.5.5 0 0 0 .5.5h1.379L5 5.121z" />
                                                            <path d="M11 8.5v1.379l-1.121-1.121H11z" />
                                                            <path d="M14 4.833v6.334a.5.5 0 0 1-.854.353L12 10.086V11.5A1.5 1.5 0 0 1 10.5 13H9.121l-1-1H10.5a.5.5 0 0 0 .5-.5V9.879l-6-6V4.5a.5.5 0 0 1 .146.354V4.5a.5.5 0 0 1 .5-.5h3A1.5 1.5 0 0 1 11 5.5v1.586l2.146-2.146a.5.5 0 0 1 .854.353z" />
                                                        </svg>
                                                    )}
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
                                            {/* <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold w-fit ${item.status === 'Ongoing'
                                                    ? 'bg-[#fbb193] text-[#e1341e]'
                                                    : item.status === 'check'
                                                        ? 'bg-[#fedec3] text-[#fb923c]'
                                                        : item.status === 'BM Approved'
                                                            ? 'bg-[#ffeaab] text-[#e6ac00]'
                                                            : 'bg-gray-200 text-gray-600'
                                                    }`}
                                            >
                                                {item.status}
                                            </span> */}
                                            <StatusBadge status={item.status} />
                                        </div>


                                        <div className="flex flex-col mb-2">
                                            <span className="font-semibold text-gray-700">Document No:</span>
                                            <span className="text-blue-600 font-medium flex items-center">
                                                <Link to={`/cctv-details/${item.id}`}>
                                                    {item.form_doc_no}
                                                </Link>

                                                {UserNotification?.some(noti =>
                                                    noti.form_id === item.form_id &&
                                                    noti.specific_form_id === item.id &&
                                                    noti.form_doc_no === item.form_doc_no
                                                ) && (
                                                        <span className="inline-flex items-center justify-center w-3.5 h-3 rounded bg-red-600 text-white text-[10px] leading-none ml-1">
                                                            ...
                                                        </span>
                                                    )}
                                            </span>
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
                                            <span className="font-semibold text-gray-700">Video: {item.asset_type}</span>
                                            <button
                                                className="bg-gray-600 text-white p-2 rounded hover:bg-gray-700 mt-1 w-fit"
                                                title={item.asset_type === 1 || item.asset_type === 'on' ? "Camera On" : "Camera Off"}
                                            >
                                                {item.asset_type === 1 || item.asset_type === 'on' ? (
                                                    // Camera ON
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16"
                                                        height="16"
                                                        fill="white"
                                                        className="bi bi-camera-video-fill"
                                                        viewBox="0 0 16 16"
                                                    >
                                                        <path d="M0 5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v.5l3.106-1.553A.5.5 0 0 1 15 4.5v7a.5.5 0 0 1-.894.316L11 10.5V11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5z" />
                                                    </svg>
                                                ) : (
                                                    // Camera OFF
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="16"
                                                        height="16"
                                                        fill="white"
                                                        className="bi bi-camera-video-off-fill"
                                                        viewBox="0 0 16 16"
                                                    >
                                                        <path d="M10.961 12.365 8.596 10H6.5A1.5 1.5 0 0 1 5 8.5V6.404L2.635 4.04a.5.5 0 1 1 .707-.707l11 11a.5.5 0 0 1-.707.707l-2.674-2.674z" />
                                                        <path d="M5 5.121v3.379a.5.5 0 0 0 .5.5h1.379L5 5.121z" />
                                                        <path d="M11 8.5v1.379l-1.121-1.121H11z" />
                                                        <path d="M14 4.833v6.334a.5.5 0 0 1-.854.353L12 10.086V11.5A1.5 1.5 0 0 1 10.5 13H9.121l-1-1H10.5a.5.5 0 0 0 .5-.5V9.879l-6-6V4.5a.5.5 0 0 1 .146.354V4.5a.5.5 0 0 1 .5-.5h3A1.5 1.5 0 0 1 11 5.5v1.586l2.146-2.146a.5.5 0 0 1 .854.353z" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>

                                    </div>
                                ))}
                            </div>
                            {paginationInfo && (
                                <div className="text-center text-sm text-gray-600 mt-4">
                                    Total {paginationInfo.total} Rows
                                </div>
                            )}
                        </div>

                        <div className="navigation">
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
                                            className={`flex items-center justify-center px-3 h-8 leading-tight cursor-pointer
                    ${link.active ? 'text-gray-600 border border-[#2ea2d1] bg-[#2ea2d1]' : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700'}
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
                        </div>

                    </div >
                )
            }
        </>
    )
}
