// App.js
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

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await get(ref(db, 'users'));
      if (snapshot.exists()) {
        setUsers(snapshot.val());
      }
    };

    fetchData();
  }, []);

  return (
    <div className="github-wrapper">
      <div className="github-header">
        <h2>📋 Pull Request Scores</h2>
      </div>

      <div className="github-body">
        <div className="search-bar">
          <input type="text" placeholder="Search pull requests..." disabled />
        </div>

        {Object.entries(users).map(([user, data]) => (
          <div key={user} className="user-section">
            <div className="user-header">{user}</div>

            <div className="pr-list">
              {Object.entries(data)
                .filter(([key]) => key !== "cumulative_score")
                .map(([prId, scores]) => (
                  <div key={prId} className="pr-row">
                    <div className="pr-title">Update {prId}.py</div>
                    <div className="pr-meta">
                      C: {scores.readability_score} | R: {scores.robustness_score} | E: {scores.performance_score} | S: {scores.security_score}
                    </div>
                    <div className="pr-score">{scores.model}</div>
                  </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;