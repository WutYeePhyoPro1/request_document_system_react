
import {  useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dashboardPhoto from "../assets/images/reqBa.png";
import NavPath from "../components/NavPath";
import { countFormNoti, getFormsList } from "../api/commonApi";
const Dashboard = () => {
    const [allForm , setAllForm ] = useState([]) ;
    const [formCounts , setFormCounts] = useState({}) ;
    const [loading , setLoading] = useState(false) ;
     useEffect(() => {
    const fetchAllForms = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        setLoading(false);
        return;
      }

      try {
        const getAllForms = await getFormsList(token);
        const formsData = getAllForms.data.forms || [];
        setAllForm(formsData);

        const counts = {};
        await Promise.all(
          formsData.map(async (form) => {
            const count = await countFormNoti(token, form.id);
            counts[form.id] = count;
          })
        );

        setFormCounts(counts);
      } catch (error) {
        console.error("Error fetching forms or counts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllForms();
  }, []);
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
          const count = formCounts[form.id] || 0;
          const icon = formIcons[form.name] || "";
          const isActive =
            form.name === "CCTV Request Form" ||
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
              <span className="font-semibold">{form.name}{count}</span>

             
              {count > 0 && (
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