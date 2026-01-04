import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

function OrganizationPage({ user }) {
  const navigate = useNavigate();
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedUserToAdd, setSelectedUserToAdd] = useState("");
  const [selectedUserToRemove, setSelectedUserToRemove] = useState("");

  const [tournamentForm, setTournamentForm] = useState({
    time: "",
    date: "",
    max_players: "",
  });

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Load all organizations
        const orgRes = await axios.get("http://localhost:5000/api/organizations");
        const org = orgRes.data.find((o) => o.id === user.organization_id);
        setOrganization(org || null);

        // Load all users
        const usersRes = await axios.get("http://localhost:5000/api/users");
        setAllUsers(usersRes.data);

        // Filter users by organization
        const membersFiltered = usersRes.data.filter(
          (u) => u.organization_id === user.organization_id
        );
        setMembers(membersFiltered);

        // Load tournaments
        const tournamentsRes = await axios.get("http://localhost:5000/api/tournaments");
        const orgTournaments = tournamentsRes.data.filter(
          (t) => t.organization_id === user.organization_id
        );
        setTournaments(orgTournaments);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleAddUser = async () => {
    if (!selectedUserToAdd) return;

    try {
      await axios.put("http://localhost:5000/api/org/addUser", {
        userId: parseInt(selectedUserToAdd),
        orgId: user.organization_id,
      });

      const addedUser = allUsers.find((u) => u.id === parseInt(selectedUserToAdd));
      setMembers([...members, addedUser]);
      setSelectedUserToAdd("");
    } catch (err) {
      console.error(err);
      alert("Failed to add user.");
    }
  };

  const handleRemoveUser = async () => {
    if (!selectedUserToRemove) return;

    try {
      await axios.put("http://localhost:5000/api/org/removeUser", {
        userId: parseInt(selectedUserToRemove),
      });

      setMembers(members.filter((m) => m.id !== parseInt(selectedUserToRemove)));
      setSelectedUserToRemove("");
    } catch (err) {
      console.error(err);
      alert("Failed to remove user.");
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();

    try {
      await axios.post("http://localhost:5000/api/tournaments", {
        time: tournamentForm.time,
        date: tournamentForm.date,
        max_players: parseInt(tournamentForm.max_players),
        organization_id: user.organization_id,
      });

      alert("Tournament created!");

      const updatedTournaments = await axios.get("http://localhost:5000/api/tournaments");
      const orgTournaments = updatedTournaments.data.filter(
        (t) => t.organization_id === user.organization_id
      );
      setTournaments(orgTournaments);

      setTournamentForm({ time: "", date: "", max_players: "" });
    } catch (err) {
      console.error(err);
      alert("Failed to create tournament");
    }
  };

  if (loading) return <h2>Loading...</h2>;

  return (
    <div className="organization-container">
      <button className="back-button" onClick={() => navigate(-1)}>Back</button>

      <h1>Organization Page</h1>

      {organization ? (
        <>
          <h2>{organization.name}</h2>
          <p>ID: {organization.id}</p>
        </>
      ) : (
        <p>You are not part of any organization.</p>
      )}

      {/* USERS TABLE */}
      <h2>Members</h2>
      <table className="styled-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td>{m.username}</td>
              <td>{m.email}</td>
              <td>{m.points}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOURNAMENTS TABLE */}
      <h2>Tournaments</h2>
      {tournaments.length === 0 ? (
        <p>No tournaments created yet.</p>
      ) : (
        <table className="styled-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Max Players</th>
              <th>Tournament ID</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{t.time}</td>
                <td>{t.max_players}</td>
                <td>{t.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ADMIN CONTROLS */}
      {user.role === "admin" && (
        <div className="admin-panel">
          <h2>Admin Controls</h2>

          <div className="control-section">
            <h3>Add User</h3>
            <select
              value={selectedUserToAdd}
              onChange={(e) => setSelectedUserToAdd(e.target.value)}
            >
              <option value="">Select a user</option>
              {allUsers
                .filter((u) => u.organization_id === null)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
            </select>
            <button onClick={handleAddUser}>Add</button>
          </div>

          <div className="control-section">
            <h3>Remove User</h3>
            <select
              value={selectedUserToRemove}
              onChange={(e) => setSelectedUserToRemove(e.target.value)}
            >
              <option value="">Select member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.username}
                </option>
              ))}
            </select>
            <button onClick={handleRemoveUser}>Remove</button>
          </div>

          <div className="tournament-form">
            <h3>Create Tournament</h3>
            <form onSubmit={handleCreateTournament}>
              <input
                type="text"
                placeholder="Time"
                value={tournamentForm.time}
                onChange={(e) =>
                  setTournamentForm({ ...tournamentForm, time: e.target.value })
                }
                required
              />
              <input
                type="date"
                value={tournamentForm.date}
                onChange={(e) =>
                  setTournamentForm({ ...tournamentForm, date: e.target.value })
                }
                required
              />
              <input
                type="number"
                placeholder="Max Players"
                value={tournamentForm.max_players}
                onChange={(e) =>
                  setTournamentForm({
                    ...tournamentForm,
                    max_players: e.target.value,
                  })
                }
                required
              />
              <button type="submit">Create</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrganizationPage;
