import os
import sys
import json
import anthropic
from anthropic import Anthropic
import re
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")

if not ANTHROPIC_API_KEY:
    print("Error: ANTHROPIC_API_KEY environment variable not set.")
    sys.exit(1)

# Initialize the Anthropic client
client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

anthropic_client = Anthropic(api_key=ANTHROPIC_API_KEY)


def generate_pr_description(diff_content, pr_number):
    
    prompt=""" Using the given code changes,

1.Analyze and give an overall score for the updated code based on Readability, Maintainability, and Clarity. 

The return format should be in the below json format:
{{
    "readability_score": “<score>”,
    "output": "<text explanation for the score>”
}}

Be careful while analyzing the code. Make sure to identify all the code changes and double-check the answer. Use the checkboxes and scoring criteria below while assigning the score.

—

Checkboxes:
1. Clear Naming Conventions (Function and variable names are meaningful, self-explanatory and easy to understand.)
2. Documentation (Code includes meaningful inline comments explaining logic and purpose.)
3. Formatting & Styling (Code follows consistent indentation and spacing.)
4. Maintainability (Code is easy to extend or modify.)
5. Code Length (Logic is broken down into simpler parts.)

Scoring Criteria:
readability_score: 1 (Excellent) Code meets all readability, maintainability, and clarity standards. Naming is clear, documentation is informative, formatting is consistent, code structure is easy to modify, and functions are not excessively long.  
readability_score: 0 (Moderate) Code is largely readable and maintainable but has a scope for improvement.  
readability_score: -1 (Poor) Code is highly unreadable.

"""
    prompt+="""
    
2. Analyze and give an overall score for the updated code based on Robustness and Error handling. 

The return format should be in the below json format:
{{
    "robustness_score": “<score>”,
    "output": "<text explanation for the score>”
}}

Be careful while analyzing the code. Make sure to identify all the code changes and double-check the answer. Use the checkboxes and scoring criteria below while assigning the score.

—

Checkboxes:
1. Error Finding (No syntax, runtime and logical errors in the code.)
2. Error Handling (Code uses `try-except` for handling exceptions properly if applicable)
3. Edge Cases (Correctly handles edge cases like extreme, unusual, or unexpected inputs)
4. Input Validation (Code checks for invalid inputs)
5. No Infinite Loops (Code ensures that loops have a proper termination condition to avoid endless execution if found)

Scoring Criteria:
	robustness_score: 1 (Excellent) No errors found and follows all the checkboxes.
	robustness_score: 0 (Moderate) No errors found and does not follow all the checkboxes. 
	robustness_score: - 1 (Poor) A lot of errors found and does not follow all the checkboxes.
 """
    prompt+="""

3. Analyze and give an overall score for the updated code based on Security and Vulnerability. 
The return format should be in the below json format:
{{
    "vulnerability_score": “<score>”,
    "output": "<text explanation for the score>”
}}

Be careful while analyzing the code. Make sure to identify all the code changes and double-check the answer. Use the checkboxes and scoring criteria below while assigning the score.

—

Checkboxes:
1. No Security Threats Code does not have injection flaws like SQL injection, Code injection, Command injection, XSS and other injections, buffer overflows, insecure data storage, improper input validation, race conditions, logic flaws, authorization issues, information leakage, denial-of-service (DoS) vulnerabilities, unpatched software, misconfigurations, and hardcoded credentials)
2. No Authentication & Authorization issues
3. No Hard Coded Secrets (There is not  any hardcoded credentials, API keys, or sensitive information)
4. No Secure Dependencies (There is not outdated and insecure third-party libraries)
5. Proper Session Management (Session expiration is perfect and handle token handling securely)

Scoring Criteria:
	vulnerability_score: 1 (Excellent) No security or vulnerability issues and follows all the checkboxes.
	vulnerability_score: 0 (Moderate) A few security or vulnerability issues and mostly follows checkboxes.
	vulnerability_score: -1 (Poor) A lot of security and vulnerability issues and does not follows all checkboxes.
"""
    
    prompt+="""
    
4. And Give an overall score for the updated based on performance and efficiency. 

The return format should be in the below json format:
{{
    "efficiency_score": “<score>”,
    "output": "<text explanation for the score>”
}}

Be careful while analyzing the code. Make sure to identify all the code changes and double-check the answer. Use the checkboxes and scoring criteria below while assigning the score.

—

Checkboxes:
1. Improved Time Complexity (Code runs more efficiently than before.)
2. Improved Space Complexity (Code uses less memory than before.)
3. No Redundant Computation (No unnecessary and unused loops, recalculations, or duplicate operations, methods, and variables)


Scoring Criteria:
efficiency_score: 1 (Excellent) The code has improved either time complexity or space complexity and there are no unnecessary computations. 
efficiency_score: 0 (Moderate) The code has not improved time or space complexity and slightly follows checkboxes.
efficiency_score: -1 (Poor) The code reduces the time or space complexity and does not follow any of the checkboxes.
"""    	
    prompt+=f""" code changes for the Pull Request ID {pr_number}:### Code Changes (Diff):{diff_content}"""
	
    return prompt
    
def analyze_with_llm(repo_name, pr_id, prompt):
    try:
        print(f"Making API call for {repo_name} PR {pr_id}...")
        
        message = client.messages.create(
            model="claude-3-7-sonnet-20250219",
            max_tokens=2048,
            system="You must respond with a single JSON object containing exactly these keys: readability_score, robustness_score, vulnerability_score, efficiency_score, output. The output field should contain a comprehensive explanation covering all four scores.",
            messages=[{"role": "user", "content": prompt}]
        )

        if not message.content or len(message.content) == 0:
            print(f"No content received from API for PR {pr_id}")
            return "Analysis failed: No response from Claude API"

        response_text = message.content[0].text
        print(f"\n===== Raw Response from Claude (PR_ID {pr_id}) =====\n")
        print(response_text)

        # Save raw response for debug
        with open("claude_raw_response.json", "w") as f:
            f.write(response_text)

        # Clean markdown formatting (```json ... ```)
        cleaned = re.sub(r"^```json\s*|^```\s*|```\s*$", "", response_text.strip(), flags=re.MULTILINE).strip()

        try:
            response_json = json.loads(cleaned)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            print(f"Cleaned response: {cleaned}")
            return f"Analysis failed: Invalid JSON response - {str(e)}"

        # Validate keys
        expected_keys = ["readability_score", "robustness_score", "vulnerability_score", "efficiency_score", "output"]
        missing_keys = [k for k in expected_keys if k not in response_json]
        
        if missing_keys:
            print(f"Missing keys in Claude response for PR {pr_id}: {missing_keys}")
            print(f"Available keys: {list(response_json.keys())}")
            return f"Analysis failed: Missing required keys - {missing_keys}"

        # Format final result
        result = (
            f"Readability Score: {response_json['readability_score']}\n"
            f"Robustness Score: {response_json['robustness_score']}\n"
            f"Vulnerability Score: {response_json['vulnerability_score']}\n"
            f"Efficiency Score: {response_json['efficiency_score']}\n"
            f"\nExplanation:\n{response_json['output']}"
        )
        
        print(f"Analysis completed successfully for PR {pr_id}")
        
        # CRITICAL: Write result to pr_description.txt
        with open("pr_description.txt", "w") as f:
            f.write(result)
        print("Successfully wrote result to pr_description.txt")
        
        return result

    except Exception as e:
        error_msg = f"Analysis failed for {repo_name} PR {pr_id}: {str(e)}"
        print(error_msg)
        
        # CRITICAL: Write error message to pr_description.txt
        with open("pr_description.txt", "w") as f:
            f.write(error_msg)
        print("Wrote error message to pr_description.txt")
        
        return error_msg


if __name__ == "__main__":
    print("=== STARTING CLAUDE ANALYSIS SCRIPT ===")
    print(f"API Key present: {bool(ANTHROPIC_API_KEY)}")
    
    if len(sys.argv) < 3:
        print("Error: Missing required arguments. Usage: python main.py <diff_file_path> <pr_number>")
        sys.exit(1)
    
    diff_file_path = sys.argv[1]
    pr_number = sys.argv[2]
    
    try:
        print(f"Reading diff file: {diff_file_path}")
        with open(diff_file_path, "r") as f:
            diff_content = f.read().strip()
        
        if not diff_content:
            print("Warning: The diff file is empty. No content to process.")
            pr_body = "No changes detected in this PR."
            with open("pr_description.txt", "w") as f:
                f.write(pr_body)
        else:
            print("Generating prompt for Claude...")
            # Generate the prompt (this doesn't call the API, just creates the prompt)
            prompt = generate_pr_description(diff_content, pr_number)
            
            print("Calling Claude API...")
            # NOW call Claude with the prompt
            pr_body = analyze_with_llm("repo", pr_number, prompt)
            
            # analyze_with_llm already writes to pr_description.txt, but let's ensure it
            if pr_body:
                with open("pr_description.txt", "w") as f:
                    f.write(pr_body)
                print("PR description saved successfully to pr_description.txt")
            else:
                print("Error: No response from Claude")
                with open("pr_description.txt", "w") as f:
                    f.write("Error: No response from Claude API")
        
    except FileNotFoundError:
        print(f"Error: Diff file '{diff_file_path}' not found.")
        error_msg = f"Error: Diff file '{diff_file_path}' not found."
        with open("pr_description.txt", "w") as f:
            f.write(error_msg)
        sys.exit(1)
    except Exception as e:
        print(f"Unexpected Error: {e}")
        error_msg = f"Unexpected Error: {e}"
        with open("pr_description.txt", "w") as f:
            f.write(error_msg)
        sys.exit(1)
    
    print("=== CLAUDE ANALYSIS SCRIPT COMPLETED ===")
    
    # Debug: Check if file was created
    try:
        with open("pr_description.txt", "r") as f:
            content = f.read()
            print(f"Final pr_description.txt content length: {len(content)}")
            if len(content) > 0:
                print("pr_description.txt has content")
            else:
                print("pr_description.txt is empty")
    except FileNotFoundError:
        print("pr_description.txt file not found")
