import React, { useEffect, useRef, useState } from "react";
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

const LiveGPSTracker = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  
  const [info, setInfo] = useState("Loading location data...");
  const [logsData, setLogsData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // 🔹 Set default lat/lng values to avoid "undefined" errors
  const [latitudelive, setLatitude] = useState(13.003207);
  const [longitudelive, setLongitude] = useState(77.578762);

  // 🔹 Initialize Map when lat/lng are available
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map", { zoomControl: false }).setView(
        [latitudelive, longitudelive],
        15
      );

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

      markerRef.current = L.marker([latitudelive, longitudelive], {
        icon: carIcon,
      }).addTo(mapRef.current);

      polylineRef.current = L.polyline([], { color: "blue", weight: 3 }).addTo(
        mapRef.current
      );
    }
  }, [latitudelive, longitudelive]);

  // 🔹 Fetch Live GPS Data from Firebase
  useEffect(() => {
    const gpsRef = ref(database, "Device-2/Realtime");
    onValue(
      gpsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data?.timestamp) {
          const [date, time, lat, lng] = data.timestamp.split(",");
          const latitude = parseFloat(lat);
          const longitude = parseFloat(lng);

          if (!isNaN(latitude) && !isNaN(longitude)) {
            setLatitude(latitude);
            setLongitude(longitude);

            if (markerRef.current) {
              markerRef.current.setLatLng([latitude, longitude]);
            }

            if (polylineRef.current) {
              const latlngs = polylineRef.current.getLatLngs();
              polylineRef.current.setLatLngs([...latlngs, [latitude, longitude]]);
            }

            if (mapRef.current) {
              mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
            }

            setInfo(`Current Location: Latitude ${latitude.toFixed(6)}, Longitude ${longitude.toFixed(6)}`);
          }
        } else {
          setInfo("Waiting for GPS data...");
        }
      },
      { onlyOnce: false }
    );
  }, []);

  // 🔹 Fetch Historical Logs
  useEffect(() => {
    const dataRef = ref(database, "Device-2/Logs");
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
                return { lat: parseFloat(lat), lng: parseFloat(lng), time, date };
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

  // 🔹 Filter Logs and Draw on Map
  function filterLogs() {
    const [startYear, startMonth, startDay] = startDate.split("-");
    const startFormattedDate = new Date(startYear, startMonth - 1, startDay);

    const [endYear, endMonth, endDay] = endDate.split("-");
    const endFormattedDate = new Date(endYear, endMonth - 1, endDay);

    let filteredData = logsData.filter((log) => {
      const [logDay, logMonth, logYear] = log.date.split("/");
      const logFormattedDate = new Date(`20${logYear}`, logMonth - 1, logDay);
      return logFormattedDate >= startFormattedDate && logFormattedDate <= endFormattedDate;
    });

    if (filteredData.length === 0) {
      setInfo("No logs found for the selected date range.");
    }

    const route = filteredData.map((point) => [point.lat, point.lng]);

   
    const startIcon = L.icon({
      iconUrl: "https://firebasestorage.googleapis.com/v0/b/projects-4f71b.appspot.com/o/red%20blue-location-icon-png-19.png?alt=media&token=dc4aac49-4aaa-4db3-93c4-a2c51c0df152",  
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    const endIcon = L.icon({
      iconUrl: "https://firebasestorage.googleapis.com/v0/b/projects-4f71b.appspot.com/o/green%20blue-location-icon-png-19.png?alt=media&token=10185d49-0932-4ba0-b61d-059dc0c14b08",  
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    if (filteredData.length > 0) {
      // Set the first marker as red and the last one as green
      L.marker([filteredData[0].lat, filteredData[0].lng], { icon: startIcon }).addTo(mapRef.current);
      L.marker([filteredData[filteredData.length - 1].lat, filteredData[filteredData.length - 1].lng], { icon: endIcon }).addTo(mapRef.current);
    }

    polylineRef.current.setLatLngs(route);
  }

  return (
    <div style={{ fontFamily: "Arial, sans-serif", textAlign: "center", height: "100vh", display: "flex", flexDirection: "column" }}>
      <h1 style={{ margin: "0", padding: "10px 0", backgroundColor: "#333", color: "#fff" }}>Skoegle - Live GPS Tracker</h1>

      <div style={{ padding: "10px", backgroundColor: "#f9f9f9", display: "flex", justifyContent: "center", gap: "10px" }}>
        <div>
          <label>Start Date:</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div>
          <label>End Date:</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        <button onClick={filterLogs} style={{ padding: "5px 10px", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px" }}>Filter</button>
      </div>

      <div id="map" style={{ flex: "1", width: "100%", height: "calc(100% - 100px)", margin: "0 auto" }}></div>
    </div>
  );
};

export default LiveGPSTracker;
