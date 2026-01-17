import React, { useState } from "react";
import cctvPhoto from "../../assets/images/ban1.png";
import CctvInput from "./inputs/CctvInput";
import CctvSelect from "./inputs/CctvSelect";
import CctvTextarea from "./inputs/CctvTextarea";
import CctvCheckbox from "./inputs/CctvCheckbox";
import { confirmAlert } from "react-confirm-alert";
import { useNavigate } from "react-router-dom";
import NavPath from "../../components/NavPath";

export default function () {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        start_time: "",
        place: "",
        end_time: "",
        case_type: "",
        record_type: "",
        issue_date: "",
        description: "",
        cctv_record: false,
        form_id: 15,
        layout_id: 14,
        route: "price_changes"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch("/api/cctv-records", {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                credentials: "include",
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 422) {
                    let errorMessages = "";
                    Object.values(data.errors).forEach(errorArray => {
                        errorArray.forEach(error => {
                            errorMessages += `• ${error}\n`;
                        });
                    });
                    confirmAlert({
                        title: "Oops! Please fix these errors",
                        message: errorMessages,
                        buttons: [
                            {
                                label: "OK",
                                onClick: () => { },
                            },
                        ],
                    });
                } else {
                    throw new Error(data.message || "Something went wrong");
                }
            } else {
                confirmAlert({
                    title: "Success",
                    message: "Form submitted successfully!",
                    buttons: [
                        {
                            label: "OK",
                            onClick: () => {
                                navigate("/cctv_record");
                            },
                        },
                    ],
                });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            confirmAlert({
                title: "Error",
                message: "Something went wrong while submitting the form.",
                buttons: [
                    {
                        label: "OK",
                        onClick: () => { },
                    },
                ],
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-4 md:p-6 lg:p-8">

            <NavPath
                segments={[
                    { path: "/dashboard", label: "Home" },
                    { path: "/dashboard", label: "Dashboard" },
                    { path: "/cctv_record", label: "Cctv Request" },
                    { path: "/cctv-request", label: "Cctv Record" },
                    { path: "/cctv-form", label: "Cctv Form" },
                ]}
            />
            <div className="p-4 sm:p-6 bg-white-100 rounded-lg shadow-md w-full">
                <h2 className="text-center text-lg sm:text-xl font-semibold mb-4">
                    Price Change Form
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                >
                
                </form>
            </div>
        </div>
    );
}
