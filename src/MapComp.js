// edited working bug - after editing previous intersected is disappearing
import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  FeatureGroup,
  Polygon,
  Popup,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { EditControl } from "react-leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import * as turf from "@turf/turf"; // To calculate the Inetrsected Area
import axios from "axios";

export default function MapComp() {
  const [jsonData, setJsonData] = useState(null);
  const [intersectingTiles, setIntersectingTiles] = useState([]);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [editedAOI, setEditedAOI] = useState(null);
  const [errorPopup, setErrorPopup] = useState(null);
  const [popupPosition, setPopupPosition] = useState([]);

  // using Axios to fetch the data from the deployed URL
  // useEffect(() => {
  // const corsProxyUrl = "https://cors-anywhere.herokuapp.com/";
  //   axios
  //     .get(
  //       "https://file.notion.so/f/s/1a1e461b-4293-428d-88da-5089a8cc8cf3/karnataka.geojson?id=2f305225-bab6-4c37-9e38-1bd78cd07209&table=block&spaceId=9301458a-f465-42d3-80eb-7c09bae15034&expirationTimestamp=1694073600000&signature=1cd5OqV8BXf1PpR5nJdBfM7f6fF98Ob3q4GvDR1Aylg&downloadName=karnataka.geojson"
  //     )
  //     .then((data) => {
  //       setJsonData(data.features);
  //       console.log("the response: ", data.features);
  //       setDrawingEnabled(true); // Enable drawing after data is loaded
  //     })
  //     .catch((error) => {
  //       console.log("Error while getting data:", error);
  //     });
  // }, []);

  useEffect(() => {
    axios
      .get("http://localhost:3000/features")
      .then((resp) => {
        const responseData = resp.data; // Access the response data
        console.log("the json responce: ", responseData);
        setJsonData(responseData);
        setDrawingEnabled(true);
      })
      .catch((error) => {
        console.log("Error while getting data from Karnataka.jeojson: ", error);
      });
  }, []);

  const aftercreatedPolygon = (e) => {
    //  To clear the error popup that we got from the previous drwan AOI
    setErrorPopup(null);
    const { layerType, layer } = e;
    if (layerType === "polygon") {
      const aoI = layer.toGeoJSON(); // Get the drawn polygon Coordinates
      // Check if jsonData is available before filtering
      if (jsonData) {
        const isoutOfKarnataka = jsonData.every((tile) =>
          turf.booleanDisjoint(tile.geometry, aoI.geometry)
        );

        if (isoutOfKarnataka) {
          const aoICoordinates = aoI.geometry.coordinates[0];
          const centerLat =
            aoICoordinates.reduce((sum, coord) => sum + coord[1], 0) /
            aoICoordinates.length;
          const centerLng =
            aoICoordinates.reduce((sum, coord) => sum + coord[0], 0) /
            aoICoordinates.length;

          setPopupPosition([centerLat, centerLng]);
          setErrorPopup(
            "The Drawn AOI is outside Karnataka. Please draw inside Karnataka."
          );
        } else {
          // Calculate the intersection with each tile
          const newIntersecting = jsonData.filter((tile) =>
            turf.booleanIntersects(tile.geometry, aoI.geometry)
          );

          // Set the intersecting tiles
          setIntersectingTiles((prevIntersecting) => [
            ...prevIntersecting,
            ...newIntersecting,
          ]);
          const aoICoordinates = aoI.geometry.coordinates[0];
          const centerLat =
            aoICoordinates.reduce((sum, coord) => sum + coord[1], 0) /
            aoICoordinates.length;
          const centerLng =
            aoICoordinates.reduce((sum, coord) => sum + coord[0], 0) /
            aoICoordinates.length;
          setPopupPosition([centerLat, centerLng]);
          setErrorPopup("Intersection Calculation completed.");
        }
      }
    }
  };

  const onEdit = (e) => {
    const editedLayer = e.layers.getLayers()[0];
    if (editedLayer) {
      const editedAOI = editedLayer.toGeoJSON();
      setEditedAOI(editedAOI);

      if (jsonData) {
        const newIntersecting = jsonData.filter((tile) =>
          turf.booleanIntersects(tile.geometry, editedAOI.geometry)
        );
        setIntersectingTiles((prevIntersecting) => [
          ...prevIntersecting,
          ...newIntersecting,
        ]);

        // To Calculate the center coordinates of the edited AOI
        const editedAOICoordinates = editedAOI.geometry.coordinates[0];
        const centerLat =
          editedAOICoordinates.reduce((sum, coord) => sum + coord[1], 0) /
          editedAOICoordinates.length;
        const centerLng =
          editedAOICoordinates.reduce((sum, coord) => sum + coord[0], 0) /
          editedAOICoordinates.length;

        // Set the popup position to the center coordinates
        setPopupPosition([centerLat, centerLng]);

        setErrorPopup("Drawn AOI Edited Successfully!.");
      }
    }
  };

  const clearAll = () => {
    setErrorPopup(null);
    setEditedAOI(null);
    setIntersectingTiles([]);
    mapRef.current.setView([12.9716, 77.5946], 10);
    setErrorPopup("All map data has been cleared.");

    setPopupPosition([12.9716, 77.5946]);
    setTimeout(() => {
      setErrorPopup(null);
    }, 2000);
  };

  const mapRef = useRef();

  return (
    <div className="flex flex-col md:flex-row">
      <div className="py-0 md:py-10 mx-0 md:mx-6 md:w-1/4">
        <h4 className="font-bold text-2xl md:text-3xl text-blue-500  pl-2">
          Instruction
        </h4>
        <div className="bg-white p-2 rounded-lg shadow-lg">
          <ul className="list-disc list-inside md:space-y-2">
            <li className="text-lg">
              Click on Polygon Symbol to select the Area of Interest(AOI)
            </li>
            <li className="text-lg">
              Start Drawing the Triangle, Square, Rectangle etc...
            </li>
            <li className="text-lg">
              Tiles intersecting with the AOI shown on the frontend.
            </li>
            <li className="text-lg">Blue Container represents the AOI.</li>
            <li className="text-lg">
              Red Container represents the Intersecting Area with AOI.
            </li>
            <li className="text-lg">
              Click on edit icon to change the drawn AOI.
            </li>
            <li className="text-lg">
              Block Container represent the Edited AOI.
            </li>
            <li className="text-lg">
              Click On Clear All button to remove everything from the map.
            </li>
          </ul>
        </div>
      </div>
      <div className="w-full md:w-5/6 md:h-5/6 md:pt-10">
        <MapContainer
          ref={mapRef}
          center={[12.9716, 77.5946]}
          zoom={10}
          // style={{ height: "400px", width: "100%" }}
          className=" h-[550px] w-auto rounded-lg  border border-black "
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <FeatureGroup>
            {drawingEnabled && ( // Enable drawing only when data is loaded
              <EditControl
                position="topleft"
                onCreated={aftercreatedPolygon}
                onEdited={onEdit}
                draw={{
                  rectangle: false,
                  circle: false,
                  marker: false,
                  circlemarker: false,
                  polyline: false,
                }}
              />
            )}
          </FeatureGroup>

          {/* Render intersecting tiles in red */}
          {intersectingTiles.map((tile, index) => (
            <Polygon
              key={index}
              positions={tile.geometry.coordinates[0].map(([lng, lat]) => [
                lat,
                lng,
              ])}
              color="red"
            />
          ))}

          {editedAOI && (
            <Polygon
              positions={editedAOI.geometry.coordinates[0].map(([lng, lat]) => [
                lat,
                lng,
              ])}
              color="black"
            />
          )}

          {/* Popup when user selected AOI out of karnataka */}
          {errorPopup && (
            <Popup position={popupPosition} key={errorPopup}>
              {errorPopup}
            </Popup>
          )}
        </MapContainer>
        <button
          onClick={clearAll}
          className="bg-red-400 text-white font-bold p-2 border border-black rounded-md mt-3 hover:bg-red-600"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}
