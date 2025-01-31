import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const LiveGPSTracker = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null); // Ref for the polyline
  const [info, setInfo] = useState("Loading location data...");
  const [logsData, setLogsData] = useState([]);
  const [startDate, setStartDate] = useState("");
  // const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  // const [endTime, setEndTime] = useState("");
  useEffect(() => {
    mapRef.current = L.map("map", {
      zoomControl: false,
    }).setView([13.003207, 77.578762], 15);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap contributors",
    }).addTo(mapRef.current);

    const carIcon = L.icon({
      iconUrl:
        "https://img.icons8.com/?size=100&id=fsoiqMUp0O4v&format=png&color=000000",
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    markerRef.current = L.marker([13.003207, 77.578762], {
      icon: carIcon,
    }).addTo(mapRef.current);

    polylineRef.current = L.polyline([], { color: "blue", weight: 3 }).addTo(
      mapRef.current
    );

    const gpsRef = ref(database, "Device-1/Realtime");
    onValue(
      gpsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data && data.lat && data.lng) {
          const latitude = data.lat;
          const longitude = data.lng;

          markerRef.current.setLatLng([latitude, longitude]);

          const latlngs = polylineRef.current.getLatLngs();
          polylineRef.current.setLatLngs([...latlngs, [latitude, longitude]]);

          mapRef.current.setView(
            [latitude, longitude],
            mapRef.current.getZoom()
          );

          setInfo(
            `Current Location: Latitude ${latitude.toFixed(
              6
            )}, Longitude ${longitude.toFixed(6)}`
          );
        } else {
          setInfo("Waiting for GPS data...");
        }
      },
      {
        onlyOnce: false,
      }
    );

    return () => {
      mapRef.current.remove();
    };
  }, []);
  function filterLogs() {
    // Convert startDate and endDate to comparable formats
    const [startYear, startMonth, startDay] = startDate.split("-");
    const startFormattedDate = new Date(startYear, startMonth - 1, startDay);
  
    const [endYear, endMonth, endDay] = endDate.split("-");
    const endFormattedDate = new Date(endYear, endMonth - 1, endDay);
  
    let filteredData = [];
  
    if (startDate === endDate) {
      // If startDate and endDate are the same, filter by that specific date
      filteredData = logsData.filter((log) => {
        const [logDay, logMonth, logYear] = log.date.split("/");
        const logFormattedDate = new Date(
          `20${logYear}` + "-" + logMonth + "-" + logDay
        );
        return logFormattedDate.getTime() === startFormattedDate.getTime();
      });
    } else {
      // Filter logs that fall between the selected start and end dates
      filteredData = logsData.filter((log) => {
        const [logDay, logMonth, logYear] = log.date.split("/");
        const logFormattedDate = new Date(
          `20${logYear}` + "-" + logMonth + "-" + logDay
        );
  
        return logFormattedDate >= startFormattedDate && logFormattedDate <= endFormattedDate;
      });
    }
  
    if (filteredData.length === 0) {
      setInfo("No logs found for the selected date range.");
    }
console.log(filteredData)
    // Plot filtered logs on the map
    const route = filteredData.map((point) => [point.lat, point.lng]);
    polylineRef.current.setLatLngs(route);
  }
  
  

  useEffect(() => {
    const dataRef = ref(database, "Device-1/Logs");
    const fetchLogs = async () => {
      await new Promise((resolve, reject) => {
        onValue(
          dataRef,
          (snapshot) => {
            const logs = snapshot.val();
            if (logs) {
              const organizedData = Object.keys(logs).map((key) => {
                const { timestamp } = logs[key];
                const [date, time, lat, lng] = timestamp.split(",");
                console.log(date, time);
                return {
                  lat: parseFloat(lat),
                  lng: parseFloat(lng),
                  time,
                  date,
                };
              });

              setLogsData(organizedData);
              resolve();
            } else {
              console.log("No logs available.");
              resolve();
            }
          },
          (error) => {
            reject(error);
          }
        );
      });
    };

    fetchLogs().catch((error) => console.error("Error fetching logs:", error));
  }, []);

  // useEffect(() => {
  //   // Plot route from logsData
  //   if (logsData.length > 0 && polylineRef.current) {
  //     const route = logsData.map((point) => [point.lat, point.lng]);
  //     // logsData.map((x) => {
  //     //   console.log(x.lat, x.lng, x.time, x.date); //0:36:31 20/1/25 time formet
  //     // });
  //     polylineRef.current.setLatLngs(route);
  //   }
  // }, [logsData]);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        textAlign: "center",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        weight: "200%",
      }}
    >
      <h1
        style={{
          margin: "0",
          padding: "10px 0",
          backgroundColor: "#333",
          color: "#fff",
        }}
      >
        Skoegle - Live GPS Tracker
      </h1>
      <div
        style={{
          padding: "10px",
          backgroundColor: "#f9f9f9",
          display: "flex",
          justifyContent: "center",
          gap: "10px",
        }}
      >
        <div>
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        {/* <div>
          <label>Start Time:</label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div> */}
        <div>
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        {/* <div>
          <label>End Time:</label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div> */}
        <button
          onClick={filterLogs}
          style={{
            padding: "5px 10px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Filter
        </button>
      </div>
      <div
        id="map"
        style={{
          flex: "1",
          width: "200%",
          height: "calc(100% - 200px)",
          margin: "0 auto",
        }}
      ></div>
    </div>
  );
};

export default LiveGPSTracker;
