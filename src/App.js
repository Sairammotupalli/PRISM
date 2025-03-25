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

  const calculateOverallScore = (userData) => {
    let totalScore = 0;
    let prCount = 0;

    Object.entries(userData).forEach(([key, scores]) => {
      if (key !== 'cumulative_score') {
        const avgScore = (
          (scores.readability_score || 0) +
          (scores.robustness_score || 0) +
          (scores.performance_score || 0) +
          (scores.security_score || 0)
        ) / 4;
        totalScore += avgScore;
        prCount++;
      }
    });

    return prCount > 0 ? (totalScore / prCount).toFixed(2) : 'N/A';
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
                <span className="overall-score">Overall Score: {calculateOverallScore(data)}</span>
              </div>

              <div className="pr-list">
                {prEntries.map(([prId, scores]) => (
                  <div key={prId} className="pr-row">
                    <div className="pr-title">Pull Request : {prId}</div>
                    <div className="pr-meta">
                     Clarity: {scores.readability_score} |  Robustness: {scores.robustness_score}  | Efficiency: {scores.performance_score}  | Security: {scores.security_score}
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
