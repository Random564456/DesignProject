import React, { useEffect, useState, useRef } from "react";

const DataDisplay = ({ inputData }) => {
  const HOSTURL = "ws://localhost:8000/ws";
  const connection = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");
  const [predictions, setPredictions] = useState(null);
  const [currentRowIndex, setCurrentRowIndex] = useState(0);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const intervalRef = useRef(null);

  // Make websocket connection
  useEffect(() => {
    const socket = new WebSocket(HOSTURL);

    socket.addEventListener("open", () => {
      console.log("WebSocket connected");
      setConnectionStatus("Connected");
    });

    // Logic for handling incoming message
    socket.addEventListener("message", (event) => {
      console.log("Received:", event.data);

      try {
        const parsedData = JSON.parse(event.data);
        if (parsedData.recommended_settings || parsedData.raw_values) {

          // update prediction state to parsed data
          setPredictions(parsedData);
        }
      } catch (error) {
        console.log(error)
        console.log("Received non-JSON message:", event.data);
      }
    });

    socket.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
      setConnectionStatus("Error");
    });

    socket.addEventListener("close", () => {
      console.log("WebSocket closed");
      setConnectionStatus("Disconnected");
    });

    connection.current = socket;

    return () => {
      if (connection.current) {
        connection.current.close();
      }
      stopAutoSending();
    };
  }, []);

  const sendSensorData = () => {
    if (!inputData || inputData.length === 0) {
      console.log("No CSV data available");
      return;
    }

    const currentRow = inputData[currentRowIndex];

    const sensorData = {
      part: parseFloat(currentRow.part || 0),
      extract_tank_level: parseFloat(currentRow.extract_tank_level || 0),
      ffte_discharge_density: parseFloat(
        currentRow.ffte_discharge_density || 0
      ),
      ffte_discharge_solids: parseFloat(currentRow.ffte_discharge_solids || 0),
      ffte_feed_flow_rate_pv: parseFloat(
        currentRow.ffte_feed_flow_rate_pv || 0
      ),
      ffte_feed_solids_pv: parseFloat(currentRow.ffte_feed_solids_pv || 0),
      ffte_heat_temperature_1: parseFloat(
        currentRow.ffte_heat_temperature_1 || 0
      ),
      ffte_heat_temperature_2: parseFloat(
        currentRow.ffte_heat_temperature_2 || 0
      ),
      ffte_heat_temperature_3: parseFloat(
        currentRow.ffte_heat_temperature_3 || 0
      ),
      ffte_production_solids_pv: parseFloat(
        currentRow.ffte_production_solids_pv || 0
      ),
      ffte_steam_pressure_pv: parseFloat(
        currentRow.ffte_steam_pressure_pv || 0
      ),
      tfe_input_flow_pv: parseFloat(currentRow.tfe_input_flow_pv || 0),
      tfe_level: parseFloat(currentRow.tfe_level || 0),
      tfe_motor_current: parseFloat(currentRow.tfe_motor_current || 0),
      tfe_motor_speed: parseFloat(currentRow.tfe_motor_speed || 0),
      tfe_out_flow_pv: parseFloat(currentRow.tfe_out_flow_pv || 0),
      tfe_production_solids_pv: parseFloat(
        currentRow.tfe_production_solids_pv || 0
      ),
      tfe_production_solids_density: parseFloat(
        currentRow.tfe_production_solids_density || 0
      ),
      tfe_steam_pressure_pv: parseFloat(currentRow.tfe_steam_pressure_pv || 0),
      tfe_steam_temperature: parseFloat(currentRow.tfe_steam_temperature || 0),
      tfe_tank_level: parseFloat(currentRow.tfe_tank_level || 0),
      tfe_temperature: parseFloat(currentRow.tfe_temperature || 0),
      tfe_vacuum_pressure_pv: parseFloat(
        currentRow.tfe_vacuum_pressure_pv || 0
      ),
    };

    if (
      connection.current &&
      connection.current.readyState === WebSocket.OPEN
    ) {
      connection.current.send(JSON.stringify(sensorData));
      console.log("Sent data for row:", currentRowIndex, sensorData);

      // Move to next row or stop at the end
      if (currentRowIndex < inputData.length - 1) {
        setCurrentRowIndex(currentRowIndex => currentRowIndex + 1);
      } else {
        stopAutoSending();
      }
    } else {
      console.log("WebSocket not connected");
    }
  };

  const startAutoSending = () => {
    if (!isAutoSending) {
      setIsAutoSending(true);
      // Send first row immediately
      sendSensorData();
      // Then set up interval for other rows
      intervalRef.current = setInterval(sendSensorData, 1000);
    }
  };

  const stopAutoSending = () => {
    if (isAutoSending) {
      setIsAutoSending(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const renderPredictions = () => {
    if (!predictions) return null;

    return (
      <div>
        <h3
          style={{
            fontSize: "1.25rem",
            fontWeight: "bold",
            marginBottom: "1rem",
          }}
        >
          Latest Predictions
        </h3>
        {predictions.recommended_settings && (
          <div>
            <h4
              style={{
                fontSize: "1.1rem",
                fontWeight: "600",
                marginBottom: "0.5rem",
              }}
            >
              Recommended Settings:
            </h4>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "1rem",
              }}
            >
              {Object.entries(predictions.recommended_settings).map(
                ([key, value]) => (
                  <div
                    key={key}
                    style={{
                      border: "1px solid #ccc",
                      borderRadius: "8px",
                      padding: "1rem",
                      backgroundColor: "#fff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div style={{ fontWeight: "500", color: "#4a4a4a" }}>
                      {key.replace(/_/g, " ")}
                    </div>
                    <div style={{ color: "#1e40af", fontSize: "1.125rem" }}>
                      {typeof value === "number" ? value.toFixed(2) : value}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div>
        <h2>Predicted Machine Settings</h2>
        <h4>For desired consistency</h4>
        <div>
          <span>Status: {connectionStatus}</span>
        </div>
      </div>

      {inputData && inputData.length > 0 && (
        <div>
          <p>
            CSV Data: Row {currentRowIndex + 1} of {inputData.length}
          </p>
          <div>
            <button onClick={startAutoSending} disabled={isAutoSending}>
              Start Auto Sending
            </button>
            <button onClick={stopAutoSending} disabled={!isAutoSending}>
              Stop Auto Sending
            </button>
          </div>
        </div>
      )}

      {renderPredictions()}
    </div>
  );
};

export default DataDisplay;
