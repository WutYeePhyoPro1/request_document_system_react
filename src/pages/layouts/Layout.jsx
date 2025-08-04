
// import React, { useState } from 'react'
// import { Outlet } from 'react-router-dom'
// import { AuthProvider } from '../../context/AuthContext' // ✅ Import AuthProvider
// import Sidebar from '../../components/Siderbar'
// import Navbar from '../../components/Navbar'


// export default function Layout() {
//     const [isSidebarOpen, setIsSidebarOpen] = useState(true)
//     const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

//     return (
//         <AuthProvider>
//             <div className="flex min-h-screen flex-col">
//                 {/* <GetNotification /> */}
//                 <Navbar toggleSidebar={toggleSidebar} />
//                 <div className="flex flex-grow">
//                     <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
//                     <div className="flex-grow p-3">
//                         <Outlet />
//                     </div>
//                 </div>
//                 <footer className="bg-[#A9D8E9] text-gray text-center py-4">
//                     <p className="text-sm">
//                         &copy; {new Date().getFullYear()} Pro1 Global Home Center. All rights reserved.
//                     </p>
//                 </footer>
//             </div>
//         </AuthProvider>
//     )
// }


import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../../context/AuthContext'
import Sidebar from '../../components/Siderbar'
import Navbar from '../../components/Navbar'

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    return (
        <AuthProvider>
            <div className="h-screen flex flex-col">
                {/* Navbar at top */}
                <Navbar toggleSidebar={toggleSidebar} />

                {/* Sidebar + Page content */}
                <div className="flex flex-1 overflow-hidden">
                    <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

                    <div className="flex-1 overflow-y-auto p-3">
                        <Outlet />
                    </div>
                </div>

                {/* Footer */}
                <footer className="bg-[#A9D8E9] text-gray text-center py-2">
                    <p className="text-sm">
                        &copy; {new Date().getFullYear()} Pro1 Global Home Center. All rights reserved.
                    </p>
                </footer>
            </div>
        </AuthProvider>
    )
}
