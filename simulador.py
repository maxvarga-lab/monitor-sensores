import requests
import time
import random

# URL exacta de tu base de datos de Firebase
FIREBASE_URL = "https://datos-sensores-5df32-default-rtdb.firebaseio.com/sensores.json"

print("Enviando datos a tu Firebase... Presiona Ctrl+C para detener.")

while True:
    datos = {
        "ecg": random.randint(65,95),
        "emg": round(random.uniform(15.0, 188.0),1),
    }
    
    try:
        # Envía la información a Firebase
        respuesta = requests.put(FIREBASE_URL, json=datos)
        
        if respuesta.status_code == 200:
            print(f"Enviado con éxito a Firebase: {datos}")
        else:
            print(f"Error al enviar. Código HTTP: {respuesta.status_code}")
    except Exception as e:
        print(f"Error de conexión: {e}")
        
    time.sleep(2)  