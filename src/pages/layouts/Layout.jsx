// import React, { useState } from 'react'
// import { Link, Outlet } from 'react-router-dom'
// import { AiOutlineHome, AiOutlineFileText, AiOutlineLogout } from "react-icons/ai";
// import Sidebar from '../../components/Siderbar';
// import Navbar from '../../components/Navbar';
// // import { GetNotification } from '../GetNotification';


// export default function Layout() {
//     const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//     const toggleSidebar = () => {
//         setIsSidebarOpen(!isSidebarOpen);
//     };

//     return (
//         <div className="flex min-h-screen flex-col">
//             {/* <GetNotification /> */}
//             <Navbar toggleSidebar={toggleSidebar} />
//             <div className="flex flex-grow">
//                 <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
//                 <div className="flex-grow p-3">
//                     <Outlet />
//                 </div>
//             </div>
//             <footer className="bg-[#A9D8E9] text-gray text-center py-4">
//                 <p className="text-sm">
//                     &copy; {new Date().getFullYear()} Pro1 Global Home Center. All rights reserved.
//                 </p>
//             </footer>
//         </div>

//     )
// }


import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext' // ✅ Import AuthProvider
import Sidebar from '../../components/Siderbar'
import Navbar from '../../components/Navbar'
// import { GetNotification } from '../GetNotification'

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    return (
        <AuthProvider>
            <div className="flex min-h-screen flex-col">
                {/* <GetNotification /> */}
                <Navbar toggleSidebar={toggleSidebar} />
                <div className="flex flex-grow">
                    <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                    <div className="flex-grow p-3">
                        <Outlet />
                    </div>
                </div>
                <footer className="bg-[#A9D8E9] text-gray text-center py-4">
                    <p className="text-sm">
                        &copy; {new Date().getFullYear()} Pro1 Global Home Center. All rights reserved.
                    </p>
                </footer>
            </div>
        </AuthProvider>
    )
}
