import { useState } from "react";
import { AiOutlineDashboard } from "react-icons/ai";
import { FaBox, FaUsers, FaShieldAlt, FaBook, FaShoppingCart } from "react-icons/fa";
import { FiChevronDown, FiChevronUp, FiSearch, FiInfo } from "react-icons/fi";
import { Link } from "react-router-dom";

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const [openMenus, setOpenMenus] = useState({});
    const toggleMenu = (menu) => {
        setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
    };

    return (
        <div
            className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-lg transition-all duration-300 z-50
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        md:relative md:translate-x-0 flex flex-col`}
        >
            {/* Search bar */}
            <div className="p-2 mt-6">
                <div className="relative">
                    <FiSearch className="absolute left-3 top-2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full pl-10 p-2 border rounded-md focus:outline-none"
                    />
                </div>
            </div>

            {/* Scrollable nav section */}
            <nav className="flex-1 overflow-y-auto mt-2">
                <ul className="space-y-1">
                    {/* Dashboard */}
                    <li>
                        <Link to="/dashboard" className="flex items-center p-3 hover:bg-gray-100 rounded-md">
                            <AiOutlineDashboard className="text-blue-400" size={20} />
                            <span className="ml-3">Dashboard</span>
                        </Link>
                    </li>

                    {/* Other Menus */}
                    {[
                        { name: "Asset", icon: FaBox, disabled: true },
                        { name: "Office Use", icon: FaUsers, disabled: false }, // ✅ enabled now
                        { name: "Merchandise", icon: FaShoppingCart, disabled: true },
                        { name: "Security", icon: FaShieldAlt, disabled: true },
                        { name: "Big Damage Issue", icon: FaBook, disabled: true },
                    ].map((item) => (
                        <li key={item.name}>
                            <button
                                onClick={() => !item.disabled && toggleMenu(item.name)}
                                className={`flex items-center justify-between w-full p-3 rounded-md ${item.disabled
                                    ? "bg-gray-50 text-gray-400 cursor-not-allowed opacity-50"
                                    : "hover:bg-gray-100"
                                    }`}
                                disabled={item.disabled}
                            >
                                <div className="flex items-center">
                                    <item.icon className="text-blue-400" size={20} />
                                    <span className="ml-3">{item.name}</span>
                                </div>
                                {!item.disabled && (
                                    openMenus[item.name] ? <FiChevronUp /> : <FiChevronDown />
                                )}
                            </button>

                            {/* Dropdown for Office Use */}
                            {item.name === "Office Use" && openMenus[item.name] && (
                                <ul className="ml-6 text-gray-600">
                                    <li>
                                        <Link
                                            to="/office-use"
                                            className="block p-2 hover:text-purple-700"
                                        >
                                            Office Use
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/purchase-request"
                                            className="block p-2 hover:text-purple-700"
                                        >
                                            Purchase Request
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/office-use-purchase-request"
                                            className="block p-2 hover:text-purple-700"
                                        >
                                            Big Damage Issue
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/office-use-purchase-request"
                                            className="block p-2 hover:text-purple-700"
                                        >
                                            Monthly Rotate
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/office-use-purchase-request"
                                            className="block p-2 hover:text-purple-700"
                                        >
                                            Stock Adjust
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </li>
                    ))}

                    {/* User Guide */}
                    <li>
                        <button
                            onClick={() => { }}
                            disabled
                            className="flex items-center justify-between w-full p-3 rounded-md bg-gray-50 text-gray-400 cursor-not-allowed opacity-50"
                        >
                            <div className="flex items-center">
                                <FiInfo className="text-blue-300" size={20} />
                                <span className="ml-3">User Guide</span>
                            </div>
                            <FiChevronDown />
                        </button>
                    </li>
                </ul>
            </nav>


        </div>
    );



};

export default Sidebar;




