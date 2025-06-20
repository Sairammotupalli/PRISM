import os
import json
import argparse
import firebase_admin
from firebase_admin import credentials, db

def get_llm_scores(directory):
    """Parses scores from JSON files."""
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

def upload_to_firebase(repo_name, user, pr_id, pr_title, scores, model_name):
    """Uploads scores to Firebase RTDB under a repository-specific path."""
    if not all([repo_name, user, pr_id, pr_title, scores, model_name]):
        print("Error: Missing arguments for Firebase upload.")
        return
    
    # Firebase keys cannot contain '.', '#', '$', '[', or ']'
    safe_repo_name = repo_name.replace('/', '--')
    ref = db.reference(f'repositories/{safe_repo_name}/users/{user}/{pr_id}')
    
    try:
        upload_data = {
            'pr_title': pr_title,
            'readability_score': scores.get('readability_score'),
            'robustness_score': scores.get('robustness_score'),
            'efficiency_score': scores.get('efficiency_score'),
            'security_score': scores.get('security_score'),
            'model': model_name
        }
        ref.set(upload_data)
        print(f"Successfully uploaded scores for PR #{pr_id} to repo {repo_name}.")
    except Exception as e:
        print(f"Failed to upload to Firebase: {e}")

def main():
    """Main function to parse args and trigger upload."""
    parser = argparse.ArgumentParser(description="Parse LLM scores and upload to Firebase.")
    parser.add_argument("--repo_name", required=True, help="Repo name (e.g., 'owner/repo').")
    parser.add_argument("--user", required=True, help="GitHub username.")
    parser.add_argument("--pr_id", required=True, help="Pull Request ID.")
    parser.add_argument("--pr_title", required=True, help="Pull Request title.")
    parser.add_argument("--model_name", required=True, help="Name of the scoring model.")
    parser.add_argument("--scores_dir", default="scores", help="Directory with score files.")
    
    args = parser.parse_args()
    
    scores = get_llm_scores(args.scores_dir)
    
    if scores:
        upload_to_firebase(args.repo_name, args.user, args.pr_id, args.pr_title, scores, args.model_name)
    else:
        print("No valid scores found. Skipping Firebase upload.")

if __name__ == '__main__':
    try:
        cred_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS', 'serviceAccountKey.json')
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://prism-7d7a9-default-rtdb.firebaseio.com'
        })
    except Exception as e:
        print(f"CRITICAL: Firebase initialization failed: {e}")
        exit(1)
    
    main()
