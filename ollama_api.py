from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import os
import json

# Initialize FastAPI
app = FastAPI()

# Request model
class PromptRequest(BaseModel):
    model: str
    prompt: str

# Ensure API Server URL is set
FAST_API_SERVER_URL = os.getenv("FAST_API_SERVER_URL", "http://localhost:11434/api/chat")

@app.get("/")
def home():
    return {"message": "LLM API is running via FastAPI & ngrok!"}

@app.post("/generate")
def generate_text(request: PromptRequest):
    """
    Sends a prompt to the appropriate LLM API and returns the parsed response.
    """
    try:
        model = request.model.lower()

        if model not in ["deepseek-r1", "llama3.2", "mistral"]:
            raise HTTPException(status_code=400, detail=f"Unsupported model: {model}")

        payload = {
            "model": model,
            "messages": [{"role": "user", "content": request.prompt}],
            "stream": False,
            "format": {
                "type": "object",
                "properties": {
                    "readability_score": {"type": "integer", "enum": [-1, 0, 1]},
                    "robustness_score": {"type": "integer", "enum": [-1, 0, 1]},
                    "vulnerability_score": {"type": "integer", "enum": [-1, 0, 1]},
                    "performance_score": {"type": "integer", "enum": [-1, 0, 1]},
                    "output": {"type": "string"}
                },
                "required": [
                    "readability_score",
                    "robustness_score",
                    "vulnerability_score",
                    "performance_score",
                    "output"
                ]
            }
        }

        print(f"Debug: Forwarding request to {model} API at {FAST_API_SERVER_URL}")
        response = requests.post(FAST_API_SERVER_URL, json=payload)
        response_json = response.json()
        print(f"Debug: Received response from {model} API: {response_json}")

        # Parse nested content if present
        if "message" in response_json and "content" in response_json["message"]:
            content_str = response_json["message"]["content"]
            try:
                parsed_output = json.loads(content_str)
            except json.JSONDecodeError as e:
                print(f"Error decoding model output: {e}")
                parsed_output = {
                    "readability_score": 2,
                    "robustness_score": 2,
                    "vulnerability_score": 2,
                    "performance_score": 2,
                    "output": "Error decoding response."
                }
        else:
            response_obj = response_json.get("response", {})
            if isinstance(response_obj, dict):
                parsed_output = response_obj
            else:
                parsed_output = {"output": str(response_obj).strip()}
                
        return {"response": parsed_output}

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
