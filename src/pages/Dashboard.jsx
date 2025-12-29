
import {  useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import dashboardPhoto from "../assets/images/reqBa.png";
import NavPath from "../components/NavPath";
import { countFormNoti, getFormsList } from "../api/commonApi";
const Dashboard = () => {
    const [allForm , setAllForm ] = useState([]) ;
    const [formCounts , setFormCounts] = useState({}) ;
    const [loading , setLoading] = useState(false) ;
    const hasFetchedRef = useRef(false);
    
     useEffect(() => {
    const fetchAllForms = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      // Wait for user to be loaded from localStorage to ensure session is ready
      const waitForUser = () => {
        return new Promise((resolve) => {
          const checkUser = () => {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              try {
                const user = JSON.parse(userStr);
                if (user && user.id) {
                  resolve(user);
                  return;
                }
              } catch (e) {
                // Invalid JSON, continue waiting
              }
            }
            // Retry after 100ms if user not found
            setTimeout(checkUser, 100);
          };
          checkUser();
        });
      };

      try {
        // Wait for user to be available
        await waitForUser();
        
        // Additional delay to ensure backend session is fully initialized
        await new Promise(resolve => setTimeout(resolve, 500));

        const getAllForms = await getFormsList(token);
        const formsData = getAllForms.data.forms || [];
        setAllForm(formsData);

        // Fetch counts - only set if we get a valid response
        const counts = {};
        await Promise.all(
          formsData.map(async (form) => {
            try {
              const count = await countFormNoti(token, form.id);
              // Only set count if it's a valid number (not null/undefined)
              if (typeof count === 'number' && count >= 0) {
                counts[form.id] = count;
              }
              // Don't set anything if count is invalid - let it remain undefined
            } catch (error) {
              console.error(`Error fetching count for form ${form.id}:`, error);
              // Don't set count to 0 on error - leave it undefined
            }
          })
        );

        // Only update counts if we have valid data
        setFormCounts(counts);
        hasFetchedRef.current = true;
      } catch (error) {
        console.error("Error fetching forms or counts:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch once
    if (!hasFetchedRef.current) {
      fetchAllForms();
    }
  }, []);

  // Refetch counts when window gains focus (user might have been away)
  useEffect(() => {
    const handleFocus = async () => {
      const token = localStorage.getItem("token");
      if (!token || !hasFetchedRef.current) return;

      try {
        const counts = {};
        await Promise.all(
          allForm.map(async (form) => {
            try {
              const count = await countFormNoti(token, form.id);
              counts[form.id] = count;
            } catch (error) {
              console.error(`Error refetching count for form ${form.id}:`, error);
              counts[form.id] = formCounts[form.id] || 0; // Keep existing count on error
            }
          })
        );
        setFormCounts(counts);
      } catch (error) {
        console.error("Error refetching counts:", error);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [allForm, formCounts]);
    console.log("Forms>>" , allForm) ;
    const formIcons = {

        "Asset Transfer Form": "📂",
    "Office Use Form": "💼",
    "Asset Damage / Lost Form": "📋",
    "Purchase Request Form": "🛒",
    "Big Damage Issue Form": "📝",
    "Master Data Product Change Form": "📊",
    "Request Discount Form": "💯",
    "New Vendor Create Form": "🆕",
    "Monthly Rotate Form": "📆",
    "Supplier Agreement Form": "📜",
    "Member Issue Form": "🆔",
    "CCTV Request Form": "📹",
    "Stock Adjust Form": "⚙️",
    "Coupon Voucher": "📑",
    }
  const requests = allForm.map((form) => ({
    title:form?.name || '' ,
    icon : formIcons[form?.name] || "" ,
    route: form.route || '' ,
    count : 0 , 
  }))
  console.log("Request Data>>" , requests) ;
    if (loading) {
        return <div className="p-6 text-gray-600">Loading dashboard...</div>;
    }

    return (
        <div className="p-6">
            <div
                className="h-48 w-full bg-cover bg-center rounded-lg shadow-md mb-6"
                style={{ backgroundImage: `url(${dashboardPhoto})` }}
            ></div>

            <NavPath
                segments={[
                    { path: "/dashboard", label: "Home" },
                    { path: "/dashboard", label: "Dashboard" },
                ]}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {allForm.map((form, index) => {
          // Only get count if it exists in formCounts (don't default to 0)
          const count = formCounts[form.id] !== undefined ? formCounts[form.id] : null;
          const icon = formIcons[form.name] || "";
          const isActive =
            form.name === "CCTV Request Form" ||

            form.name === "Big Damage Issue Form" ||
            form.name === "Request Discount Form";


            form.name === "Big Damage Issue Form" ||

            form.name === "Request Discount Form";

          return (
            <Link
              key={index}
              to={`/${form.route?.toLowerCase().replace(/\s+/g, "-")}`}
              className={`relative m-2 border rounded-lg shadow-md p-4 flex items-center space-x-3 transition ${
                isActive
                  ? "bg-white border-blue-300 hover:shadow-lg cursor-pointer"
                  : "bg-gray-300 border-gray-300 opacity-70 cursor-not-allowed"
              }`}
            >
              <span className="text-xl">{icon}</span>
              <span className="font-semibold">{form.name}</span>

             
              {/* Only show badge if count is a valid number and greater than 0 */}
              {count !== null && count > 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  {count}+
                </span>
              )}
            </Link>
          );
        })}
              
            </div>
        </div>
    );
};

export default Dashboard;