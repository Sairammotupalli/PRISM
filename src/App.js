import React, { useEffect, useState } from 'react';
import './App.css';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

const firebaseConfig = {
  databaseURL: "https://prism-7d7a9-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function App() {
  const [users, setUsers] = useState({});
  const [sortBy, setSortBy] = useState('user');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await get(ref(db, 'users'));
      if (snapshot.exists()) {
        setUsers(snapshot.val());
      }
    };

    fetchData();
  }, []);

  const calculateCumulativeScores = (userData) => {
    let readabilityTotal = 0;
    let robustnessTotal = 0;
    let efficiencyTotal = 0;
    let vulnerabilityTotal = 0;
    let validPRCount = 0;
  
    const isValidScore = (val) => val === -1 || val === 0 || val === 1;
  
    Object.entries(userData).forEach(([key, scores]) => {
      if (key !== 'cumulative_score' && typeof scores === 'object') {
        const r = scores.readability_score;
        const b = scores.robustness_score;
        const e = scores.efficiency_score;
        const s = scores.vulnerability_score;
  
        const allValid =
          isValidScore(r) &&
          isValidScore(b) &&
          isValidScore(e) &&
          isValidScore(s);
  
        if (allValid) {
          readabilityTotal += r;
          robustnessTotal += b;
          efficiencyTotal += e;
          vulnerabilityTotal += s;
          validPRCount++;
        }
      }
    });
  
    if (validPRCount === 0) {
      return {
        readability: 'N/A',
        robustness: 'N/A',
        efficiency: 'N/A',
        vulnerability: 'N/A'
      };
    }
  
    return {
      readability: (readabilityTotal / validPRCount).toFixed(2),
      robustness: (robustnessTotal / validPRCount).toFixed(2),
      efficiency: (efficiencyTotal / validPRCount).toFixed(2),
      vulnerability: (vulnerabilityTotal / validPRCount).toFixed(2)
    };
  };

  const sortedUsers = Object.entries(users).sort(([a], [b]) => {
    if (sortBy === 'user') return a.localeCompare(b);
    return 0;
  });

  return (
    
    <div className="github-wrapper">
    <div className="back-wrapper">
      <a
        href="https://github.com/Sairammotupalli/PRISM"
        className="back-button"
        target="_blank"
        rel="noopener noreferrer"
      >
        ← Back
      </a>
    </div>

    <div className="github-header">
      <h2>Pull Request Scores</h2>
  </div>

      <div className="github-body">
        <div className="controls-bar">
          <input
            type="text"
            placeholder="Search PR ID or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select onChange={(e) => setSortBy(e.target.value)} value={sortBy}>
            <option value="user">Sort by User</option>
            <option value="model">Sort by Model</option>
          </select>
        </div>

        {sortedUsers.map(([user, data]) => {
          const prEntries = Object.entries(data)
            .filter(([key]) => key !== "cumulative_score")
            .filter(([prId, scores]) =>
              prId.toLowerCase().includes(search.toLowerCase()) ||
              (`Update ${prId}.py`).toLowerCase().includes(search.toLowerCase())
            )
            .sort(([aKey, aVal], [bKey, bVal]) => {
              if (sortBy === 'model') return (aVal.model || '').localeCompare(bVal.model || '');
              return 0;
            });

          if (prEntries.length === 0) return null;

          return (
            <div key={user} className="user-section">
              <div className="user-header">
                Contributor: {user}
                <div className="cumulative-scores">
                  <span className="score-item">Readability: {calculateCumulativeScores(data).readability}</span>
                  <span className="score-item">Robustness: {calculateCumulativeScores(data).robustness}</span>
                  <span className="score-item">Efficiency: {calculateCumulativeScores(data).efficiency}</span>
                  <span className="score-item">Vulnerability: {calculateCumulativeScores(data).vulnerability}</span>
                </div>
              </div>

              <div className="pr-list">
                {prEntries.map(([prId, scores]) => (
                  <div key={prId} className="pr-row">
                    <div className="pr-title">Pull Request : {prId}</div>
                    <div className="pr-meta">
                     Readability Score: {scores.readability_score} |  Robustness Score: {scores.robustness_score}  | Efficiency Score: {scores.efficiency_score}  | Vulnerability Score: {scores.vulnerability_score}
                    </div>
                    <div className="pr-score">{scores.model}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
