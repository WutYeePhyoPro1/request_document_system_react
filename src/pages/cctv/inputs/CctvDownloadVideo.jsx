import React, { useState } from 'react'
import { confirmAlert } from 'react-confirm-alert';

export default function CctvDownloadVideo({ empId, id, onClose }) {

    console.log(empId);

    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/cctv-records/download-video/${empId}/${id}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token} `,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username: empId,
                    password: password
                }),
            });

            const result = await response.json();
            if (response.ok) {

            } else if (response.status === 401) {
                confirmAlert({
                    title: 'Input is wrong',
                    text: result.message,
                    icon: 'warning',
                    confirmButtonText: 'OK'
                });
            }

        } catch (error) {
            console.error(error);
            // alert('An error occurred during the download.');
        }
    };


    return (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
                <div className="p-6">

                    <div className="flex justify-between items-center border-b pb-3 mb-4">
                        <h3 className="text-lg font-semibold">Upload Record Video</h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="mb-4">
                            <label className="lock text-sm font-medium text-gray-700 mb-1">
                                Employee id
                            </label>
                            <input type="text"
                                name='docNo'
                                value={empId}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
                            />
                        </div>


                        <div className="mb-4">
                            <label className="lock text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input type="password"
                                name='password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t mt-6">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
                                Close
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                            >
                                Submit
                            </button>
                        </div>
                    </form>


                </div>
            </div>
        </div>

    )
}
