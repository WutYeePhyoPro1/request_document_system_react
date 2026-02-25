import React from "react";
import { FaSpinner } from "react-icons/fa";

export default function FullPageLoader() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sms">
            <div className="flex flex-col items-center gap-3">
                <FaSpinner className="text-blue-600 text-5xl animate-spin" />
                <span className="text-white text-sm font-medium">
                    Loading...
                </span>
            </div>
        </div>
    );
}
