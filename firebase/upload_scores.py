import os
import json
import argparse
import requests

def get_llm_scores(directory):
    """Parses scores from JSON files in the specified directory."""
    scores = {}
    if not os.path.isdir(directory):
        print(f"Error: Scores directory not found at '{directory}'")
        return None
    for filename in os.listdir(directory):
        if filename.endswith('_scores.json'):
            try:
                with open(os.path.join(directory, filename), 'r') as f:
                    data = json.load(f)
                    scores.update(data)
            except (json.JSONDecodeError, IOError) as e:
                print(f"Error reading or parsing {filename}: {e}")
    return scores

def upload_to_firebase(firebase_url, repo_name, user, pr_id, pr_title, scores, model_name):
    """Uploads scores to Firebase RTDB using the REST API."""
    if not all([firebase_url, repo_name, user, pr_id, pr_title, scores, model_name]):
        print("Error: Missing one or more required arguments for Firebase upload.")
        return

    # Firebase keys cannot contain '.', '#', '$', '[', or ']'
    # The REST API can handle the '/' in the repo name directly in the URL path.
    # We still sanitize the user and pr_id just in case.
    safe_user = user.replace('.', '_')
    safe_pr_id = pr_id.replace('.', '_')
    
    # Construct the REST API URL
    url = f"{firebase_url}/repositories/{repo_name}/users/{safe_user}/{safe_pr_id}.json"
    
    upload_data = {
        'pr_title': pr_title,
        'readability_score': scores.get('readability_score'),
        'robustness_score': scores.get('robustness_score'),
        'efficiency_score': scores.get('efficiency_score'),
        'security_score': scores.get('security_score'),
        'model': model_name
    }
    
    try:
        response = requests.put(url, json=upload_data)
        response.raise_for_status()  # Raises an exception for 4xx/5xx errors
        print(f"Successfully uploaded scores for PR #{pr_id} to repo {repo_name}.")
        print(f"Data: {upload_data}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to upload to Firebase: {e}")
        print(f"Response Body: {response.text if 'response' in locals() else 'No response'}")

def main():
    """Main function to parse args and trigger upload."""
    firebase_url = os.getenv("FIREBASE_URL")
    if not firebase_url:
        print("Error: FIREBASE_URL environment variable is not set.")
        exit(1)

    parser = argparse.ArgumentParser(description="Parse LLM scores and upload to Firebase via REST API.")
    parser.add_argument("--repo_name", required=True, help="Repo name (e.g., 'owner/repo').")
    parser.add_argument("--user", required=True, help="GitHub username.")
    parser.add_argument("--pr_id", required=True, help="Pull Request ID.")
    parser.add_argument("--pr_title", required=True, help="Pull Request title.")
    parser.add_argument("--model_name", required=True, help="Name of the scoring model.")
    parser.add_argument("--scores_dir", default="scores", help="Directory with score files.")
    
    args = parser.parse_args()
    
    scores = get_llm_scores(args.scores_dir)
    
    if scores:
        upload_to_firebase(firebase_url, args.repo_name, args.user, args.pr_id, args.pr_title, scores, args.model_name)
    else:
        print("No valid scores found. Skipping Firebase upload.")

if __name__ == '__main__':
    main()
