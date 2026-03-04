import requests
import json

try:
    p_response = requests.get("http://localhost:8000/api/pacientes")
    pacientes = p_response.json()
    p_id = None
    for p in pacientes:
        if "Teste 123" in p.get("nome", ""):
            p_id = p["id"]
            break
            
    if not p_id:
        print("Test patient not found")
    else:
        print("found patient:", p_id)
        # Fetch ALL treatments for this patient
        t_response = requests.get(f"http://localhost:8000/api/tratamentos/?paciente_id={p_id}")
        tratamentos = t_response.json()
        print(json.dumps(tratamentos, indent=2))
except Exception as e:
    print(e)
