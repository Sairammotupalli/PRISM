// PR Scores Extension - Inline Modal Display
let scoresData = {};
let isModalOpen = false;

// Create and inject CSS styles
function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .pr-scores-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 9999;
      display: none;
      justify-content: center;
      align-items: center;
    }
    
    .pr-scores-modal.open {
      display: flex;
    }
    
    .pr-scores-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 1200px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans', Helvetica, Arial, sans-serif;
    }
    
    .pr-scores-header {
      padding: 20px;
      border-bottom: 1px solid #d0d7de;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f6f8fa;
      border-radius: 8px 8px 0 0;
    }
    
    .pr-scores-header h2 {
      margin: 0;
      color: #24292f;
      font-size: 20px;
      font-weight: 600;
    }
    
    .pr-scores-close {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #57606a;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
    }
    
    .pr-scores-close:hover {
      background: #d0d7de;
    }
    
    .pr-scores-body {
      padding: 20px;
    }
    
    .pr-scores-controls {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      align-items: center;
    }
    
    .pr-scores-search {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      font-size: 14px;
    }
    
    .pr-scores-sort {
      padding: 8px 12px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      font-size: 14px;
      background: white;
    }
    
    .user-section {
      margin-bottom: 24px;
      border: 1px solid #d0d7de;
      border-radius: 6px;
      overflow: hidden;
    }
    
    .user-header {
      padding: 16px;
      background: #f6f8fa;
      border-bottom: 1px solid #d0d7de;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .user-name {
      font-weight: 600;
      color: #24292f;
      font-size: 16px;
    }
    
    .cumulative-scores {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    
    .score-item {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid;
    }
    
    .score-item:nth-child(1) {
      background-color: #ddf4ff;
      color: #0969da;
      border-color: #79c0ff;
    }
    
    .score-item:nth-child(2) {
      background-color: #fff8dc;
      color: #9a6700;
      border-color: #fae17d;
    }
    
    .score-item:nth-child(3) {
      background-color: #dafbe1;
      color: #116329;
      border-color: #7ee787;
    }
    
    .score-item:nth-child(4) {
      background-color: #ffebe9;
      color: #cf222e;
      border-color: #ff8182;
    }
    
    .pr-list {
      padding: 0;
    }
    
    .pr-row {
      padding: 12px 16px;
      border-bottom: 1px solid #d0d7de;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    
    .pr-row:last-child {
      border-bottom: none;
    }
    
    .pr-title {
      font-weight: 500;
      color: #0969da;
      font-size: 14px;
    }
    
    .pr-meta {
      font-size: 12px;
      color: #57606a;
      flex: 1;
    }
    
    .pr-score {
      font-size: 12px;
      color: #57606a;
      white-space: nowrap;
    }
    
    .loading {
      text-align: center;
      padding: 40px;
      color: #57606a;
    }
    
    .error {
      text-align: center;
      padding: 40px;
      color: #cf222e;
    }
  `;
  document.head.appendChild(style);
}

// Calculate cumulative scores for each metric
function calculateCumulativeScores(userData) {
  let readabilityTotal = 0;
  let robustnessTotal = 0;
  let efficiencyTotal = 0;
  let securityTotal = 0;
  let prCount = 0;

  Object.entries(userData).forEach(([key, scores]) => {
    if (key !== 'cumulative_score') {
      readabilityTotal += scores.readability_score || 0;
      robustnessTotal += scores.robustness_score || 0;
      efficiencyTotal += scores.efficiency_score || 0;
      securityTotal += scores.security_score || 0;
      prCount++;
    }
  });

  if (prCount === 0) {
    return {
      readability: 'N/A',
      robustness: 'N/A',
      efficiency: 'N/A',
      security: 'N/A'
    };
  }

  return {
    readability: (readabilityTotal / prCount).toFixed(2),
    robustness: (robustnessTotal / prCount).toFixed(2),
    efficiency: (efficiencyTotal / prCount).toFixed(2),
    security: (securityTotal / prCount).toFixed(2)
  };
}

// Create the modal HTML
function createModal() {
  const modal = document.createElement('div');
  modal.className = 'pr-scores-modal';
  modal.id = 'pr-scores-modal';
  
  modal.innerHTML = `
    <div class="pr-scores-content">
      <div class="pr-scores-header">
        <h2>Pull Request Scores</h2>
        <button class="pr-scores-close" onclick="closePRScoresModal()">×</button>
      </div>
      <div class="pr-scores-body">
        <div class="pr-scores-controls">
          <input type="text" class="pr-scores-search" placeholder="Search PR ID or title..." id="pr-scores-search">
          <select class="pr-scores-sort" id="pr-scores-sort">
            <option value="user">Sort by User</option>
            <option value="model">Sort by Model</option>
          </select>
        </div>
        <div id="pr-scores-content">
          <div class="loading">Loading scores...</div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Add event listeners
  document.getElementById('pr-scores-search').addEventListener('input', filterScores);
  document.getElementById('pr-scores-sort').addEventListener('change', filterScores);
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closePRScoresModal();
    }
  });
}

// Fetch scores data
async function fetchScores() {
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ action: 'fetchScores' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
    
    if (response.success) {
      scoresData = response.data;
      renderScores();
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    document.getElementById('pr-scores-content').innerHTML = `
      <div class="error">Error loading scores: ${error.message}</div>
    `;
  }
}

// Render scores in the modal
function renderScores() {
  const searchTerm = document.getElementById('pr-scores-search').value.toLowerCase();
  const sortBy = document.getElementById('pr-scores-sort').value;
  
  const sortedUsers = Object.entries(scoresData).sort(([a], [b]) => {
    if (sortBy === 'user') return a.localeCompare(b);
    return 0;
  });
  
  let html = '';
  
  sortedUsers.forEach(([user, data]) => {
    const prEntries = Object.entries(data)
      .filter(([key]) => key !== "cumulative_score")
      .filter(([prId, scores]) =>
        prId.toLowerCase().includes(searchTerm) ||
        (`Update ${prId}.py`).toLowerCase().includes(searchTerm)
      )
      .sort(([aKey, aVal], [bKey, bVal]) => {
        if (sortBy === 'model') return (aVal.model || '').localeCompare(bVal.model || '');
        return 0;
      });
    
    if (prEntries.length === 0) return;
    
    const cumulativeScores = calculateCumulativeScores(data);
    
    html += `
      <div class="user-section">
        <div class="user-header">
          <div class="user-name">Contributor: ${user}</div>
          <div class="cumulative-scores">
            <span class="score-item">Readability: ${cumulativeScores.readability}</span>
            <span class="score-item">Robustness: ${cumulativeScores.robustness}</span>
            <span class="score-item">Efficiency: ${cumulativeScores.efficiency}</span>
            <span class="score-item">Security: ${cumulativeScores.security}</span>
          </div>
        </div>
        <div class="pr-list">
          ${prEntries.map(([prId, scores]) => `
            <div class="pr-row">
              <div class="pr-title">Pull Request: ${prId}</div>
              <div class="pr-meta">
                Clarity: ${scores.readability_score} | Robustness: ${scores.robustness_score} | Efficiency: ${scores.efficiency_score} | Security: ${scores.security_score}
              </div>
              <div class="pr-score">${scores.model}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  });
  
  if (html === '') {
    html = '<div class="loading">No scores found matching your search.</div>';
  }
  
  document.getElementById('pr-scores-content').innerHTML = html;
}

// Filter and sort scores
function filterScores() {
  if (Object.keys(scoresData).length > 0) {
    renderScores();
  }
}

// Open modal function
function openPRScoresModal() {
  if (!isModalOpen) {
    isModalOpen = true;
    document.getElementById('pr-scores-modal').classList.add('open');
    fetchScores();
  }
}

// Close modal function
function closePRScoresModal() {
  if (isModalOpen) {
    isModalOpen = false;
    document.getElementById('pr-scores-modal').classList.remove('open');
  }
}

// Inject PR Scores tab
function injectPRScoresTab() {
  const navBar = document.querySelector("ul.UnderlineNav-body");
  
  if (!navBar) return;
  if (document.querySelector("#pr-scores-tab")) return;
  
  const li = document.createElement("li");
  li.setAttribute("data-view-component", "true");
  li.className = "d-inline-flex";
  
  li.innerHTML = `
    <a id="pr-scores-tab"
       href="#"
       class="UnderlineNav-item no-wrap js-responsive-underlinenav-item"
       data-tab-item="i3pr-scores-tab"
       data-view-component="true">
      <svg aria-hidden="true" height="16" width="16" viewBox="0 0 16 16" version="1.1"
           class="octicon octicon-graph UnderlineNav-octicon d-none d-sm-inline">
        <path d="M1 13h14v1H1zM4 10h1v2H4zm3-5h1v7H7zm3 2h1v5h-1z"></path>
      </svg>
      <span data-content="PR Scores">PR Scores</span>
    </a>
  `;
  
  // Add click event listener
  const tab = li.querySelector('#pr-scores-tab');
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    openPRScoresModal();
  });
  
  navBar.appendChild(li);
}

// Initialize extension
function init() {
  injectStyles();
  createModal();
  
  // Make functions globally available
  window.openPRScoresModal = openPRScoresModal;
  window.closePRScoresModal = closePRScoresModal;
  
  // Use MutationObserver to wait for nav bar to be added
  const observer = new MutationObserver(() => {
    injectPRScoresTab();
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  // Also run immediately in case it's already loaded
  injectPRScoresTab();
}

// Start the extension
init();
