// Background script to handle Firebase data fetching
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchScores' && request.repo) {
    const firebaseUrl = `https://prism-7d7a9-default-rtdb.firebaseio.com/repositories/${request.repo}/users.json`;
    
    fetch(firebaseUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Firebase returned status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error("Firebase fetch error:", error);
        sendResponse({ success: false, error: error.message });
      });
      
    return true; // Keep the message channel open for async response
  }
}); 