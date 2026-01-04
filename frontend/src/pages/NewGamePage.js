import React, { useState, useEffect } from "react";
import axios from "axios";
import "./NewGamePage.css";
import { useNavigate } from "react-router-dom";

function NewGamePage({ user }) {
  const [numPlayers, setNumPlayers] = useState(2);
  const [players, setPlayers] = useState([{ id: user.id, username: user.username, score: 2 }]);
  const [allUsers, setAllUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/users");
        const otherUsers = res.data.filter(u => u.id !== user.id);
        setAllUsers(otherUsers);
      } catch (err) {
        console.error(err);
      }
    };
    loadUsers();
  }, [user.id]);

  useEffect(() => {
    setPlayers(prev => {
      const newPlayers = [...prev];
      while (newPlayers.length < numPlayers) newPlayers.push({ id: null, username: "", score: 2 });
      while (newPlayers.length > numPlayers) newPlayers.pop();
      return newPlayers;
    });
  }, [numPlayers]);

  const handleUsernameChange = (index, username) => {
    const selectedUser = allUsers.find(u => u.username === username);
    setPlayers(prev => {
      const newPlayers = [...prev];
      newPlayers[index] = { ...newPlayers[index], id: selectedUser?.id || null, username };
      return newPlayers;
    });
  };

  const handleScoreChange = (index, value) => {
    value = Math.min(Math.max(2, value), 10);
    setPlayers(prev => {
      const hasTen = prev.some(p => p.score === 10);
      if (value === 10 && hasTen && prev[index].score !== 10) value = 9;

      const newPlayers = [...prev];
      newPlayers[index] = { ...newPlayers[index], score: value };
      return newPlayers;
    });
  };

  const calculatePointsChange = (score) => {
    if (score <= 2) return -3;
    if (score <= 4) return -1;
    if (score <= 7) return 0;
    if (score <= 9) return 2;
    return 5;
  };

const handleAddGame = async () => {
  if (players.some(p => !p.id)) {
    alert("Please select all players");
    return;
  }

  try {
    await axios.post("http://localhost:5000/api/matches", {
      players
    });

    alert("Game added successfully!");
    navigate("/dashboard");
  } catch (err) {
    console.error(err);
    alert("Failed to add game");
  }
};



  return (
    <div className="new-game-container" style={{ marginTop: "50px" }}>
      {/* Back button */}
      <button className="back-button" onClick={() => navigate("/dashboard")}>Back</button>

      <h1>New Game</h1>

      <label>
        Number of players (2–4):
        <select value={numPlayers} onChange={e => setNumPlayers(parseInt(e.target.value))}>
          {[2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>

      <table className="new-game-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {players.map((p, idx) => (
            <tr key={idx}>
              <td>
                {idx === 0 ? (
                  <input type="text" value={p.username} readOnly />
                ) : (
                  <input
                    type="text"
                    value={p.username}
                    onChange={e => handleUsernameChange(idx, e.target.value)}
                    list="user-list"
                  />
                )}
              </td>
              <td>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={p.score}
                  onChange={e => handleScoreChange(idx, parseInt(e.target.value))}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <datalist id="user-list">
        {allUsers.map(u => <option key={u.id} value={u.username} />)}
      </datalist>

      <button className="start-game-button" onClick={handleAddGame}>Add Game</button>
    </div>
  );
}

export default NewGamePage;
