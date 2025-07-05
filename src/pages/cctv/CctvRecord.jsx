import React from 'react';
import cctvPhoto from "../../assets/images/ban1.png";
import { Link } from 'react-router-dom';
import NavPath from '../../components/NavPath';

export default function CctvRecord() {
    return (
        <div className="p-6">
            <div
                className="h-48 w-full bg-cover bg-center rounded-lg shadow-md mb-6"
                style={{ backgroundImage: `url(${cctvPhoto})` }}
            ></div>


            <NavPath
                segments={[
                    { path: "/dashboard", label: "Home" },
                    { path: "/dashboard", label: "Dashboard" },
                    { path: "/cctv-index", label: "Cctv Request" },
                    { path: "/cctv-request", label: "Cctv Record" }
                ]}
            />
            <div className="max-w-6xl mx-auto bg-white border border-gray-200 shadow-lg rounded-lg p-6">
                <h2 className="text-center text-xl font-bold text-blue-700 mb-4">
                    Pro1 Global Co., Ltd
                </h2>
                <h3 className="text-center text-md font-semibold text-gray-600">
                    System Development
                </h3>
                <p className="text-center text-gray-500 mt-2 border-b pb-2">
                    CCTV ကြည့်ရှုမှုဆိုင်ရာ ထောက်ခံချက် အတည်ပြုချက်များ
                </p>

                <div className="bg-gradient-to-r from-red-100 to-blue-100 p-4 rounded-lg mt-4">
                    <p className="text-red-500 font-semibold">
                        ၁။ CCTV Playback ကြည့်ရူ့ရာတွင် ဖော်ပြပါ Form အားဖြည့်ပြီး မှသာကြည့်ရူ့ခွင့်ရှိမည်။
                    </p>
                    <p className="text-gray-700 mt-2">
                        ၂။ CCTV ကြည့်ရူ့ရန် အခန်းတွင်းသို့ ကြည့်ရူ့မည်သူ ၂ ယောက်သာ ဝင်ခွင့်ပြုမည်။ ၎င်း၂ယောက်သည် / (Manager (သို့) Assistant Manager (သို့) Supervisor သက်သေနှင့် မြင်တွေ့သူ) ဖြစ်ရမည်။
                    </p>
                    <p className="font-bold text-gray-900 mt-2">
                        ၃။
                        SEVER ခန်းအတွင်းသို့ CUSTOMER နှင့် Supplier များကို ခေါ်ဆောင်ကြည့်ရူ့ခွင့်မပြုပါ။
                    </p>
                    <p className="font-bold text-gray-900 mt-2">
                        ၄။
                        သက်ဆိုင်ရာ Department ၏ Manager (သို့) Assistant Manager တစ်ယောက်ထဲမှ စစ်ဆေး ကြည့်ရှုလိုလျှင် အချိန်မရွှေး ကြည့်ခွင့်ရှိသည်။
                    </p>
                    <p className="font-bold text-gray-900 mt-2">
                        ၅။
                        အရေးကြီးကိစ္စရပ်များအားအခြေနေပေါ်မူတည်၍ Syetem Development ၏ဆုံးဖြတ်ချက်ကိုသာ အတည်ပြုရန် နှင့် ထိုကိစ္စရပ်များအားကြည့်ရှုပြီးနောက် CCTV Form တွင်ပြန်လည် ဖြည့်သွင်းပေးပါရန်။
                    </p>
                    <p className="font-bold text-gray-900 mt-2">
                        ၆။
                        Export ထုတ်ယူသွားသော Vedio record များအား တစ်ခြားသူတစ်ယောက်(၀န်ထမ်းဖြစ်စေ/ပြင်ပလူဖြစ်စေ)/ Social media / public / channel များသို့ လွဲပြောင်းပေးခြင်း/‌‌‌‌‌‌‌ေ၀မျှပေးခြင်း လုံး၀မပြု လုပ်ရပါ။ ပြုလုပ်ပါက vedio record ထုပ်ယူခဲ့သူသာလျှင် တာ၀န်ရှိသည်။
                    </p>
                </div>

                <div className="text-center mt-4">
                    <Link to="/cctv-form" className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                        ✅ Agree
                    </Link>
                </div>
            </div>
        </div>
    );
}
