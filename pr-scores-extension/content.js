// PR Scores Extension - Inline Page Display

let scoresData = {};
let pageContainer = null;
let isActive = false;
let repoName = null;

// Create and inject CSS styles
function injectStyles() {
  const style = document.createElement('style');
  // Styles are simpler now, matching GitHub's layout
  style.textContent = `
    #pr-scores-container {
      display: none;
    }
    #pr-scores-container.active {
      display: block;
    }
    .pr-scores-body {
      padding: 20px;
    }
    /* Add other styles from the previous version as needed, but without modal stuff */
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
    .score-item:nth-child(1) { background-color: #ddf4ff; color: #0969da; border-color: #79c0ff; }
    .score-item:nth-child(2) { background-color: #fff8dc; color: #9a6700; border-color: #fae17d; }
    .score-item:nth-child(3) { background-color: #dafbe1; color: #116329; border-color: #7ee787; }
    .score-item:nth-child(4) { background-color: #ffebe9; color: #cf222e; border-color: #ff8182; }
    .pr-list { padding: 0; }
    .pr-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 20px;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #d0d7de;
    }
    .pr-row:last-child { border-bottom: none; }
    .pr-title { font-weight: 600; color: #0969da; white-space: nowrap; font-size: 14px; }
    .pr-meta {
      text-align: center;
      color: #57606a;
      font-size: 13px;
      display: flex;
      justify-content: center;
      gap: 20px;
    }
    .pr-score { font-weight: 500; color: #24292e; white-space: nowrap; justify-self: end; }
    .loading, .error { text-align: center; padding: 40px; color: #57606a; }
    .error { color: #cf222e; }
    h2 { margin-bottom: 16px; }
  `;
  document.head.appendChild(style);
}

// Function to find the main content area of GitHub
function getRepoMainContent() {
  // This selector might need updates if GitHub changes its layout.
  // It targets the container that holds the file browser, readme, etc.
  const repoContent = document.querySelector('.repository-content');
  
  // Also get the repo name from the URL
  const pathParts = window.location.pathname.split('/').filter(p => p);
  if (pathParts.length >= 2) {
    repoName = `${pathParts[0]}/${pathParts[1]}`;
  }
  
  return repoContent;
}

// Create the container for our UI
function createPageContainer() {
  const mainContent = getRepoMainContent();
  if (mainContent && !document.getElementById('pr-scores-container')) {
    pageContainer = document.createElement('div');
    pageContainer.id = 'pr-scores-container';
    
    pageContainer.innerHTML = `
      <div class="pr-scores-body">
        <div class="pr-scores-controls">
          <input type="text" class="pr-scores-search" placeholder="Search PR ID or title..." id="pr-scores-search">
          <select class="pr-scores-sort" id="pr-scores-sort">
            <option value="user">Sort by User</option>
            <option value="model">Sort by Model</option>
          </select>
        </div>
        <div id="pr-scores-content-area">
          <div class="loading">Loading scores...</div>
        </div>
      </div>
    `;
    
    // Insert our container after the main content area and hide it initially
    mainContent.parentNode.insertBefore(pageContainer, mainContent.nextSibling);
    
    // Add event listeners for controls
    document.getElementById('pr-scores-search').addEventListener('input', renderScores);
    document.getElementById('pr-scores-sort').addEventListener('change', renderScores);
  }
}

// Show PR Scores view and hide the original content
function showPRScoresView() {
  const mainContent = getRepoMainContent();
  if (!mainContent || !pageContainer) return;

  // Hide all direct children of the main content's parent
  Array.from(mainContent.parentNode.children).forEach(child => {
      if (child.id !== 'pr-scores-container' && child.tagName !== 'HEADER') { // Keep header visible
          child.style.display = 'none';
      }
  });

  pageContainer.style.display = 'block';
  pageContainer.classList.add('active');

  // Mark our tab as selected
  const navItems = document.querySelectorAll('.UnderlineNav-item');
  navItems.forEach(item => item.classList.remove('selected'));
  document.querySelector('#pr-scores-tab')?.classList.add('selected');
  
  isActive = true;
  if (Object.keys(scoresData).length === 0) {
      fetchScores();
  } else {
      renderScores();
  }
}

// Hide PR Scores view and show the original content
function hidePRScoresView() {
    const mainContent = getRepoMainContent();
    if (!mainContent || !pageContainer) return;

    // Show all direct children of the main content's parent again
    Array.from(mainContent.parentNode.children).forEach(child => {
        if (child.id !== 'pr-scores-container') {
            child.style.display = ''; // Revert to default display
        }
    });

    pageContainer.style.display = 'none';
    pageContainer.classList.remove('active');

    // Deselect our tab (GitHub's own navigation will handle selecting the correct one)
    document.querySelector('#pr-scores-tab')?.classList.remove('selected');

    isActive = false;
}

// Fetch scores data
async function fetchScores() {
  const contentArea = document.getElementById('pr-scores-content-area');
  if (!repoName) {
    contentArea.innerHTML = `<div class="error">Could not determine repository name from URL.</div>`;
    return;
  }

  try {
    // Path: repositories/{repo_name}/users.json
    const safeRepoName = repoName.replace('/', '--');
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ 
        action: 'fetchScores',
        repo: safeRepoName 
      }, (response) => {
        if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
        else resolve(response);
      });
    });
    
    if (response.success) {
      scoresData = response.data;
      renderScores();
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    contentArea.innerHTML = `<div class="error">Error loading scores: ${error.message}</div>`;
  }
}

// Render scores in the page
function renderScores() {
  if (!isActive) return; // Don't render if not visible

  const contentArea = document.getElementById('pr-scores-content-area');
  const searchTerm = document.getElementById('pr-scores-search').value.toLowerCase();
  const sortBy = document.getElementById('pr-scores-sort').value;
  
  let headerHtml = `<h2>Scores for ${repoName}</h2>`;
  if (!scoresData || Object.keys(scoresData).length === 0) {
      contentArea.innerHTML = headerHtml + '<div class="loading">No scores found for this repository.</div>';
      return;
  }

  const sortedUsers = Object.entries(scoresData).sort(([a], [b]) => {
    if (sortBy === 'user') return a.localeCompare(b);
    return 0;
  });
  
  let html = '';
  sortedUsers.forEach(([user, data]) => {
    const prEntries = Object.entries(data)
      .filter(([key]) => key !== "cumulative_score")
      .filter(([prId, scores]) => {
        return prId.toLowerCase().includes(searchTerm.toLowerCase());
      })
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
            <span class="score-item">Vulnerability: ${cumulativeScores.vulnerability}</span>
          </div>
        </div>
        <div class="pr-list">
          ${prEntries.map(([prId, scores]) => `
            <div class="pr-row">
              <div class="pr-title">Pull Request #${prId.replace('pr_', '')}</div>
              <div class="pr-meta">
                <span>Readability: ${scores.readability_score || 'N/A'}</span>
                <span>Robustness: ${scores.robustness_score || 'N/A'}</span>
                <span>Efficiency: ${scores.efficiency_score || 'N/A'}</span>
                <span>Vulnerability: ${scores.vulnerability_score || 'N/A'}</span>
              </div>
              <div class="pr-score">${scores.model || 'N/A'}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
  });
  
  contentArea.innerHTML = headerHtml + (html || '<div class="loading">No scores found matching your search.</div>');
}


// Calculate cumulative scores (no changes needed here)
function calculateCumulativeScores(userData) {
    let readabilityTotal = 0, robustnessTotal = 0, efficiencyTotal = 0, vulnerabilityTotal = 0, prCount = 0;
    Object.entries(userData).forEach(([key, scores]) => {
      if (key !== 'cumulative_score') {
        readabilityTotal += scores.readability_score || 0;
        robustnessTotal += scores.robustness_score || 0;
        efficiencyTotal += scores.efficiency_score || 0;
        vulnerabilityTotal += scores.vulnerability_score || 0;
        prCount++;
      }
    });
    if (prCount === 0) return { readability: 'N/A', robustness: 'N/A', efficiency: 'N/A', vulnerability: 'N/A' };
    return {
      readability: (readabilityTotal / prCount).toFixed(2),
      robustness: (robustnessTotal / prCount).toFixed(2),
      efficiency: (efficiencyTotal / prCount).toFixed(2),
      vulnerability: (vulnerabilityTotal / prCount).toFixed(2)
    };
}


// Inject PR Scores tab and set up event listeners
function injectPRScoresTab() {
  const navBar = document.querySelector("ul.UnderlineNav-body");
  if (!navBar || document.querySelector("#pr-scores-tab")) return;
  
  // Check if we are in a repository context
  const repoNameParts = window.location.pathname.split('/').filter(p => p);
  if (repoNameParts.length < 2) return; // Not in a repo

  const li = document.createElement("li");
  li.setAttribute("data-view-component", "true");
  li.className = "d-inline-flex";
  
  li.innerHTML = `
    <a id="pr-scores-tab" href="#" class="UnderlineNav-item no-wrap js-responsive-underlinenav-item">
      <svg aria-hidden="true" height="16" width="16" viewBox="0 0 16 16" version="1.1" class="octicon octicon-graph UnderlineNav-octicon d-none d-sm-inline">
        <path d="M1 13h14v1H1zM4 10h1v2H4zm3-5h1v7H7zm3 2h1v5h-1z"></path>
      </svg>
      <span data-content="PR Scores">PR Scores</span>
    </a>
  `;
  
  // Add click listener to OUR tab
  const tab = li.querySelector('#pr-scores-tab');
  tab.addEventListener('click', (e) => {
    e.preventDefault();
    showPRScoresView();
  });
  
  navBar.appendChild(li);

  // Add click listeners to OTHER tabs to hide our view
  navBar.querySelectorAll('a:not(#pr-scores-tab)').forEach(otherTab => {
      otherTab.addEventListener('click', () => {
          if(isActive) hidePRScoresView();
      });
  });
}

// Initialize extension
function init() {
  injectStyles();
  // We need to wait for GitHub's UI to be ready, especially with single-page navigation
  const observer = new MutationObserver((mutations) => {
    // Look for the main nav bar to appear
    if (document.querySelector("ul.UnderlineNav-body")) {
      injectPRScoresTab();
      createPageContainer();
    }
    // Handle GitHub's SPA navigation (PJAX)
    const pjaxContainer = document.querySelector('[data-pjax-container]');
    if (pjaxContainer && isActive) {
        // If navigation happens while our tab is active, deactivate it
        // to show the new page content.
        hidePRScoresView();
        // GitHub's JS will handle selecting the correct new tab
    }
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
}

init();
