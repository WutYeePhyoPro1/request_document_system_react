import { Link } from "react-router-dom";
import dashboardPhoto from "../assets/images/reqBa.png";

const Dashboard = () => {
    // Example request categories (can be dynamic)
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
            {/* Background Section */}
            <div
                className="h-48 w-full bg-cover bg-center rounded-lg shadow-md mb-6"
                style={{ backgroundImage: `url(${dashboardPhoto})` }}
            ></div>

            {/* Breadcrumbs */}
            <div className="text-gray-600 text-sm mb-4">
                <span>Home</span> / <span className="font-semibold">Dashboard</span>
            </div>

            {/* Request Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {requests.map((req, index) => (
                    <Link
                        key={index}
                        to={`/${req.title.toLowerCase().replace(/\s+/g, "-")}`}
                        className="relative bg-white border border-blue-300 rounded-lg shadow-md p-4 flex items-center space-x-3 hover:shadow-lg transition"
                    >
                        <span className="text-xl">{req.icon}</span>

                        <span className="font-semibold">{req.title}</span>

                        {req.count > 0 && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                {req.count}+
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
