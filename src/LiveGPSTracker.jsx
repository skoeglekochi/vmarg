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
  
// 🔹 Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const LiveGPSTracker = () => {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const polylineRef = useRef(null);
  
  const [latitudelive, setLatitude] = useState(13.003207);
  const [longitudelive, setLongitude] = useState(77.578762);

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

      markerRef.current = L.marker([latitudelive, longitudelive]).addTo(mapRef.current);
      polylineRef.current = L.polyline([], { color: "blue", weight: 3 }).addTo(mapRef.current);
    }
  }, [latitudelive, longitudelive]);

  useEffect(() => {
    const gpsRef = ref(database, "Device-2/Realtime");
    onValue(gpsRef, (snapshot) => {
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
        }
      }
    }, { onlyOnce: false });
  }, []);

  return (
    <div>
      <h1>Live GPS Tracker</h1>
      <div id="map" style={{ width: "100%", height: "500px" }}></div>
    </div>
  );
};

export default LiveGPSTracker;
