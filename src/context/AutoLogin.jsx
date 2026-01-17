import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginWithToken } from "../store/authSlice"; // adjust path

export default function AutoLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const redirect = params.get("redirect");

  if (!token) {
    navigate("/login");
    return;
  }

  dispatch(loginWithToken({ token }))
  .unwrap()
  .then(({ redirect }) => {
    // console.log("REDIRECT FROM API:", redirect);
    // alert(redirect);

    navigate(redirect ? `/${redirect}` : "/cctv_record", {
      replace: true,
    });
  })
  .catch(() => {
    navigate("/login");
  });

   
}, []);


  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Logging in...</p>
      </div>
    </div>
  );
}
