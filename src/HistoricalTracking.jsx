import React, { useEffect, useRef, useState } from "react";  // Make sure to import useRef here
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// 🔹 Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB3vFmUkVuYXeb5CgHKQVtPNq1CLu_fC1I",
    authDomain: "skoegle.firebaseapp.com",
    databaseURL: "https://skoegle-default-rtdb.firebaseio.com",
    projectId: "skoegle",
    storageBucket: "skoegle.appspot.com",
    messagingSenderId: "850483861138",
    appId: "1:850483861138:web:7db6db38eb81eb3dde384b",
    measurementId: "G-9SB0PX663B",
  };
  
// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const HistoricalTracking = () => {
  const [logsData, setLogsData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const polylineRef = useRef(null);  // Make sure to use useRef here
  const mapRef = useRef(null);

  useEffect(() => {
    const dataRef = ref(database, "Device-2/Logs");
    onValue(dataRef, (snapshot) => {
      const logs = snapshot.val();
      if (logs) {
        const organizedData = Object.keys(logs).map((key) => {
          const { timestamp } = logs[key];
          const [date, time, lat, lng] = timestamp.split(",");
          return { lat: parseFloat(lat), lng: parseFloat(lng), time, date };
        });
        setLogsData(organizedData);
      }
    });
  }, []);

  const filterLogs = () => {
    const [startYear, startMonth, startDay] = startDate.split("-");
    const startFormattedDate = new Date(startYear, startMonth - 1, startDay);
    
    const [endYear, endMonth, endDay] = endDate.split("-");
    const endFormattedDate = new Date(endYear, endMonth - 1, endDay);
    
    const filteredData = logsData.filter((log) => {
      const [logDay, logMonth, logYear] = log.date.split("/");
      const logFormattedDate = new Date(`20${logYear}`, logMonth - 1, logDay);
      return logFormattedDate >= startFormattedDate && logFormattedDate <= endFormattedDate;
    });

    const route = filteredData.map((point) => [point.lat, point.lng]);
    if (mapRef.current) {
      polylineRef.current.setLatLngs(route);
    }
  };

  return (
    <div>
      <h1>Historical GPS Tracker</h1>
      <div>
        <label>Start Date:</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <label>End Date:</label>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button onClick={filterLogs}>Filter</button>
      </div>
      <div id="map" style={{ width: "100%", height: "500px" }}></div>
    </div>
  );
};

export default HistoricalTracking;
