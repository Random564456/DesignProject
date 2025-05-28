from tensorflow.keras.models import load_model

def load_generator_model(model_path="generator.keras"):
    model = load_model(model_path)
    return model
