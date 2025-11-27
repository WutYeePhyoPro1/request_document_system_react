
import { useContext, useMemo, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import dashboardPhoto from "../assets/images/reqBa.png";
import NavPath from "../components/NavPath";
import { NotificationContext } from "../context/NotificationContext"; // ✅
import BigDamageIsuueLogo from "../assets/images/big-dmg-issue-logo.png";
import { countFormNoti, getFormsList } from "../api/commonApi";

const Dashboard = () => {
    const { notifications, loading } = useContext(NotificationContext); // ✅
    const [allForm, setAllForm] = useState([]);
    const [formCounts, setFormCounts] = useState({});
    const [loadingForms, setLoadingForms] = useState(false);

    useEffect(() => {
        const fetchAllForms = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                console.error("No token found");
                setLoadingForms(false);
                return;
            }

            try {
                const getAllForms = await getFormsList(token);
                const formsData = getAllForms.data.forms || [];
                setAllForm(formsData);

                // Batch count requests with delay to prevent rate limiting
                // Process 3 forms at a time with 200ms delay between batches
                const counts = {};
                const batchSize = 3;
                const delayBetweenBatches = 200; // milliseconds
                
                for (let i = 0; i < formsData.length; i += batchSize) {
                    const batch = formsData.slice(i, i + batchSize);
                    
                    // Process batch in parallel
                    await Promise.all(
                        batch.map(async (form) => {
                            try {
                                const count = await countFormNoti(token, form.id);
                                counts[form.id] = count || 0;
                            } catch (error) {
                                // Handle 429 errors gracefully - set count to 0 and continue
                                if (error?.response?.status === 429) {
                                    console.warn(`Rate limited for form ${form.id}, skipping count`);
                                    counts[form.id] = 0;
                                } else {
                                    console.error(`Error fetching count for form ${form.id}:`, error);
                                    counts[form.id] = 0;
                                }
                            }
                        })
                    );
                    
                    // Add delay between batches (except for the last batch)
                    if (i + batchSize < formsData.length) {
                        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                    }
                }

                setFormCounts(counts);
            } catch (error) {
                console.error("Error fetching forms or counts:", error);
            } finally {
                setLoadingForms(false);
            }
        };

        fetchAllForms();
    }, []);

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
    };

    if (loading || loadingForms) {
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