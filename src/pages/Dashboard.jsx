import { Link } from "react-router-dom";
import dashboardPhoto from "../assets/images/reqBa.png";
import { useEffect, useState } from "react";
import NavPath from "../components/NavPath";



const Dashboard = () => {

    const [notifications, setNotifications] = useState([]);
    useEffect(() => {
        const storedNotifications = localStorage.getItem('notifications');
        if (storedNotifications) {
            try {
                setNotifications(JSON.parse(storedNotifications));
            } catch (error) {
                console.error("Error parsing notifications:", error);
            }
        }
    }, []);


    const requests = [
        { title: "HR Salary Deduct", icon: "💲", count: 0 },
        { title: "Asset Transfer", icon: "📂", count: 1 },
        { title: "Office Use", icon: "💼", count: 1 },
        { title: "Asset Damage / Lost", icon: "📋", count: 1 },
        { title: "Purchase Request", icon: "🛒", count: 19 },
        { title: "Big Damage Issue", icon: "📝", count: 2 },
        { title: "Master Data Product Change", icon: "📊", count: 68 },
        { title: "Request Discount", icon: "💯", count: 0 },
        { title: "New Vendor Create", icon: "🆕", count: 1 },
        { title: "Monthly Rotate", icon: "📆", count: 0 },
        { title: "Supplier Agreement", icon: "📜", count: 0 },
        { title: "Member Issue", icon: "🆔", count: 0 },
        { title: "CCTV Index", icon: "📹", count: 0 },
        { title: "Stock Adjust", icon: "⚙️", count: 0 },
        { title: "Big Damage (Other income sell)", icon: "📑", count: 0 },
    ];

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
                {requests.map((req, index) => (
                    <Link
                        key={index}
                        to={`/${req.title.toLowerCase().replace(/\s+/g, "-")}`}
                        className={`relative m-2 border rounded-lg shadow-md p-4 flex items-center space-x-3 transition
                ${req.title === "CCTV Index"
                                ? "bg-white border-blue-300 hover:shadow-lg cursor-pointer"
                                : "bg-gray-300 border-gray-300 opacity-70 cursor-not-allowed"}`}
                    >
                        <span className="text-xl">{req.icon}</span>
                        <span className="font-semibold">{req.title}</span>


                        {notifications.length > 0 && req.title === "CCTV Index" && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                {notifications.length}+
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;