import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { badgeNoti } from "../api/badgeNoti";
import finalLogo from "../assets/images/finallogo.png";
import { FaBell, FaCheckDouble } from "react-icons/fa";

const Notification = ({ notifications, formBasedCount = null }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [upperNoti, setUpperNoti] = useState([]);
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchNoti = async () => {
      try {
        const response = await badgeNoti(token);
        // Log response shape for debugging
        // eslint-disable-next-line no-console
        console.log('[Notification] badgeNoti response:', response);

        // Normalize incoming shape
        const incomingFormData = Array.isArray(response) ? [] : response.formData || [];
        const incomingNoti = Array.isArray(response) ? response : response.getUnreadNoti || [];

        setUpperNoti((prev) => {
          // If incoming is empty but we already have notifications, preserve existing state
          if ((!incomingNoti || incomingNoti.length === 0) && prev && prev.getUnreadNoti && prev.getUnreadNoti.length > 0) {
            // eslint-disable-next-line no-console
            console.log('[Notification] preserving existing notifications because incoming badge response is empty');
            return prev;
          }

          // Merge notifications by id to avoid duplicates
          const mergedNotiMap = new Map();
          (prev?.getUnreadNoti || []).forEach((n) => mergedNotiMap.set(n.id || JSON.stringify(n), n));
          (incomingNoti || []).forEach((n) => mergedNotiMap.set(n.id || JSON.stringify(n), n));
          const mergedNoti = Array.from(mergedNotiMap.values());

          // Merge formData by id
          const mergedFormMap = new Map();
          (prev?.formData || []).forEach((f) => mergedFormMap.set(f.id || JSON.stringify(f), f));
          (incomingFormData || []).forEach((f) => mergedFormMap.set(f.id || JSON.stringify(f), f));
          const mergedFormData = Array.from(mergedFormMap.values());

          return { formData: mergedFormData, getUnreadNoti: mergedNoti };
        });
      } catch (error) {
        console.error(error);
      }
    };

    fetchNoti();
  }, []);
  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };
  const formDataUpperNoti = upperNoti?.formData ?? [];
  const unreadNotiUpperNoti = upperNoti?.getUnreadNoti ?? [];
  const countNotiUpperNoti = unreadNotiUpperNoti.length;
const handleNotiClick = (path) => {
  setIsDropdownOpen(false); // close dropdown
  navigate(path);          // navigate
};
// console.log("FormUpperNoti>>" , formDataUpperNoti);
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
    {/* Overlay */}
    <div
      className="fixed inset-0 bg-black/20 z-[9998]"
      onClick={toggleDropdown}
    />

    {/* Dropdown */}
    <div className="fixed top-16 right-4 w-[360px] bg-white rounded-xl shadow-xl border z-[9999]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-blue-50 rounded-t-xl">
        <h3 className="font-semibold text-gray-800">Notifications</h3>
        <FaCheckDouble className="text-blue-600" />
      </div>

      {/* List */}
      <div className="max-h-[420px] overflow-y-auto">
        {countNotiUpperNoti > 0 ? (
          unreadNotiUpperNoti.map((noti, index) => {
            const matchedForm = formDataUpperNoti.find((form) => {
              try {
                return Number(form.id) === Number(noti.data.form_id);
              } catch (e) {
                return form.id === noti.data.form_id;
              }
            });
            if (!matchedForm) {

              console.warn('[Notification] unmatched noti, formDataUpperNoti:', formDataUpperNoti, 'noti:', noti);
            }
            if (!matchedForm) return null;

            return (
              <div
                key={index}
                onClick={() =>
                  handleNotiClick(
                    `/${matchedForm.route}_detail/${noti.data.specific_form_id}`
                  )
                }
                className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b"
              >
                {/* Icon */}
                <img
                  src={finalLogo}
                  alt="logo"
                  className="w-9 h-9 rounded-full object-contain"
                />

                {/* Content */}
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-800">
                    {matchedForm.name}
                  </p>

                  <p className="text-xs text-gray-600 mt-0.5">
                    {noti.data.form_doc_no}
                  </p>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(noti.created_at).toLocaleDateString()}
                    </span>

                    {/* Status badge */}
                    {(() => {
                      // Determine a user-friendly display status, mapping backend statuses to clearer labels
                      const rawStatus = noti.general_status || noti.data?.general_status || noti.data?.status || "Checked";
                      const normalized = (rawStatus || "").toString().toLowerCase().trim();
                      let displayStatus = rawStatus;
                      // Map Ac_Acknowledged -> Operation Manager Approved
                      if (normalized === "ac_acknowledged" || normalized === "ac acknowledged" || normalized === "ac_ack") {
                        displayStatus = "Operation Manager Approved";
                      }
                      // Other normalization could go here if needed
                      return (
                        <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-600 font-medium">
                          {displayStatus}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center text-gray-500 text-sm">
            No notifications
          </div>
        )}
      </div>

      {/* Footer */}
      <button
        onClick={toggleDropdown}
        className="w-full py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-b-xl"
      >
        Close
      </button>
    </div>
  </>
)}

    </div>
  );
};

export default Notification;
