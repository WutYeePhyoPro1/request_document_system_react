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
            className={`fixed top-0 left-0 h-screen bg-white shadow-lg transition-all duration-300 z-50
            ${isSidebarOpen ? "w-64 translate-x-0" : "w-16 -translate-x-full"}
            md:relative md:w-64 md:translate-x-0`}
        >

            <div className="p-2">
                <div className="relative">
                    <FiSearch className="absolute left-3 top-2 text-gray-400" />
                    <input type="text" placeholder="Search" className="w-full pl-10 p-2 border rounded-md focus:outline-none" />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto">
                <ul className="space-y-1">
                    <li>
                        <Link to="/dashboard" className="flex items-center p-3 hover:bg-gray-100 rounded-md">
                            <AiOutlineDashboard className="text-blue-400" size={20} />
                            <span className="ml-3">Dashboard</span>
                        </Link>
                    </li>
                    {[
                        { name: "Asset", icon: FaBox },
                        { name: "Office Use", icon: FaUsers },
                        { name: "Merchandise", icon: FaShoppingCart },
                        { name: "Security", icon: FaShieldAlt },
                        { name: "Big Damage Issue", icon: FaBook }
                    ].map((item) => (
                        <li key={item.name}>
                            <button onClick={() => toggleMenu(item.name)} className="flex items-center justify-between w-full p-3 hover:bg-gray-100 rounded-md">
                                <div className="flex items-center">
                                    <item.icon className="text-blue-400" size={20} />
                                    <span className="ml-3">{item.name}</span>
                                </div>
                                {(openMenus[item.name] ? <FiChevronUp /> : <FiChevronDown />)}
                            </button>
                            {openMenus[item.name] && (
                                <ul className="ml-6 text-gray-600">
                                    <li className="p-2 hover:text-purple-700">Submenu 1</li>
                                    <li className="p-2 hover:text-purple-700">Submenu 2</li>
                                </ul>
                            )}
                        </li>
                    ))}

                    <li>
                        <button onClick={() => toggleMenu("User Guide")} className="flex items-center justify-between w-full p-3 hover:bg-gray-100 rounded-md">
                            <div className="flex items-center">
                                <FiInfo className="text-blue-400" size={20} />
                                {<span className="ml-3">User Guide</span>}
                            </div>
                            {(openMenus["User Guide"] ? <FiChevronUp /> : <FiChevronDown />)}
                        </button>
                        {openMenus["User Guide"] && (
                            <ul className="ml-6 text-gray-600">
                                <li className="p-2 hover:text-purple-700">Help</li>
                                <li className="p-2 hover:text-purple-700">Support</li>
                            </ul>
                        )}
                    </li>
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
