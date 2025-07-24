import { Link, useLocation, useParams } from 'react-router-dom';
import dashboardPhoto from "../../assets/images/reqBa.png";
import { FiCopy } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import NavPath from '../../components/NavPath';
import { useAuth } from '../../context/AuthContext';
import { fetchData } from '../../api/FetchApi';
import { confirmAlert } from 'react-confirm-alert';
import { useNavigate } from "react-router-dom";
import CctvUploadVideo from './inputs/CctvUploadVideo';
import StatusBadge from '../../components/ui/StatusBadge';
import CctvDownloadVideo from './inputs/CctvDownloadVideo';

export default function CctvDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);
    const [recordDetails, setRecordDetails] = useState(null);
    const [originalData, setOriginatorData] = useState(null);
    const [approverData, setApproverData] = useState(null);
    const [cctvData, setCctvData] = useState(null);
    const cctvId = cctvData?.[0]?.id;
    const [approvalProcessUser, setApprovalProcessUser] = useState(null);
    const [videoRecord, setVideoRecord] = useState(false);
    const [isApprover, setIsApprover] = useState(false);
    const [isBranchITApprover, setIsBranchITApprover] = useState(false);
    const [acknowledgerData, setAcknowledgerData] = useState(false);
    const [managerData, setManagerData] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const form_id = 15;
    const layout_id = 14;
    const general_form_id = recordDetails?.id ?? '';
    const actualUserId = user?.id;
    const route = "cctv_record";
    const [remark, setRemark] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [action, setAction] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const [IsVideoDownloadOpen, setIsVideoDownloadOpen] = useState(false);
    const [showAlert, setShowAlert] = useState(true);
    const [CancelData, setCancelData] = useState(null);
    const [loading, setLoading] = useState(true);

    const location = useLocation();
    const fromSearch = location.state?.fromSearch;
    const searchPayload = location.state?.searchPayload;
    const formData = location.state?.formData;


    console.log(fromSearch, searchPayload, formData);



    const checkApprover = () => {
        if (!recordDetails || !approvalProcessUser || recordDetails.status !== 'Ongoing') return false;
        const isSpecialRemark = ['change form', 'create brand', 'create category'].includes(recordDetails.g_remark);
        const checkerType = isSpecialRemark ? 'CS' : 'C';
        const checker = approvalProcessUser.find(u => u.user_type === checkerType);
        const statusConditions = (
            (checker && recordDetails.status === 'Checked') ||
            (!checker && ['Ongoing', 'Ongoing(Edit)'].includes(recordDetails.status)) ||
            (checker && recordDetails.status === 'Ongoing' && recordDetails.g_remark === 'office_use')
        );
        if (statusConditions) {
            const currentUser = approvalProcessUser.find(u =>
                u.user_type === 'A1' &&
                u.general_form_id === recordDetails.id &&
                u.admin_id === actualUserId
            );
            const isUserApprover = user?.role_id === 3;
            return currentUser && isUserApprover;
        }
        return false;
    };

    // ဒီ approver() ဆိုတဲ့ function ဟာ လက်ရှိအသုံးပြုသူ (logged-in user) က တစ်ခုတည်းသော form တွင် အတည်ပြုသူ (Approver) ဖြစ်ခွင့်ရှိ/မရှိကို စစ်ဆေးတဲ့ function တစ်ခုပါ။ ပထမဦးဆုံးအနေဖြင့် function သည် ပေးထားသော data ထဲမှ general_form_id ကို ယူပြီး ApprovalProcessUser ထဲမှ user_type က A1 ဖြစ်တဲ့ အသုံးပြုသူ (Checker) ကိုလက်ရှိ login ဝင်ထားသူဖြစ်မဖြစ်စစ်သည်။ ထို့နောက် $data->g_remark တန်ဖိုးပေါ်မူတည်ပြီး checker ကို CS (change form, create brand/category မျိုး) သို့မဟုတ် C ဟု သတ်မှတ်သည်။ ထိုအချိန်တွင် $checker ရှိ/မရှိနှင့် $data->status တန်ဖိုးအပေါ်မူတည်ပြီး အသုံးပြုသူက Approver ဖြစ်နိုင်မည့်အခြေအနေများကို စစ်တင်သည်။ ထိုအခြေအနေများမှာ – checker ရှိပြီး status က Checked ဖြစ်ခြင်း၊ checker မရှိဘဲ status က Ongoing သို့မဟုတ် Ongoing(Edit) ဖြစ်ခြင်း၊ သို့မဟုတ် checker ရှိပြီး status က Ongoing ဖြစ်ပြီး remark က office_use ဖြစ်ခြင်း – တို့ဖြစ်သည်။ ထို့နောက် User table ထဲမှ လက်ရှိအသုံးပြုသူ၏ role_id ကိုယူပြီး၊ ထို user က Role table ထဲမှာ Approver ဟုအမည်ပေးထားသော role ကိုပိုင်ဆိုင်ထားသည့် ID နှင့် တူ/မတူစစ်သည်။ နောက်ဆုံးတွင်၊ လက်ရှိ user သည် process ထဲမှ A1 user ဖြစ်ပြီး Approver role ကို ပိုင်ဆိုင်ထားသည်ဆိုပါက true ကို return ပြန်ပါသည်။ မမှန်ပါက return မရှိတော့ function သည် null ပြန်နိုင်သည်။ ဒီ logic ဟာ လက်ရှိ user က form တစ်စောင်အတွက် Approver ဖြစ်နိုင်မလားဆိုတာဖော်ထုတ်ရန် အသုံးပြုသည်။



    const checkBranchITApprover = () => {
        if (!recordDetails || !approvalProcessUser || recordDetails.status !== 'BM Approved') return false;
        const current_user = approvalProcessUser.find(
            u => u.user_type === 'ACK' &&
                u.general_form_id === recordDetails.id &&
                u.admin_id === user.id
        );
        const isBranchITUser = user?.role_id === 8;
        return current_user && isBranchITUser;
    };

    // လက်ရှိဖောင်ကို ACK အဖြစ်ချဲ့သွင်းခံထားရတဲ့ Branch IT user ဖြစ်လား ?
    //     ဆိုတာစစ်တာဖြစ်ပါတယ်။
    // အကယ်၍ ဒါမှန်ခဲ့ရင်တော့ true ပြန်တယ်၊ မဟုတ်ရင် false ပြန်တယ်။

    const checkManager = () => {
        if (!recordDetails || !approvalProcessUser || recordDetails.status !== 'Approved') return false;
        const current_user = approvalProcessUser.find(
            u => u.user_type === 'A2' &&
                u.general_form_id === recordDetails.id &&
                u.admin_id === user.id
        );
        const isManager = user?.role_id === 3;
        return current_user && isManager;
    }

    // လက်ရှိ user ဟာ လက်ရှိဖောင် process ထဲမှာ A2 အဖြစ်ပါဝင်ပြီး၊ သူ့ရဲ့ role က Approver(Manager) ဖြစ်လား ?ဖြစ်တယ်ဆိုရင် true ပြန်တယ်။ မဟုတ်ရင် false ပြန်တယ်။

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!id || !token) return;
        setLoading(true); // <-- Start loading
        fetchData(`/api/cctv-records/${id}`, token, 'record details', (recordData) => {
            setRecordDetails(recordData);
            fetchData(
                `/api/cctv-records/fetch-originator/${id}`,
                token,
                'originator details',
                setOriginatorData
            );
            if (recordData.status === "Ongoing" || "BM Approved") {
                fetchData(
                    `/api/cctv-records/fetch-approver/${id}`,
                    token,
                    'approver details',
                    setApproverData
                );
            }
            if (recordData.status === "Ongoing" || "BM Approved" || recordData.status === "Approved") {
                fetchData(
                    `/api/cctv-records/fetch-acknowledger/${id}`,
                    token,
                    'acknowledger details',
                    setAcknowledgerData
                );
            }

            if (recordData.status === "Completed") {
                fetchData(
                    `/api/cctv-records/fetch-manager/${id}`,
                    token,
                    'Manager details',
                    setManagerData
                );
            }

            if (recordData.status === "Cancel") {
                fetchData(
                    `/api/cctv-records/fetch-cancel/${id}`,
                    token,
                    'Cancel details',
                    setCancelData
                );
            }
            setLoading(false);
        });
    }, [id]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!recordDetails?.id || !token) return;
        const general_form_id = recordDetails.id;
        fetchData(`/api/cctv_record/${route}/${form_id}/${layout_id}/${general_form_id}/detail`, token, 'details cctvform', setCctvData);
        fetchData(`/api/approval-process-users/${general_form_id}`, token, 'approval process users', setApprovalProcessUser);
        fetchData(`/api/video-record/${general_form_id}`, token, 'cctv record', setVideoRecord);
    }, [recordDetails]);

    useEffect(() => {
        setIsApprover(checkApprover());
        setIsBranchITApprover(checkBranchITApprover());
        setIsManager(checkManager());
    }, [recordDetails, approvalProcessUser, user]);

    function formatDateTime(isoString) {
        const date = new Date(isoString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', '');
    }

    const handleSubmit = async (submitStatus) => {
        setIsSubmitting(true);
        const token = localStorage.getItem('token');
        try {
            const url = `/api/users/cctv_record/${form_id}/${layout_id}/${general_form_id}/approve?route=${route}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    comment: remark,
                    actual_user_id: actualUserId,
                    status: submitStatus,
                    action: action
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle validation errors like video.required
                if (data.errors) {
                    const errorMessages = Object.values(data.errors).flat().join('\n');
                    confirmAlert({
                        title: "Validation Error",
                        message: errorMessages,
                        buttons: [{ label: "OK" }],
                    });
                } else {
                    confirmAlert({
                        title: "Error",
                        message: data.message || 'Failed to submit',
                        buttons: [{ label: "OK" }],
                    });
                }
                return;
            }

            // Success case
            confirmAlert({
                title: "Success",
                message: "Form submitted successfully!",
                buttons: [
                    {
                        label: "OK",
                        onClick: () => {
                            navigate("/cctv-index");
                        },
                    },
                ],
            });

        } catch (error) {
            confirmAlert({
                title: "Unexpected Error",
                message: error.message || 'An unexpected error occurred',
                buttons: [{ label: "OK" }],
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // const handleDownloadPdf = async () => {
    //     try {
    //         const response = await fetch(`/api/users/${recordDetails.id}/print`, {
    //             method: 'GET',
    //             headers: {
    //                 'Authorization': `Bearer ${localStorage.getItem('token')}`, // if protected
    //                 'Accept': 'application/pdf',
    //             }
    //         });

    //         if (!response.ok) {
    //             throw new Error('Failed to download PDF');
    //         }

    //         const blob = await response.blob();
    //         const url = window.URL.createObjectURL(blob);

    //         const link = document.createElement('a');
    //         link.href = url;
    //         link.download = `${recordDetails.form_doc_no || 'document'}.pdf`;
    //         document.body.appendChild(link);
    //         link.click();
    //         document.body.removeChild(link);
    //         window.URL.revokeObjectURL(url);
    //     } catch (error) {
    //         console.error("Download error:", error);
    //         alert("Failed to download PDF.");
    //     }
    // };

    const handleApprove = () => handleSubmit('Approved');
    const handleBTP = () => handleSubmit('Back To Previous');
    const handleCancel = () => handleSubmit('Cancel');
    const handleNeedEdit = () => handleSubmit('Need To Edit');
    const handleBMApprove = () => handleSubmit('BM Approved');
    const handleComplete = () => handleSubmit('Completed');
    const ApproveBackToPrevious = () => handleSubmit('Back To Previous');

    const formDocno = recordDetails?.form_doc_no ? recordDetails.form_doc_no : '';
    const handleCopy = () => {
        navigator.clipboard.writeText(formDocno)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
            });
    };

    function formatTime(time) {
        if (!time) return '-';
        const [hour, minute] = time.split(':');
        const date = new Date();
        date.setHours(hour);
        date.setMinutes(minute);
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }

    function formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB');
    }

    function renderCaseType(caseType) {
        switch (caseType) {
            case 1: return 'Check Process - လုပ်ငန်းစဉ်ကို စစ်ဆေးခြင်း';
            case 2: return 'Customer Complain - customer တိုင်ကြားခြင်းအကြောင်းအရာများ';
            case 3: return 'Accident Case - မတော်တဆဖြစ်ရပ်များ စစ်ဆေးခြင်း';
            case 4: return 'HR Case - HR နှင်ပတ်သတ်သောဖြစ်ရပ်များ စစ်ဆေးခြင်း';
            case 5: return 'Stolen Case - ခိုးယူမူ နှင့်သက်ဆိုင်သော ဖြစ်ရပ်များ စစ်ဆေးခြင်း';
            default: return 'Other - အခြားအကြောင်းအရာများ စစ်ဆေးခြင်း';
        }
    }

    const openVideoDownloadModal = () => {
        setIsVideoDownloadOpen(true);
    }

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

                    <div className="p-4 sm:p-6">
                        {isBranchITApprover && isOpen && (
                            <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
                                    <div className="border-b-4 border-red-500 p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-gray-800">
                                                CCTV Form တွင် ပြင်ဆင်ထားသည့်အချက်များ
                                            </h3>
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="text-gray-500 hover:text-gray-700 transition-colors"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-6 w-6"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M6 18L18 6M6 6l12 12"
                                                    />
                                                </svg>
                                            </button>
                                        </div>

                                        <div className="space-y-3 text-gray-700 mb-6">
                                            <p>
                                                1. <strong>video record</strong> ယူခြင်း မယူခြင်းများကို သက်ဆိုင်ရာ{' '}
                                                <strong>Branch IT</strong> များပြင်ဆင်နိုင်ခြင်း
                                            </p>
                                            <p>
                                                2. <strong>Case Type</strong> ရွေးချယ်ခြင်းများကို{' '}
                                                <strong>SD Manager</strong> နှင့် သက်ဆိုင်ရာ{' '}
                                                <strong>Branch IT</strong> များပြင်ဆင်နိုင်ခြင်း
                                            </p>
                                            <p>
                                                3. အထက်ဖော်ပြပါ အဆင့်များကို approve မပေးရသေးသောအချိန်တွင် သာပြုလုပ်ပေးပါရန်
                                            </p>
                                        </div>

                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                                            >
                                                Close
                                            </button>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        )}

                        <div
                            className="h-48 w-full bg-cover bg-center rounded-lg shadow-md mb-6"
                            style={{ backgroundImage: `url(${dashboardPhoto})` }}
                        >
                        </div>
                        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-6">
                            <NavPath
                                segments={[
                                    { path: "/dashboard", label: "Dashboard" },
                                    { path: "/cctv-index", label: "Cctv Request" },
                                    { path: `/cctv-details/${id}`, label: "Cctv Details" }
                                ]}
                            />

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                                <h2 className="text-base sm:text-lg font-semibold">
                                    CCTV Request Form({recordDetails?.form_doc_no ? recordDetails.form_doc_no : ''})
                                    <button
                                        onClick={handleCopy}
                                        className={`ml-2 px-2 py-1 text-xs rounded transition-all ${copied
                                            ? 'text-green-600 bg-green-50'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 cursor-pointer'
                                            }`}
                                        title={copied ? "Copied!" : "Copy ID"}
                                        disabled={copied}
                                    >
                                        {copied ? 'Copied!' : <FiCopy className="w-4 h-4" />}
                                    </button>
                                    <StatusBadge status={recordDetails?.status ? recordDetails.status : ''} />


                                </h2>
                                <div className="text-gray-600 text-sm sm:text-base">
                                    {recordDetails?.created_at ? formatDate(recordDetails.created_at) : ''}
                                </div>
                            </div>

                            <div className="mb-6">
                                <h3 className="font-medium mb-2">Detail ❶</h3>
                                <div className="overflow-x-auto">


                                    <table className="hidden xl:table  min-w-full border text-xs sm:text-sm">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border p-1 sm:p-2">No</th>
                                                <th className="border p-1 sm:p-2">Start Time</th>
                                                <th className="border p-1 sm:p-2">End Time</th>
                                                <th className="border p-1 sm:p-2">Case Date</th>
                                                <th className="border p-1 sm:p-2 hidden sm:table-cell">Case Type</th>
                                                <th className="border p-1 sm:p-2">Place</th>
                                                <th className="border p-1 sm:p-2 hidden md:table-cell">Branch</th>
                                                <th className="border p-1 sm:p-2 hidden lg:table-cell">Record Type</th>
                                                <th className="border p-1 sm:p-2 hidden xl:table-cell">Description</th>
                                                <th className="border p-1 sm:p-2 hidden md:table-cell">Replay Date</th>
                                                <th className="border p-1 sm:p-2 hidden lg:table-cell">Record Video</th>
                                                {/* {isApprover || isBranchITApprover || user?.employee_number === '000-000024' && (
                                        <th className="border p-1 sm:p-2 hidden lg:table-cell">Action</th>
                                    )} */}
                                                {(isApprover || isBranchITApprover || user?.employee_number === '000-000024') && (
                                                    <th className="border p-1 sm:p-2 hidden lg:table-cell">Action</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cctvData?.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td className="border p-1 sm:p-2">
                                                        {index + 1}
                                                        <input type="hidden" name="specific_form_id[]" value={item.id} />
                                                    </td>
                                                    <td className="border p-1 sm:p-2">
                                                        {formatTime(item.start_time)}
                                                    </td>
                                                    <td className="border p-1 sm:p-2">
                                                        {formatTime(item.end_time)}
                                                    </td>
                                                    <td className="border p-1 sm:p-2">
                                                        {item.issue_date}
                                                    </td>
                                                    <td className="border p-1 sm:p-2 hidden sm:table-cell">
                                                        {renderCaseType(item.case_type)}
                                                    </td>
                                                    <td className="border p-1 sm:p-2">{item.place}</td>
                                                    <td className="border p-1 sm:p-2 hidden md:table-cell">

                                                        {item?.branch_name || '-'}
                                                    </td>
                                                    <td className="border p-1 sm:p-2 hidden lg:table-cell">
                                                        {item.record_type && item.record_type !== 'null' ? item.record_type : '-'}
                                                    </td>
                                                    <td className="border p-1 sm:p-2 hidden xl:table-cell">
                                                        {item.description}
                                                    </td>
                                                    <td className="border p-1 sm:p-2 hidden md:table-cell">
                                                        {formatDate(item.created_at)}
                                                    </td>

                                                    {videoRecord?.exists && (
                                                        (user?.role_id === 3 && recordDetails?.from_branch !== '1') ||
                                                        (user?.role_id === 3 && recordDetails?.from_branch === '1' && user?.department_id === recordDetails?.from_department) ||
                                                        (user?.employee_number === '000-000548')
                                                    ) ? (
                                                        <td className="text-center">
                                                            <button
                                                                onClick={() => setIsVideoDownloadOpen(true)}
                                                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                                                            >
                                                                <i className="bi bi-cloud-arrow-down-fill mr-1"></i>
                                                                Download video
                                                            </button>
                                                        </td>
                                                    ) : (
                                                        <td className="text-center">-</td>
                                                    )}

                                                    {(isApprover || isBranchITApprover || user?.employee_number === '000-000024') && (
                                                        <td className="border p-1 sm:p-2 hidden lg:table-cell">
                                                            <Link
                                                                to={`/cctv-edit/${item.id}`}
                                                                className="text-white font-bold py-1 px-3 rounded cursor-pointer text-sm"
                                                                style={{
                                                                    backgroundColor: '#2ea2d1',
                                                                }}
                                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#6fc3df'}
                                                                onMouseLeave={(e) => e.target.style.backgroundColor = '#2ea2d1'}
                                                            >
                                                                Edit
                                                            </Link>
                                                        </td>
                                                    )}

                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {IsVideoDownloadOpen && (
                                        <CctvDownloadVideo
                                            empId={user?.employee_number}
                                            id={general_form_id}
                                            onClose={() => setIsVideoDownloadOpen(false)}
                                        />
                                    )}


                                    <div className="lg:hidden space-y-4 mt-4 font-medium text-sm sm:text-base">
                                        {cctvData?.map((item, index) => (
                                            <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">No:</span>
                                                    <span>{index + 1}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Start Time:</span>
                                                    <span>{formatTime(item.start_time)}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">End Time:</span>
                                                    <span>{formatTime(item.end_time)}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Case Date:</span>
                                                    <span>{item.issue_date}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Case Type:</span>
                                                    <span>{renderCaseType(item.case_type)}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Place:</span>
                                                    <span>{item.place}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Branch:</span>
                                                    <span>{item.branch_name || '-'}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Record Type:</span>
                                                    <span>{item.record_type && item.record_type !== 'null' ? item.record_type : '-'}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Description:</span>
                                                    <span>{item.description}</span>
                                                </div>

                                                <div className="flex flex-col mb-2">
                                                    <span className="font-semibold text-gray-700">Replay Date:</span>
                                                    <span>{formatDate(item.created_at)}</span>
                                                </div>

                                                <div className="flex flex-col mt-2">
                                                    <span className="font-semibold text-gray-700">Record Video:</span>

                                                </div>

                                                {videoRecord?.exists && (
                                                    (user?.role_id === 3 && recordDetails?.from_branch !== '1') ||
                                                    (user?.role_id === 3 && recordDetails?.from_branch === '1' && user?.department_id === recordDetails?.from_department) ||
                                                    (user?.employee_number === '000-000548')
                                                ) ? (

                                                    <span className="text-gray-800">

                                                        <button
                                                            onClick={() => setIsVideoDownloadOpen(true)}
                                                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                        >
                                                            <i className="bi bi-cloud-arrow-down-fill mr-1"></i>
                                                            Download video
                                                        </button>
                                                    </span>


                                                ) : (
                                                    <span className="text-gray-800"> - </span>
                                                )}

                                                {(isApprover || isBranchITApprover || user?.employee_number === '000-000024') && (
                                                    <div className="flex flex-col mt-2">
                                                        <span className="font-semibold text-gray-700">Action:</span>
                                                        <Link
                                                            to={`/cctv-edit/${item.id}`}
                                                            className="bg-[#2ea2d1] text-white font-semibold py-1 px-3 rounded w-fit hover:bg-[#6fc3df]"
                                                        >
                                                            Edit
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>


                                </div>
                            </div>
                            <div className="mb-6">

                                {/* အထွေထွေဖောင် BM Approved ဖြစ်ပြီး၊ CCTV Record ကို on လုပ်ထားသည့်အချိန်တွင်သာ —
                    လက်ရှိ user က Branch IT ဖြစ်ရမယ်။
                    ဒီသုံးချက်အမှန်ဖြစ်မှသာ
                    ➡ "Upload" button တစ်ခုပြတယ်
                    ➡ ဖိုင်တင်ဖို့ Modal ဖွင့်ခေါ်မယ်
                    ➡ အနီရောင်သတိပေးစာပါပြတယ်။ */}

                                {isBranchITApprover &&
                                    recordDetails.status === 'BM Approved' &&
                                    cctvData?.[0]?.cctv_record === 'on' && (
                                        <CctvUploadVideo
                                            recordId={cctvData?.[0]?.id}
                                            generalId={general_form_id}
                                            docNo={formDocno}
                                        />
                                    )}

                                <div>
                                    {isBranchITApprover &&
                                        recordDetails.status === 'BM Approved' &&
                                        cctvData?.[0]?.cctv_record === 'on' && (
                                            <>
                                                <span className="text-red-500 text-sm"></span>
                                                {/* {errors.video} */}
                                                <span className="text-red-500 text-sm">**record vedio ယူခြင်း / မယူခြင်း များကို Action button တွင်ပြင်ဆင်နိုင်ပါသည်**</span>
                                            </>
                                        )}
                                </div>


                                {isApprover && (
                                    <div className="mb-6">
                                        <h4 className="font-medium mb-2">Remark</h4>
                                        <textarea
                                            value={remark}
                                            onChange={(e) => setRemark(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Write remark about this and please be careful not more than 200 characters."
                                            rows={3}
                                            maxLength={200}
                                        />
                                        <div className="mt-2">
                                            <button
                                                onClick={handleBMApprove}
                                                disabled={isSubmitting}
                                                className="bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-4 rounded cursor-pointer"
                                            >
                                                {isSubmitting ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded ml-2 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {isBranchITApprover && (
                                    <div className="mb-6">
                                        <h4 className="font-medium mb-2">Remark</h4>
                                        <textarea
                                            value={remark}
                                            onChange={(e) => setRemark(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Write remark about this and please be careful not more than 200 characters."
                                            rows={3}
                                            maxLength={200}
                                        />
                                        <div className="mt-2">
                                            <button
                                                onClick={handleApprove}
                                                disabled={isSubmitting}
                                                className="bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-4 rounded cursor-pointer"
                                            >
                                                {isSubmitting ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded ml-2 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* isManager */}

                                {isManager && (
                                    <div className="mb-6">
                                        <h4 className="font-medium mb-2">Remark</h4>
                                        <textarea
                                            value={remark}
                                            onChange={(e) => setRemark(e.target.value)}
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Write remark about this and please be careful not more than 200 characters."
                                            rows={3}
                                            maxLength={200}
                                        />
                                        <div className="mt-2">
                                            <button
                                                onClick={handleComplete}
                                                disabled={isSubmitting}
                                                className="bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-4 rounded cursor-pointer"
                                            >
                                                {isSubmitting ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                className="bg-red-400 hover:bg-red-500 text-white font-bold py-2 px-4 rounded ml-2 cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                            {route === 'cctv_record' && isManager && recordDetails?.status === 'Approved' && (
                                                <button
                                                    onClick={ApproveBackToPrevious}
                                                    className="bg-yellow-400 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded ml-2 cursor-pointer"
                                                >
                                                    Back to Previous
                                                </button>
                                            )}

                                        </div>
                                    </div>
                                )}

                            </div>


                            {recordDetails?.status === 'Cancel' && (
                                <>
                                    {showAlert && CancelData && (
                                        <div className="flex flex-row">
                                            <div
                                                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative w-full"
                                                role="alert"
                                            >
                                                <span className="block sm:inline">
                                                    This form was rejected by <span className="font-bold">{CancelData.title}{CancelData.name}</span>
                                                </span>
                                                <button
                                                    type="button"
                                                    className="absolute top-0 bottom-0 right-0 px-4 py-3 focus:outline-none cursor-pointe"
                                                    onClick={() => setShowAlert(false)}
                                                    aria-label="Close"
                                                >
                                                    <svg
                                                        className="fill-current h-6 w-6 text-red-500"
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        viewBox="0 0 20 20"
                                                    >
                                                        <title>Close</title>
                                                        <path d="M14.348 5.652a1 1 0 0 0-1.414 0L10 8.586 7.066 5.652a1 1 0 1 0-1.414 1.414L8.586 10l-2.934 2.934a1 1 0 1 0 1.414 1.414L10 11.414l2.934 2.934a1 1 0 0 0 1.414-1.414L11.414 10l2.934-2.934a1 1 0 0 0 0-1.414z" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}



                                    {recordDetails.cancel_form?.file && (
                                        <>
                                            <div className="mt-4">
                                                <img
                                                    src={`/storage/uploads/cancel_form/${recordDetails.cancel_form.file}`}
                                                    alt="Cancelled Form Attachment"
                                                    className="w-full max-w-lg mx-auto rounded shadow"
                                                />
                                            </div>
                                            <div className="mt-4">
                                                <img
                                                    src={`/storage/uploads/cancel_form/${recordDetails.cancel_form.file}`}
                                                    alt="Cancelled Form Attachment"
                                                    className="w-full max-w-lg mx-auto rounded shadow"
                                                />
                                            </div>
                                        </>
                                    )}
                                </>
                            )}


                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 mt-6">
                                <div className="border p-3 sm:p-4 rounded">
                                    <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">Staff/Eyewitness</h4>
                                    {/* {recordDetails?.status === "Ongoing" && ( */}
                                    <>
                                        <p className="text-xs sm:text-sm">
                                            {originalData?.title ? `${originalData.title}.` : ''}
                                            {originalData?.name ? originalData.name : ''}
                                        </p>
                                        <p className="text-xs sm:text-sm">
                                            ({originalData?.department ? originalData.department : ''})
                                        </p>
                                        <p className="text-gray-500 text-xs">
                                            {originalData?.created_at ? formatDateTime(originalData.created_at) : ''}
                                        </p>
                                    </>
                                    {/* )} */}
                                </div>


                                <div className="border p-3 sm:p-4 rounded">
                                    <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">
                                        {(approverData &&
                                            (
                                                recordDetails?.status === 'BM Approved' ||
                                                recordDetails?.status === 'Approved' ||
                                                recordDetails?.status === 'Received' ||
                                                recordDetails?.status === 'Acknowledged' ||
                                                recordDetails?.status === 'Completed' ||
                                                (recordDetails?.status === 'Cancel' && approverData?.status !== 'Cancel')
                                            ))
                                            ? 'Approved By'
                                            : 'Approved By BM / ABM'}
                                    </h4>

                                    {approverData && (
                                        recordDetails?.status === 'BM Approved' ||
                                        recordDetails?.status === 'Approved' ||
                                        recordDetails?.status === 'Received' ||
                                        recordDetails?.status === 'Acknowledged' ||
                                        recordDetails?.status === 'Completed' ||
                                        (recordDetails?.status === 'Cancel' && approverData?.status !== 'Cancel')
                                    ) ? (
                                        <>
                                            <p className="text-xs sm:text-sm">
                                                {approverData?.title ? `${approverData.title}.` : ''}
                                                {approverData?.name ?? ''}
                                            </p>
                                            <p className="text-xs sm:text-sm">
                                                ({approverData?.department ?? ''})
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {approverData?.created_at ? formatDateTime(approverData.created_at) : ''}
                                            </p>
                                            {approverData?.comment && (
                                                <p className="text-info italic text-xs sm:text-sm">
                                                    "{approverData.comment}"
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-muted text-xs sm:text-sm opacity-25">
                                            -
                                        </p>
                                    )}
                                </div>

                                <div className="border p-3 sm:p-4 rounded">
                                    <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">
                                        {(acknowledgerData &&
                                            (
                                                recordDetails?.status === 'Approved' ||
                                                recordDetails?.status === 'Completed' ||
                                                (recordDetails?.status === 'Cancel' && acknowledgerData?.status !== 'Cancel')
                                            ))
                                            ? 'Checked By'
                                            : 'Checked by Branch IT'}
                                    </h4>

                                    {(acknowledgerData &&
                                        (
                                            recordDetails?.status === 'Approved' ||
                                            recordDetails?.status === 'Completed' ||
                                            (recordDetails?.status === 'Cancel' && acknowledgerData?.status !== 'Cancel')
                                        )) ? (
                                        <>
                                            <p className="text-xs sm:text-sm">
                                                {acknowledgerData?.title ? `${acknowledgerData.title}.` : ''}
                                                {acknowledgerData?.name ?? ''}
                                            </p>
                                            <p className="text-xs sm:text-sm">
                                                ({acknowledgerData?.department ?? ''})
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {acknowledgerData?.created_at ? formatDateTime(acknowledgerData.created_at) : ''}
                                            </p>
                                            {acknowledgerData?.comment && (
                                                <p className="text-info italic text-xs sm:text-sm">
                                                    "{acknowledgerData.comment}"
                                                </p>
                                            )}

                                        </>
                                    ) : (
                                        <p className="text-muted text-xs sm:text-sm opacity-25">
                                            -
                                        </p>
                                    )}
                                </div>


                                <div className="border p-3 sm:p-4 rounded">
                                    <h4 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">
                                        {(managerData &&
                                            (
                                                recordDetails?.status === 'Completed' ||
                                                (recordDetails?.status === 'Cancel' && managerData?.status !== 'Cancel')
                                            ))
                                            ? 'Acknowledged By'
                                            : 'Acknowledged by SD Manager'}
                                    </h4>

                                    {(managerData &&
                                        (
                                            recordDetails?.status === 'Completed' ||
                                            (recordDetails?.status === 'Cancel' && managerData?.status !== 'Cancel')
                                        )) ? (
                                        <>
                                            <p className="text-xs sm:text-sm">
                                                {managerData?.title ? `${managerData.title}.` : ''}
                                                {managerData?.name ?? ''}
                                            </p>
                                            <p className="text-xs sm:text-sm">
                                                {managerData?.department ?? ''}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {managerData?.created_at ? formatDateTime(managerData.created_at) : ''}
                                            </p>
                                            {managerData?.comment && (
                                                <p className="text-info italic text-xs sm:text-sm">
                                                    "{managerData.comment}"
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-muted text-xs sm:text-sm opacity-25">
                                            -
                                        </p>
                                    )}
                                </div>

                            </div>

                            {/* <Link
                                to="/cctv-index"
                                className="inline-flex px-3 py-1 sm:px-4 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 items-center text-sm sm:text-base"
                            >
                                <span className="mr-1 sm:mr-2">←</span> Back
                            </Link> */}

                            <Link
                                to="/cctv-index"
                                state={{
                                    restoreSearch: true,
                                    searchPayload,
                                    formData,
                                }}
                                className="inline-flex px-3 py-1 sm:px-4 sm:py-2 bg-gray-200 rounded hover:bg-gray-300 items-center text-sm sm:text-base"
                            >
                                <span className="mr-1 sm:mr-2">←</span> Back
                            </Link>


                            {/* {(recordDetails?.status === "Acknowledged" || recordDetails?.status === "Completed") && (
                    <a
                        href={`/users/${recordDetails.id}/print`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex px-3 py-1 sm:px-4 sm:py-2 ml-3 rounded text-white items-center text-sm sm:text-base"
                        style={{ backgroundColor: "#D75E28" }}
                    >
                        Download Pdf aa
                    </a>
                )} */}

                            {/* {(recordDetails?.status === "Acknowledged" || recordDetails?.status === "Completed") && (
                                <button
                                    // onClick={handleDownloadPdf}
                                    className="inline-flex px-3 py-1 sm:px-4 sm:py-2 ml-3 rounded text-white items-center text-sm sm:text-base"
                                    style={{ backgroundColor: "#D75E28" }}
                                >
                                    <i className="bi bi-download mr-2"></i>
                                    Download PDF
                                </button>
                            )} */}





                        </div>
                    </div >

                )

            }

        </>
    );
}