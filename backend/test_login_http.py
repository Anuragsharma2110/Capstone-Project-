import urllib.request
import urllib.error
import json

url = "http://localhost:8000/api/auth/login/"
data = json.dumps({"username": "Admin@21", "password": "TestPass123!"}).encode('utf-8')
headers = {'Content-Type': 'application/json'}

req = urllib.request.Request(url, data=data, headers=headers)

try:
    response = urllib.request.urlopen(req)
    print("Success:")
    print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"HTTPError {e.code}:")
    print(e.read().decode('utf-8'))
except Exception as e:
    print(f"Error: {e}")
