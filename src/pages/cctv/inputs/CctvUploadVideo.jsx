import React, { useState } from 'react'
import { confirmAlert } from 'react-confirm-alert';
import { useNavigate } from 'react-router-dom';

export default function CctvUploadVideo({ recordId, generalId, docNo }) {
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isUploaded, setIsUploaded] = useState(false);

    const openUploadModal = () => {
        setIsModalOpen(true);
    }

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleVideoSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('record_id', recordId);
        formData.append('general_id', generalId);
        formData.append('video', docNo);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch("/api/cctv-records/upload-video", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await response.json();
            if (response.ok) {
                confirmAlert({
                    title: 'Success',
                    text: 'Video uploaded successfully!',
                    icon: 'success',
                    confirmButtonText: 'OK',
                    willClose: () => {
                        navigate("/cctv-index");
                    }
                });
                setIsUploaded(true);
                closeModal();
            } else if (response.status === 409) {
                confirmAlert({
                    title: 'A video for this record already exists',
                    text: result.message,
                    icon: 'warning',
                    confirmButtonText: 'OK'
                });
            } else {
                confirmAlert({
                    title: 'Error',
                    text: error.message || 'Something went wrong while uploading the video',
                    icon: 'error',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            confirmAlert({
                title: 'Error',
                text: error.message || 'Something went wrong while uploading the video',
                icon: 'error',
                confirmButtonText: 'OK'
            });
        }
    };

    return (
        <>
            <button
                type="button"
                className="shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] bg-green-500 border border-green-600 text-white px-4 py-2 rounded-lg mb-4 text-lg hover:bg-green-600 transition-colors cursor-pointer"
                onClick={openUploadModal}
            >
                <i className="bi bi-upload mr-1"></i>
                <span>Upload</span>
            </button>
            <span className="ml-3 font-bold text-red-500">**please upload record video file here **</span>

            {isModalOpen && (
                <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-md">
                        <div className="p-6">
                            <div className="flex justify-between items-center border-b pb-3 mb-4">
                                <h3 className="text-lg font-semibold">Upload Record Video</h3>
                                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                                    ✕
                                </button>
                            </div>

                            <form onSubmit={handleVideoSubmit}>
                                {/* <input type="hidden" name="record_id" value={recordId} />
                                <input type="hidden" name="general_id" value={generalId} /> */}

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Document Number
                                    </label>
                                    <input
                                        type="text"
                                        name='docNo'
                                        value={docNo}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-300"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 cursor-pointer"
                                    >
                                        Close
                                    </button>
                                    {!isUploaded && (
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 cursor-pointer"
                                        >
                                            Submit
                                        </button>
                                    )}
                                </div>


                            </form>

                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
