from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from model_loader import load_generator_model

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with your frontend URL if you want to restrict it
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Updated Pydantic model to match frontend data structure
class Settings(BaseModel):
    feed_solids: float
    production_solids: float
    steam_solids: float
    steam_pressure: float
    out_flow: float
    TFE_production_solids: float
    vacuum_pressure: float
    TFE_steam_solids: float

LATENT_DIM = 23  

generator_model = load_generator_model()

@app.post("/predict")
async def predict_settings(settings: Settings):
    try:
        # Convert the settings to a list - this matches the 8 inputs expected
        input_values = [
            settings.feed_solids / 100.0,  # Normalize to 0-1 range
            settings.production_solids / 100.0,
            settings.steam_solids / 100.0,
            settings.steam_pressure / 100.0,
            settings.out_flow / 100.0,
            settings.TFE_production_solids / 100.0,
            settings.vacuum_pressure / 100.0,
            settings.TFE_steam_solids / 100.0
        ]
        
             
        sensors_array = np.array(input_values).reshape(1, -1).astype(np.float32)

        try:
            noise = np.random.normal(0, 1, (1, LATENT_DIM)).astype(np.float32)
            predicted_settings = generator_model.predict([sensors_array, noise])
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model prediction error: {str(e)}")
        
        settings_list = predicted_settings[0].tolist()
                
        
        # Format output with meaningful labels
        setting_names = [
            "FFTE Feed solids SP",
            "FFTE Production solids SP",
            "FFTE Steam pressure SP", 
            "TFE Out flow SP",
            "TFE Production solids SP",
            "TFE Vacuum pressure SP",
            "TFE Steam pressure SP",
        ]
        
        # Create labeled output
        labeled_settings = {name: round(val * 100, 0) for name, val in zip(setting_names, settings_list)}
        
        return {
            "recommended_settings": labeled_settings,
            "raw_values": settings_list,
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model prediction error: {str(e)}")