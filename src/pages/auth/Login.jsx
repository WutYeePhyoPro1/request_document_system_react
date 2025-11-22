import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import loginPhoto from "../../assets/images/login.png";
import pro1Logo from "../../assets/images/finallogo.png";
import InstallButton from '../../components/ui/InstallButton';
import { login as loginThunk } from '../../store/authSlice'; // your redux thunk

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const { user, status, error } = useSelector((state) => state.auth); // get auth state from Redux
  
  const [employee_number, setEmployee_number] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // dispatch redux login thunk
    const resultAction = await dispatch(loginThunk({ employee_number, password, remember: true }));
    if (loginThunk.fulfilled.match(resultAction)) {
      navigate('/dashboard', { replace: true });
    } else {
      console.error(resultAction.payload || "Login failed");
    }
  };

  // PWA install prompt logic remains the same
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        setDeferredPrompt(null);
        setIsVisible(false);
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gray-100">
      <div className="w-full max-w-4xl lg:max-w-6xl xl:max-w-7xl rounded-lg p-4 sm:p-6 lg:p-8 bg-[#ecfeff] shadow-lg" style={{ border: '1px solid rgb(46, 162, 209)' }}>
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 sm:mb-8 lg:mb-10 gap-4">
          <img src={pro1Logo} alt="Pro1 Logo" className="h-10 sm:h-12 md:h-14 lg:h-16 xl:h-18" />
          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-custom-blue text-center">
            Request Document System
          </h1>
          <div className="hidden sm:block h-16 w-16 lg:h-20 lg:w-20"></div>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-6 md:gap-8 lg:gap-10 xl:gap-12">
          <div className="hidden lg:block flex-1">
            <img src={loginPhoto} alt="Login Visual" className="w-full h-auto max-h-[300px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[450px] xl:max-h-[500px] object-contain" />
          </div>

          <div className="w-full sm:max-w-md lg:max-w-lg xl:max-w-xl">
            <form onSubmit={handleSubmit} className="w-full p-4 sm:p-6 md:p-8 bg-white rounded-lg shadow-sm">
              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-4xl font-bold mb-4 sm:mb-6 md:mb-8 text-custom-blue text-center">
                Login
              </h3>

              <div className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
                <div>
                  <label className='text-xs sm:text-sm md:text-base lg:text-lg text-slate-800 font-medium mb-1 sm:mb-2 block'>
                    Employee Number
                  </label>
                  <input
                    type="text"
                    required
                    className="border p-2 sm:p-3 w-full rounded-md text-xs sm:text-sm md:text-base lg:text-lg focus:outline-none"
                    style={{ borderColor: '#2ea2d1' }}
                    placeholder="Enter your employee number"
                    value={employee_number}
                    onChange={(e) => setEmployee_number(e.target.value)}
                  />
                </div>

                <div>
                  <label className='text-xs sm:text-sm md:text-base lg:text-lg text-slate-800 font-medium mb-1 sm:mb-2 block'>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    className="border p-2 sm:p-3 w-full rounded-md text-xs sm:text-sm md:text-base lg:text-lg focus:outline-none"
                    style={{ borderColor: '#2ea2d1' }}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}
              </div>

              <div className="mt-6 sm:mt-8 md:mt-10 lg:mt-12">
                <InstallButton />
                <button
                  type="submit"
                  className="w-full py-2 sm:py-3 px-4 text-xs sm:text-sm md:text-base lg:text-lg font-semibold rounded text-white focus:outline-none"
                  style={{ backgroundColor: '#2ea2d1' }}
                >
                  Log in
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
