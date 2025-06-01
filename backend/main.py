from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import json
from model_loader import load_generator_model

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Sensors(BaseModel):
    part: float
    extract_tank_level: float
    ffte_discharge_density: float
    ffte_discharge_solids: float
    ffte_feed_flow_rate_pv: float
    ffte_feed_solids_pv: float
    ffte_heat_temperature_1: float
    ffte_heat_temperature_2: float
    ffte_heat_temperature_3: float
    ffte_production_solids_pv: float
    ffte_steam_pressure_pv: float
    tfe_input_flow_pv: float
    tfe_level: float
    tfe_motor_current: float
    tfe_motor_speed: float
    tfe_out_flow_pv: float
    tfe_production_solids_pv: float
    tfe_production_solids_density: float
    tfe_steam_pressure_pv: float
    tfe_steam_temperature: float
    tfe_tank_level: float
    tfe_temperature: float
    tfe_vacuum_pressure_pv: float

LATENT_DIM = 8
generator_model = load_generator_model()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connection accepted")
    try:
        while True:
            message = await websocket.receive_text()            
                
            try:
                data = json.loads(message)
                sensors = Sensors(**data)
                
                input_values = [value / 100.0 for value in sensors.dict().values()]
                sensors_array = np.array(input_values).reshape(1, -1).astype(np.float32)
                
                noise = np.random.normal(0, 1, (1, LATENT_DIM)).astype(np.float32)
                predicted_settings = generator_model.predict([noise, sensors_array])
                
                settings_list = predicted_settings[0].tolist()
                
                setting_names = [
                    "FFTE Feed solids SP",
                    "FFTE Production solids SP",
                    "FFTE Steam pressure SP",
                    "TFE Out flow SP",
                    "TFE Production solids SP",
                    "TFE Vacuum pressure SP",
                    "TFE Steam pressure SP",
                ]
                
                labeled_settings = {name: round(val * 100, 2) for name, val in zip(setting_names, settings_list)}
                
                response = {
                    "recommended_settings": labeled_settings,
                    "raw_values": settings_list,
                }
                
                await websocket.send_text(json.dumps(response))
                
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                await websocket.send_text(f"Error: Invalid JSON - {str(e)}")
            except Exception as e:
                print(f"Processing error: {e}")
                await websocket.send_text(f"Error: {str(e)}")

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)