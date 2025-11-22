
import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import dashboardPhoto from "../assets/images/reqBa.png";
import NavPath from "../components/NavPath";
import { NotificationContext } from "../context/NotificationContext"; // ✅
import BigDamageIsuueLogo from "../assets/images/big-dmg-issue-logo.png";

const Dashboard = () => {
    const { notifications, loading } = useContext(NotificationContext); // ✅

    // Map form titles to form_ids (matching Laravel database)
    // This mapping should match the forms table in the database
    const formIdMap = {
        "HR Salary Deduct": null, // Need to find form_id
        "Asset Transfer": null, // Need to find form_id
        "Office Use": null, // Need to find form_id
        "Asset Damage / Lost": 1, // Based on code references
        "Purchase Request": null, // Need to find form_id
        "Big Damage Issue": 8, // Confirmed: form_id = 8
        "Master Data Product Change": null, // Need to find form_id
        "Request Discount": 10, // Confirmed: form_id = 10
        "New Vendor Create": null, // Need to find form_id
        "Monthly Rotate": null, // Need to find form_id
        "Supplier Agreement": null, // Need to find form_id
        "Member Issue": null, // Need to find form_id
        "CCTV Index": 15, // Confirmed: form_id = 15
        "Stock Adjust": null, // Need to find form_id
        "Big Damage (Other income sell)": null, // Need to find form_id
    };

    const requests = [
        { title: "HR Salary Deduct", icon: "💲", formId: formIdMap["HR Salary Deduct"] },
        { title: "Asset Transfer", icon: "📂", formId: formIdMap["Asset Transfer"] },
        { title: "Office Use", icon: "💼", formId: formIdMap["Office Use"] },
        { title: "Asset Damage / Lost", icon: "📋", formId: formIdMap["Asset Damage / Lost"] },
        { title: "Purchase Request", icon: "🛒", formId: formIdMap["Purchase Request"] },
        { title: "Big Damage Issue", icon: "📝", img: BigDamageIsuueLogo, formId: formIdMap["Big Damage Issue"] },
        { title: "Master Data Product Change", icon: "📊", formId: formIdMap["Master Data Product Change"] },
        { title: "Request Discount", icon: "💯", formId: formIdMap["Request Discount"] },
        { title: "New Vendor Create", icon: "🆕", formId: formIdMap["New Vendor Create"] },
        { title: "Monthly Rotate", icon: "📆", formId: formIdMap["Monthly Rotate"] },
        { title: "Supplier Agreement", icon: "📜", formId: formIdMap["Supplier Agreement"] },
        { title: "Member Issue", icon: "🆔", formId: formIdMap["Member Issue"] },
        { title: "CCTV Index", icon: "📹", formId: formIdMap["CCTV Index"] },
        { title: "Stock Adjust", icon: "⚙️", formId: formIdMap["Stock Adjust"] },
        { title: "Big Damage (Other income sell)", icon: "📑", formId: formIdMap["Big Damage (Other income sell)"] },
    ];

    // Calculate counts for each request (matching Laravel countNotification function)
    const requestsWithCounts = useMemo(() => {
        // Function to count notifications by form_id
        const countNotification = (formId) => {
            if (!formId || !notifications || notifications.length === 0) {
                return 0;
            }
            
            // Count notifications where form_id matches
            // Handle both string and number form_id values
            return notifications.filter(noti => {
                const notiFormId = typeof noti.form_id === 'string' 
                    ? parseInt(noti.form_id, 10) 
                    : noti.form_id;
                return notiFormId === formId;
            }).length;
        };

        return requests.map(req => ({
            ...req,
            count: req.formId ? countNotification(req.formId) : 0
        }));
    }, [notifications]);

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
                {requestsWithCounts.map((req, index) => (
                    <Link
                        key={index}
                        to={`/${req.title.toLowerCase().replace(/\s+/g, "-")}`}
                        className={`relative m-2 border rounded-lg shadow-md p-4 flex items-center space-x-3 transition
                            ${req.title === "CCTV Index" || req.title === "Request Discount" || req.title === "Big Damage Issue"
                                ? "bg-white border-blue-300 hover:shadow-lg cursor-pointer"
                                : "bg-gray-300 border-gray-300 opacity-70 cursor-not-allowed"}`}
                    >
                          <span className="text-xl">
                        {req.img ? (
                            <img src={req.img} alt={req.title} className="w-8 h-8 object-contain" />
                        ) : (
                            req.icon
                        )}
                        </span>
                        <span className="font-semibold">{req.title}</span>

                        {/* Show count badge if count > 0, matching Laravel blade style */}
                        {req.count > 0 && (
                            <span className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                +{req.count}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
