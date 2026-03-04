import requests
import json

try:
    response = requests.get("http://localhost:8000/api/tratamentos/")
    data = response.json()
    print(json.dumps(data[:2], indent=2))
except Exception as e:
    print(e)
