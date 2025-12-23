import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { badgeNoti } from "../api/badgeNoti";
import finalLogo from "../assets/images/finallogo.png";
import { FaBell, FaCheckDouble } from "react-icons/fa";

const Notification = ({ notifications, formBasedCount = null }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
//   const [upperNoti, setUpperNoti] = useState([]);
  const navigate = useNavigate();
 
  const formDataUpperNoti = notifications?.formData ?? [];
  const unreadNotiUpperNoti = upperNoti?.getUnreadNoti ?? [];
  const countNotiUpperNoti = unreadNotiUpperNoti.length;

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <div className="relative cursor-pointer group" onClick={toggleDropdown}>
        <div className="p-2 rounded-full transition-all duration-200 group-hover:bg-blue-50">
          <FaBell className="text-2xl text-gray-700 group-hover:text-blue-600 transition-colors" />
        </div>
        {countNotiUpperNoti > 0 && (
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center 
                                        min-w-[20px] h-5 px-1.5 bg-gradient-to-br from-red-500 to-red-600 
                                        rounded-full border-2 border-white shadow-lg animate-pulse text-white text-xs font-bold"
          >
            {countNotiUpperNoti > 99 ? "99+" : countNotiUpperNoti}
          </span>
        )}
      </div>
      {isDropdownOpen && (
              <>
              
                <div
                  className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9998] lg:hidden"
                  onClick={toggleDropdown}
                ></div>
                <div className="fixed top-16 right-4 sm:absolute sm:top-auto sm:right-0 sm:mt-3 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[9999] animate-slideDown">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-2xl">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800">
                      Notifications
                    </h3>
                    <div className="flex items-center gap-2">
                       {countNotiUpperNoti < 0 ? (
                            <svg
                              className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                          ) : (
                            <FaCheckDouble className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          )}
                    </div>
                  </div>
      
                
                  {countNotiUpperNoti > 0 ? (
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        <ul>
          {unreadNotiUpperNoti.map((noti, index) => {
            const matchedForm = formDataUpperNoti.find(
              (form) => form.id === noti.data.form_id
            );
      
            if (!matchedForm) return null;
      
            return (
              <li
                key={noti.id ?? `${noti.data.form_id}-${index}`}
                className="notification_li"
                style={{
                  padding: 0,
                  margin: 0,
                  height: "130px",
                  cursor: "pointer",
                }}
                onClick={() =>
                  navigate(
                    `/${matchedForm.route}_detail/${noti.data.specific_form_id}`
                  )
                }
              >
                <div className="row" style={{ width: "100%", margin: 0 }}>
                  <h5 className="col-12 noti_header">
                    {matchedForm.name}
                  </h5>
      
                  <div
                    className="container col-12 noti_container"
                    style={{ display: "flex" }}
                  >
                    <img
                      src={finalLogo}
                      alt="logo"
                      style={{
                        objectFit: "contain",
                        width: "70px",
                        height: "70px",
                        borderRadius: "50%",
                      }}
                    />
      
                    <div style={{ display: "block", marginTop: "15px" }}>
                      <span style={{ fontWeight: 600, display: "block" }}>
                        {noti.data.form_doc_no}
                      </span>
      
                      <span className="my-2" style={{ display: "block" }}>
                        {noti.general_status ?? "Pending"}
                      </span>
      
                      <span className="text-primary" style={{ display: "block" }}>
                        {new Date(noti.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
      
                <hr className="dropdown-divider" />
              </li>
            );
          })}
        </ul>
      </div>
      
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 px-6">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <FaBell className="text-3xl text-gray-400" />
                      </div>
                      <p className="text-gray-600 font-medium text-base mb-1">
                        No notifications
                      </p>
                      <p className="text-gray-400 text-sm text-center">
                        You're all caught up! Check back later for updates.
                      </p>
                    </div>
                  )}
                  {/* End conditional rendering */}
      
                  {/* Footer */}
                  <button
                    onClick={toggleDropdown}
                    className="w-full text-center text-blue-600 font-medium text-sm py-2.5 sm:py-3 
                                       hover:bg-blue-50 border-t border-gray-100 rounded-b-2xl 
                                       transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
             <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-slideDown {
                    animation: slideDown 0.2s ease-out;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
    </div>
  );
};

export default Notification;
