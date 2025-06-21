import sys
import json
import requests
import os

def update_firebase(user, pr_id, new_scores, firebase_url, model):
    base_url = f"{firebase_url}/users/{user}"
    pr_url = f"{base_url}/pr_{pr_id}.json"
    cumulative_url = f"{base_url}/cumulative_score.json"

    pr_data = new_scores.copy()
    pr_data["model"] = model

    print(f"Uploading scores to: {pr_url}")
    pr_response = requests.put(pr_url, json=pr_data)
    if pr_response.ok:
        print(f"Scores for PR #{pr_id} uploaded.")
    else:
        print(f"Failed to upload PR scores: {pr_response.text}")
        return

    # Update cumulative score
    existing = requests.get(cumulative_url).json() or {}
    pr_count = existing.get("pr_count", 0)

    updated = {}
    for key in new_scores:
        prev_val = existing.get(key, 0)
        updated[key] = (prev_val * pr_count + new_scores[key]) / (pr_count + 1)

    updated["pr_count"] = pr_count + 1

    print(f"Updating cumulative score at: {cumulative_url}")
    cum_response = requests.put(cumulative_url, json=updated)
    if cum_response.ok:
        print("Cumulative score updated.")
    else:
        print(f"Failed to update cumulative score: {cum_response.text}")

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python upload_scores.py <pr_message_file> <github_user> <pr_id> <model>")
        sys.exit(1)

    pr_file = sys.argv[1]
    user = sys.argv[2]
    pr_id = sys.argv[3]
    model = sys.argv[4]
    firebase_url = os.getenv("FIREBASE_URL")

    if not firebase_url:
        print("FIREBASE_URL is not set.")
        sys.exit(1)

    with open(pr_file, 'r') as f:
        pr_data = f.read()

    try:
        scores = {
            "readability_score": None,
            "robustness_score": None,
            "vulnerability_score": None,
            "efficiency_score": None
        }

        for line in pr_data.splitlines():
            if line.lower().startswith("readability score:"):
                scores["readability_score"] = int(line.split(":")[1].strip())
            elif line.lower().startswith("robustness score:"):
                scores["robustness_score"] = int(line.split(":")[1].strip())
            elif line.lower().startswith("vulnerability score:"):
                scores["vulnerability_score"] = int(line.split(":")[1].strip())
            elif line.lower().startswith("efficiency score:"):
                scores["efficiency_score"] = int(line.split(":")[1].strip())

        print("PR body snippet:")
        print(pr_data[:300])
        print(f"Extracted Scores: {scores}")

        if all(v is not None for v in scores.values()):
            update_firebase(user, pr_id, scores, firebase_url, model)
        else:
            print("Not all scores found. Skipping Firebase upload.")

    except Exception as e:
        print(f"Failed to parse PR scores: {e}")
        sys.exit(1)
