import { useState } from "react";
import { AiOutlineDashboard } from "react-icons/ai";
import { FaBox, FaUsers, FaShieldAlt, FaBook, FaShoppingCart } from "react-icons/fa";
import { FiChevronDown, FiChevronUp, FiSearch, FiInfo } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isSidebarOpen, toggleSidebar }) => {
    const { t } = useTranslation();
    const [openMenus, setOpenMenus] = useState({});
    const toggleMenu = (menu) => {
        setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
    };

    return (
        <div
            className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-lg transition-all duration-300 z-50
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 flex flex-col`}
        >

            <div className="p-2 mt-6">
                <div className="relative">
                    <FiSearch className="absolute left-3 top-2 text-gray-400" />
                    <input
                        type="text"
                        placeholder={t('sidebar.search')}
                        className="w-full pl-10 p-2 border rounded-md focus:outline-none"
                    />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto mt-2">
                <ul className="space-y-1">
                    <li>
                        <Link to="/dashboard" className="flex items-center p-3 hover:bg-gray-100 rounded-md">
                            <AiOutlineDashboard className="text-blue-400" size={20} />
                            <span className="ml-3">{t('sidebar.dashboard')}</span>
                        </Link>
                    </li>

                    <li>
                        <Link to="/big_damage_issue" className="flex items-center p-3 hover:bg-gray-100 rounded-md">
                            <FaBook className="text-blue-400" size={20} />
                            <span className="ml-3">{t('sidebar.bigDamageIssue')}</span>
                        </Link>
                    </li>

                    {[
                        { name: t('sidebar.asset'), key: "asset", icon: FaBox, disabled: true },
                        { name: t('sidebar.officeUse'), key: "officeUse", icon: FaUsers, disabled: true },
                        { name: t('sidebar.merchandise'), key: "merchandise", icon: FaShoppingCart, disabled: true },
                        { name: t('sidebar.security'), key: "security", icon: FaShieldAlt, disabled: true },
                    ].map((item) => (
                        <li key={item.key}>
                            <button
                                onClick={() => !item.disabled && toggleMenu(item.key)}
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
                                {openMenus[item.key] ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                            {!item.disabled && openMenus[item.key] && (
                                <ul className="ml-6 text-gray-600">
                                    <li className="p-2 hover:text-purple-700">Submenu 1</li>
                                    <li className="p-2 hover:text-purple-700">Submenu 2</li>
                                </ul>
                            )}
                        </li>
                    ))}


                    <li>
                        <button
                            onClick={() => { }}
                            disabled
                            className="flex items-center justify-between w-full p-3 rounded-md bg-gray-50 text-gray-400 cursor-not-allowed opacity-50"
                        >
                            <div className="flex items-center">
                                <FiInfo className="text-blue-300" size={20} />
                                <span className="ml-3">{t('sidebar.userGuide')}</span>
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




