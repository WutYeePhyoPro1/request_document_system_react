import { useParams } from 'react-router-dom';
import dashboardPhoto from "../../assets/images/reqBa.png";

export default function CctvDetails() {
    const { id } = useParams();

    return (
        <div>


            <div className="p-6 bg-white shadow-md rounded-lg" >
                <div
                    className="h-48 w-full bg-cover bg-center rounded-lg shadow-md mb-6"
                    style={{ backgroundImage: `url(${dashboardPhoto})` }}
                ></div>

                <h1>CCTV Details Page</h1>
                <p>Item ID: {id}</p>

            </div>


        </div>
    );
}

// import { useParams } from 'react-router-dom';
// import dashboardPhoto from "../../assets/images/reqBa.png";

// export default function CctvDetails() {
//     const { id } = useParams();

//     return (
//         <div className="p-6">
//             {/* Breadcrumb Navigation */}
//             <div className="mb-6 text-sm text-gray-500">
//                 Home / Notifications / CCTV Request Form
//             </div>

//             {/* Main Container */}
//             <div className="bg-white shadow-md rounded-lg p-6">
//                 {/* Header Section */}

//                 <div
//                     className="h-48 w-full bg-cover bg-center rounded-lg shadow-md mb-6"
//                     style={{ backgroundImage: `url(${dashboardPhoto})` }}
//                 ></div>

//                 <div className="flex justify-between items-start mb-8">
//                 <div>
//                     <h1 className="text-2xl font-bold mb-2">
//                         CCTV Request Form(CCTVH020250426-0001)
//                     </h1>
//                     <div className="text-gray-500">Ordering</div>
//                 </div>
//                 <div className="text-right">
//                     <div className="font-semibold">26-04-2025</div>
//                 </div>
//             </div>

//             {/* Main Table */}
//             <table className="w-full border-collapse">
//                 <tbody>
//                     {/* Time Details Row */}
//                     <tr className="border-b">
//                         <td className="p-3 text-gray-500 w-1/6">Detail</td>
//                         <td className="p-3 font-medium w-1/6">0</td>
//                         <td className="p-3 text-gray-500 w-1/6">Start Time</td>
//                         <td className="p-3 font-medium w-1/6">4:30 PM</td>
//                         <td className="p-3 text-gray-500 w-1/6">End Time</td>
//                         <td className="p-3 font-medium w-1/6">5:30 PM</td>
//                     </tr>

//                     {/* Case Details Row */}
//                     <tr className="border-b">
//                         <td className="p-3 text-gray-500">Case Date</td>
//                         <td className="p-3 font-medium">2015-04-24</td>
//                         <td className="p-3 text-gray-500">Case Type</td>
//                         <td className="p-3 font-medium col-span-3">
//                             Customer Complain - customer
//                         </td>
//                     </tr>

//                     {/* Location Details Row */}
//                     <tr className="border-b">
//                         <td className="p-3 text-gray-500">Place</td>
//                         <td className="p-3 font-medium">R room</td>
//                         <td className="p-3 text-gray-500">Branch</td>
//                         <td className="p-3 font-medium">Head Office</td>
//                     </tr>

//                     {/* Record Details Row */}
//                     <tr className="border-b">
//                         <td className="p-3 text-gray-500">Record Type</td>
//                         <td className="p-3 font-medium">Phone Camera</td>
//                         <td className="p-3 text-gray-500">Replay Date</td>
//                         <td className="p-3 font-medium">26-04-2025</td>
//                     </tr>

//                     {/* Description Row */}
//                     <tr className="border-b">
//                         <td className="p-3 text-gray-500 align-top">Description</td>
//                         <td className="p-3 font-medium" colSpan="5">
//                             yes yes yes
//                         </td>
//                     </tr>

//                     {/* Staff Section */}
//                     <tr>
//                         <td className="p-3 text-gray-500 align-top">Staff/Symptoms</td>
//                         <td className="p-3 font-medium" colSpan="2">
//                             Miss.Wat. Yee Plyce<br />
//                             (System Development)<br />
//                             2015-04-28 13:34:42
//                         </td>
//                         <td className="p-3 text-gray-500 align-top">Approved by</td>
//                         <td className="p-3 font-medium">BMJ ABM</td>
//                         <td className="p-3 text-gray-500 align-top">Checked by</td>
//                         <td className="p-3 font-medium">Branch IT</td>
//                         <td className="p-3 text-gray-500 align-top">Advised by</td>
//                         <td className="p-3 font-medium">SD Manager</td>
//                     </tr>
//                 </tbody>
//             </table>
//         </div>
//         </div >
//     );
// }
