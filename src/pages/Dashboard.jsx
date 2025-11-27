
import { useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import dashboardPhoto from "../assets/images/reqBa.png";
import NavPath from "../components/NavPath";
import { NotificationContext } from "../context/NotificationContext"; // ✅
import BigDamageIsuueLogo from "../assets/images/big-dmg-issue-logo.png";

const Dashboard = () => {
    const { notifications, loading } = useContext(NotificationContext); // ✅

<<<<<<< HEAD
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
        setLoading(false);
      }
=======
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
>>>>>>> c2d7396 (big damage issue update)
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
<<<<<<< HEAD
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
              
=======
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
>>>>>>> c2d7396 (big damage issue update)
            </div>
        </div>
    );
};

export default Dashboard;