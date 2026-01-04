import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../App.css";

function ProfilePage({ user }) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedAddFriend, setSelectedAddFriend] = useState("");
  const [selectedRemoveFriend, setSelectedRemoveFriend] = useState("");

  // Fetch friends and all users
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        // Fetch friends
        const friendsRes = await axios.get(`http://localhost:5000/api/friends/${user.id}`);
        setFriends(friendsRes.data);

        // Fetch all users
        const allUsersRes = await axios.get("http://localhost:5000/api/users");
        const otherUsers = allUsersRes.data.filter(u => u.id !== user.id);
        setAllUsers(otherUsers);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [user]);

  const handleAddFriend = async () => {
    if (!selectedAddFriend) return;

    try {
      await axios.put("http://localhost:5000/api/friends/add", {
        userId: user.id,
        friendId: parseInt(selectedAddFriend)
      });

      const addedFriend = allUsers.find(u => u.id === parseInt(selectedAddFriend));
      setFriends([...friends, addedFriend]);
      setSelectedAddFriend("");
    } catch (err) {
      console.error(err);
      alert("Failed to add friend");
    }
  };

  const handleRemoveFriend = async () => {
    if (!selectedRemoveFriend) return;

    try {
      await axios.put("http://localhost:5000/api/friends/remove", {
        userId: user.id,
        friendId: parseInt(selectedRemoveFriend)
      });

      setFriends(friends.filter(f => f.id !== parseInt(selectedRemoveFriend)));
      setSelectedRemoveFriend("");
    } catch (err) {
      console.error(err);
      alert("Failed to remove friend");
    }
  };

  return (
    <div className="profile-container">
      <button className="back-button" onClick={() => navigate(-1)}>Back</button>

      <h1>Profile: {user?.username}</h1>
      <p>Email: {user?.email}</p>
      <p>Points: {user?.points}</p>

      <div className="friends-section">
        <h2>Friends</h2>

        {/* Add Friend */}
        <div className="control-section">
          <h3>Add Friend</h3>
          <select value={selectedAddFriend} onChange={e => setSelectedAddFriend(e.target.value)}>
            <option value="">Select a user</option>
            {allUsers
              .filter(u => !friends.some(f => f.id === u.id))
              .map(u => (
                <option key={u.id} value={u.id}>{u.username}</option>
              ))}
          </select>
          <button onClick={handleAddFriend}>Add</button>
        </div>

        {/* Remove Friend */}
        <div className="control-section">
          <h3>Remove Friend</h3>
          <select value={selectedRemoveFriend} onChange={e => setSelectedRemoveFriend(e.target.value)}>
            <option value="">Select a friend</option>
            {friends.map(f => (
              <option key={f.id} value={f.id}>{f.username}</option>
            ))}
          </select>
          <button onClick={handleRemoveFriend}>Remove</button>
        </div>

        <div className="friends-list">
          <h3>Current Friends:</h3>
          <ul>
            {friends.map(f => <li key={f.id}>{f.username}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
