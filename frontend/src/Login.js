// src/Login.js
import React, { useState } from "react";
import api from "./api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await api.post("/register", { email, password });
      }

      const res = await api.post("/login", { email, password });
      localStorage.setItem("token", res.data.access_token);
      const me = await api.get("/me");
      onLogin(me.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Fehler beim Login");
    }
  };

  return (
    <div>
      <h2>{isRegistering ? "Registrieren" : "Anmelden"}</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="E-Mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-1 text-black rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        /><br />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-1 text-black rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        /><br />
        <button type="submit">
          {isRegistering ? "Registrieren" : "Login"}
        </button>
      </form>
      <button onClick={() => setIsRegistering(!isRegistering)}>
        {isRegistering ? "Zurück zum Login" : "Neu hier? Registrieren"}
      </button>
    </div>
  );
}

export default Login;
