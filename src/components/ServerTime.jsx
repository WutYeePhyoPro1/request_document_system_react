import { useEffect, useState } from "react";

export const fetchServerTime = async ()=>{
  try{
    const response = await fetch("/api/server-time");

    const data = await response.json();
    // console.log(data);

    return data;
  }catch(err){

  }
}


export default function ServerTime() {
  const [serverTime, setServerTime] = useState(""); // formatted string
  let serverOffset = 0; // difference in ms between server and local

  useEffect(() => {
    let interval;

    async function initServerTime() {
      try {
        // const response = await fetch("/api/server-time");
        // const data = await response.json(); // {time: '2026-02-25 10:14:19'}
        // console.log(data);

        const getServerTime = await fetchServerTime();

        const serverDate = new Date(getServerTime.time);
        const localDate = new Date();

        serverOffset = serverDate.getTime() - localDate.getTime();

        // update immediately
        updateDisplay();

        // update every second
        interval = setInterval(updateDisplay, 1000);
      } catch (err) {
        console.error("Failed to fetch server time", err);
      }
    }

    function updateDisplay() {
      const localNow = new Date();
      const serverNow = new Date(localNow.getTime() + serverOffset);

      const formatted =
        serverNow.getFullYear() +
        "-" +
        String(serverNow.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(serverNow.getDate()).padStart(2, "0") +
        " " +
        String(serverNow.getHours()).padStart(2, "0") +
        ":" +
        String(serverNow.getMinutes()).padStart(2, "0") +
        ":" +
        String(serverNow.getSeconds()).padStart(2, "0");

      setServerTime(formatted);
    }

    initServerTime();

    // cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm text-right">
      <p className="text-slate-800">Server Time</p>
      <p className="font-bold text-slate-800 text-lg">{serverTime}</p>
    </div>
  );
}
