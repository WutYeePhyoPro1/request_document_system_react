import React, { useState } from 'react';
import loginPhoto from "../../assets/images/login.png";
import { DiVim } from 'react-icons/di';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import pro1Logo from "../../assets/images/finallogo.png";



export default function Login() {
    const { login } = useAuth();
    const [employee_number, setemployee_number] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const success = await login(employee_number, password, remember);
        if (success) {
            navigate('/dashboard');
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-6 px-4 bg-white-100 ">
            <div className="rounded-lg p-5 bg-[#ecfeff] shadow-xl/30" style={{ border: '1px solid rgb(46, 162, 209)' }} >
                {/* <div className="relative w-full max-w-6xl mb-8 h-20 ">
                    <img
                        src={pro1Logo}
                        alt="Pro1 Logo"
                        className="absolute left-0 h-16"
                    />

                    <h1 className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-blue-400">
                        Request Document System
                    </h1>
                </div> */}
                <div className="flex items-center justify-between max-w-6xl w-full mb-8">
                    {/* Logo - Left */}
                    <img src={pro1Logo} alt="Pro1 Logo" className="h-16" />

                    {/* Title - Center */}
                    <div className="flex-1 text-center">
                        <h1 className="text-3xl font-bold text-blue-400">Request Document System</h1>
                    </div>

                    {/* Right - Empty (placeholder for spacing) */}
                    <div className="h-16 w-16"></div>
                </div>

                <div className="grid md:grid-cols-2 items-center gap-10 max-w-6xl max-md:max-w-md w-full">
                    <img src={loginPhoto} alt="Login Visual" />
                    <form onSubmit={handleSubmit} className="max-w-md md:ml-auto w-full p-10 bg-gray-100 rounded-lg">
                        <h3 className="text-center lg:text-3xl text-2xl font-bold mb-8 text-blue-400">
                            Login
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className='text-sm text-slate-800 font-medium mb-2 block'>Employee Number</label>
                                <input
                                    name="employee_number"
                                    type="text"
                                    required
                                    className="border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 p-2 w-full rounded-md"
                                    placeholder="Enter your employee number"
                                    value={employee_number}
                                    onChange={(e) => setemployee_number(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className='text-sm text-slate-800 font-medium mb-2 block'>Password</label>
                                <input
                                    name="password"
                                    type="password"
                                    required
                                    className="border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 p-2 w-full rounded-md"
                                    placeholder="Enter Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center">
                                    <input id="remember-me" name="remember" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                                        checked={remember}
                                        onChange={(e) => setRemember(e.target.checked)}
                                    />
                                    <label htmlFor="remember-me" className="ml-3 block text-sm text-slate-500">
                                        Remember me
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="!mt-12">
                            <button type="submit" className="w-full shadow-xl py-2.5 px-4 text-sm font-semibold rounded text-white bg-blue-400 hover:bg-blue-500 focus:outline-none">
                                Log in
                            </button>
                        </div>

                    </form>

                </div>
            </div>
        </div>
    );
}




