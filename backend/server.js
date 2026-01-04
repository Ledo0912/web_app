const express = require("express");
const cors = require("cors");
const pool = require("./db");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "your_secret_key"; // <-- move to .env later

const app = express();
app.use(cors());
app.use(express.json()); // parse JSON bodies

app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if user exists
    const exists = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await pool.query(
      "INSERT INTO users (username, email, password_hash, points, role) VALUES ($1, $2, $3, 100, 'user') RETURNING *;",
      [username, email, hashed]
    );

    res.json({ message: "User registered", user: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});


app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
    
    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        points: user.points,
        organization_id: user.organization_id,
        role: user.role
      }
    });


  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Test route
app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// GET all users with organization names
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.points, u.organization_id, u.role, o.name AS organization
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});


// GET all tournaments
app.get("/api/tournaments", async (req, res) => {
  try {
    const tournaments = await pool.query("SELECT * FROM tournaments");
    res.json(tournaments.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// GET all matches
app.get("/api/matches", async (req, res) => {
  try {
    const matches = await pool.query("SELECT * FROM matches");
    res.json(matches.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// GET all organizations
app.get("/api/organizations", async (req, res) => {
  try {
    const organizations = await pool.query("SELECT * FROM organizations");
    res.json(organizations.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Start server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// ADD USER to organization
app.put("/api/org/addUser", async (req, res) => {
  const { userId, orgId } = req.body;

  await pool.query(
    "UPDATE users SET organization_id = $1 WHERE id = $2",
    [orgId, userId]
  );

  res.json({ message: "User added to organization" });
});

// REMOVE USER from organization
app.put("/api/org/removeUser", async (req, res) => {
  const { userId } = req.body;

  await pool.query(
    "UPDATE users SET organization_id = NULL WHERE id = $1",
    [userId]
  );

  res.json({ message: "User removed from organization" });
});


// server.js
// ------------------------
// FRIENDS ENDPOINTS
// ------------------------

// GET friends of a user
app.get("/api/friends/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const result = await pool.query(`
      SELECT u.id, u.username
      FROM friends f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = $1
    `, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch friends" });
  }
});

// ADD friend
app.put("/api/friends/add", async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    // Avoid duplicates
    await pool.query(`
      INSERT INTO friends (user_id, friend_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [userId, friendId]);

    // Also insert the reverse relation
    await pool.query(`
      INSERT INTO friends (user_id, friend_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
    `, [friendId, userId]);

    res.json({ message: "Friend added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add friend" });
  }
});

// REMOVE friend
app.put("/api/friends/remove", async (req, res) => {
  const { userId, friendId } = req.body;
  try {
    await pool.query(`DELETE FROM friends WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`, [userId, friendId]);
    res.json({ message: "Friend removed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to remove friend" });
  }
});

// GET users belonging to an organization
app.get("/api/org/users/:orgId", async (req, res) => {
  const { orgId } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, username, points, role FROM users WHERE organization_id = $1",
      [orgId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch organization users" });
  }
});
// GET users belonging to an organization
app.get("/api/org/users/:orgId", async (req, res) => {
  const { orgId } = req.params;

  try {
    const result = await pool.query(
      "SELECT id, username, points, role FROM users WHERE organization_id = $1",
      [orgId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch organization users" });
  }
});

app.post("/api/tournaments", async (req, res) => {
  const { time, date, max_players, organization_id } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO tournaments (time, date, max_players, organization_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [time, date, max_players, organization_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create tournament" });
  }
});


// UPDATE USER POINTS
app.put("/api/users/updatePoints", async (req, res) => {
  const { userId, delta } = req.body;

  if (typeof userId !== "number" || typeof delta !== "number") {
    return res.status(400).json({ error: "Invalid userId or delta" });
  }

  try {
    const result = await pool.query(
      "UPDATE users SET points = points + $2 WHERE id = $1 RETURNING *",
      [userId, delta]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Points updated", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update points" });
  }
});

app.post("/api/matches", async (req, res) => {
  const { players } = req.body;

  if (!players || players.length < 2) {
    return res.status(400).json({ error: "Invalid players data" });
  }

  const calculatePointsChange = (score) => {
    if (score <= 2) return -3;
    if (score <= 4) return -1;
    if (score <= 7) return 0;
    if (score <= 9) return 2;
    return 5;
  };

  try {
    await pool.query("BEGIN");

    // Create match
    const matchRes = await pool.query(
      "INSERT INTO matches DEFAULT VALUES RETURNING id"
    );
    const matchId = matchRes.rows[0].id;

    // Insert players + update points
    for (const p of players) {
      const delta = calculatePointsChange(p.score);

      await pool.query(
        `INSERT INTO match_players (match_id, user_id, score, points_delta)
         VALUES ($1, $2, $3, $4)`,
        [matchId, p.id, p.score, delta]
      );

      await pool.query(
        `UPDATE users SET points = points + $1 WHERE id = $2`,
        [delta, p.id]
      );
    }

    await pool.query("COMMIT");
    res.json({ message: "Match saved" });

  } catch (err) {
    await pool.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Failed to save match" });
  }
});

// GET last 5 matches for a user
app.get("/api/matches/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        m.id AS match_id,
        mp.score,
        mp.points_change,
        m.created_at AS match_date
      FROM match_players mp
      JOIN matches m ON m.id = mp.match_id
      WHERE mp.user_id = $1
      ORDER BY m.created_at DESC
      LIMIT 5
    `, [userId]);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});
