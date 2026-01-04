import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import ProfilePage from "./pages/ProfilePage";
import OrganizationPage from "./pages/OrganizationPage";
import "./App.css";
import NewGamePage from "./pages/NewGamePage";


// ---------------------------
// Login Page
// ---------------------------
function LoginPage({ setUser }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form);
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid email or password");
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit">Login</button>
        {error && <p className="error">{error}</p>}
      </form>
      <button onClick={() => navigate("/register")} className="switch-button">
        Create an account
      </button>
    </div>
  );
}

// ---------------------------
// Register Page
// ---------------------------
function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post("http://localhost:5000/api/auth/register", form);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Email may already exist.");
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit">Register</button>
        {error && <p className="error">{error}</p>}
      </form>
      <button onClick={() => navigate("/")} className="switch-button">
        Back to Login
      </button>
    </div>
  );
}

// ---------------------------
// Dashboard
// ---------------------------
function Dashboard({ user, setUser }) {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usersRes, matchesRes, tournamentsRes, friendsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/users"),
          axios.get("http://localhost:5000/api/matches"),
          axios.get("http://localhost:5000/api/tournaments"),
          axios.get(`http://localhost:5000/api/friends/${user.id}`)
        ]);

        setUsers(usersRes.data);
        setMatches(matchesRes.data);
        setTournaments(tournamentsRes.data);
        setFriends(friendsRes.data.map(f => f.username)); // store usernames
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [user.id]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
    navigate("/");
  };

  const renderTable = (title, data, columns) => (
    <div className="table-section">
      <h2 className="table-title">{title}</h2>
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={columns.length}>No data available</td></tr>
          ) : (
            data.map((row, index) => (
              <tr key={index}>
                {columns.map(col =>
                  col === "No" ? (
                    <td key={col}>{index + 1}</td>
                  ) : (
                    <td key={col}>{row[col.toLowerCase()] ?? "N/A"}</td>
                  )
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  // FIXED FILTERS
  const globalLeaderboard = users;

  const orgLeaderboard = users.filter(
    u => u.organization_id === user.organization_id
  );

  const friendsLeaderboard = users.filter(
    u => friends.includes(u.username)
  );

  const last5 = matches
    .filter(m => m.user_id === user.id)
    .slice(0, 5);

  const orgTournaments = tournaments
    .filter(t => t.organization_id === user.organization_id)
    .slice(0, 5);

  return (
    <div className="dashboard-container">
      <div className="left-panel">
        <div className="user-bar">
          <span>User: {user.username}</span>
          <span>Points: {user.points}</span>
          <span>Organization ID: {user.organization_id}</span>
          <Link to="/profile"><button className="small-button">Profile</button></Link>
          <Link to="/organization"><button className="small-button">Organization</button></Link>
          <button onClick={handleLogout} className="small-button logout-button">
            Logout
          </button>
        </div>

        <div className="new-game-container">
          <button className="new-game-button" onClick={() => navigate("/new-game")}>
            New Game
          </button>
        </div>
      </div>

      <div className="right-panel">
        {renderTable("Global Leaderboard", globalLeaderboard, ["No", "Username", "Points", "Organization"])}
        {renderTable("Organization Leaderboard", orgLeaderboard, ["No", "Username", "Points", "Organization"])}
        {renderTable("Friends Leaderboard", friendsLeaderboard, ["No", "Username", "Points", "Organization"])}
        {renderTable("Last 5 Matches", last5, ["No", "Username", "Score", "Points_delta"])}
        {renderTable("Organization Tournaments", orgTournaments, ["No", "Time", "Date", "Max_players"])}
      </div>
    </div>
  );
}

// ---------------------------
// Main App
// ---------------------------
function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage setUser={setUser} />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} setUser={setUser} /> : <LoginPage setUser={setUser} />}
        />
        <Route path="/profile" element={<ProfilePage user={user} />} />
        <Route path="/organization" element={<OrganizationPage user={user} />} />
        <Route path="/new-game" element={<NewGamePage user={user} />} />
      </Routes>
    </Router>
  );
}

export default App;
