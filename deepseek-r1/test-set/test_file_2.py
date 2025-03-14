import requests
import base64
import json
import os

# GitHub API Token (Ensure it is valid and has the required permissions)
GITHUB_TOKEN = 'ghp_WhGWUNNEJC6rUIQR1QviCJt9EBp0nL0dX4zK'  
HEADERS = {'Authorization': f'token {GITHUB_TOKEN}'}

def get_pull_request_details(owner, repo, pr_id):
    
    pr_url = f'https://api.github.com/repos/{owner}/{repo}/pulls/{pr_id}'
    print(pr_id)
    res = requests.get(pr_url, headers=HEADERS)
    
    if res.status_code == 200:
        pr_data = res.json()
        return {
            "Title": pr_data.get('title', 'N/A'),
            "Mergeable": pr_data.get('mergeable', False)
        }

def get_pull_request_files(owner, repo, pr_id):
    
    files_url = f'https://api.github.com/repos/{owner}/{repo}/pulls/{pr_id}/files'
    res = requests.get(files_url, headers=HEADERS)
    
    if res.status_code == 200:
        return res.json()
