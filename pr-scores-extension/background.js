// Background script to handle Firebase data fetching
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'fetchScores') {
    fetch('https://prism-7d7a9-default-rtdb.firebaseio.com/users.json')
      .then(response => response.json())
      .then(data => {
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
}); 