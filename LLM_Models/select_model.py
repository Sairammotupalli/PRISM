import json

MODEL_MAP = {
    "deepseek-r1": "LLM_Models/deepseek-r1_main.py",
    "llama3.2": "LLM_Models/llama3.2_main.py",
    "mistral": "LLM_Models/mistral_main.py",
    "chatgpt": "LLM_Models/chatgpt_main.py",
    "claude": "LLM_Models/claude_main.py"
}

def main():
    model = "deepseek-r1"
    path = MODEL_MAP.get(model)
    
    if not path:
        print(f"Unsupported model: {model}")
        return

    config = {
        "model": model,
        "script_path": path
    }

    with open("model_config.json", "w") as f:
        json.dump(config, f)

    print(f"Model '{model}' selected and written to model_config.json")

if __name__ == "__main__":
    main()
