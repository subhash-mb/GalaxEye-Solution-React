// edited working bug - after editing previous intersected is disappearing
import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, FeatureGroup, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { EditControl } from "react-leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";
import * as turf from "@turf/turf"; // Correct import statement

export default function MapComp() {
  const [jsonData, setJsonData] = useState(null);
  const [intersectingTiles, setIntersectingTiles] = useState([]);
  const [drawingEnabled, setDrawingEnabled] = useState(false);
  const [editedAOI, setEditedAOI] = useState(null);

  // To fetch the data from the deployed URL
  useEffect(() => {
    const apiUrl =
      "https://file.notion.so/f/s/1a1e461b-4293-428d-88da-5089a8cc8cf3/karnataka.geojson?id=2f305225-bab6-4c37-9e38-1bd78cd07209&table=block&spaceId=9301458a-f465-42d3-80eb-7c09bae15034&expirationTimestamp=1694073600000&signature=1cd5OqV8BXf1PpR5nJdBfM7f6fF98Ob3q4GvDR1Aylg&downloadName=karnataka.geojson";

    fetch(apiUrl)
      .then((response) => response.json())
      .then((data) => {
        setJsonData(data.features);
        console.log("the response: ", data.features);
        setDrawingEnabled(true); // Enable drawing after data is loaded
      })
      .catch((error) => {
        console.log("Error while getting data:", error);
      });
  }, []);

  const aftercreatedPolygon = (e) => {
    const { layerType, layer } = e;
    if (layerType === "polygon") {
      const aoI = layer.toGeoJSON(); // Get the drawn polygon as a GeoJSON feature

      // Check if jsonData is available before filtering
      if (jsonData) {
        // Calculate the intersection with each tile
        const newIntersecting = jsonData.filter((tile) =>
          turf.booleanIntersects(tile.geometry, aoI.geometry)
        );

        // Set the intersecting tiles
        setIntersectingTiles((prevIntersecting) => [
          ...prevIntersecting,
          ...newIntersecting,
        ]);
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
        setIntersectingTiles(newIntersecting);
      }
    }
  };

  return (
    <div>
      <MapContainer
        center={[12.9716, 77.5946]}
        zoom={10}
        style={{ height: "700px", width: "100%" }}
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
      </MapContainer>
    </div>
  );
}