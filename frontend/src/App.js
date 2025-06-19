import React, { useState, useEffect } from "react";
import axios from "axios";
import CheckoutPage from "./CheckoutPage";
import Login from "./Login";
import api from "./api";
import LicensePlateForm from "./LicensePlateForm";

function App() {
  const [licensePlate, setLicensePlate] = useState("");
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState(null);
  const [amountDue, setAmountDue] = useState(null);
  const [user, setUser] = useState(null);

  // 🔐 Token prüfen und Benutzer laden
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await api.get("/me");
          setUser(res.data);
        } catch {
          localStorage.removeItem("token");
        }
      }
    };
    checkLogin();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  const searchSession = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/session/active");
      const matched = res.data.find(
        (s) => s.license_plate.toLowerCase() === licensePlate.toLowerCase()
      );
      if (matched) {
        setSession(matched);
        const feeRes = await axios.get(`http://localhost:8000/session/${matched.id}/fee`);
        setAmountDue(feeRes.data.amount_due);
      } else {
        setSession(null);
        setAmountDue(null);
        alert("❌ Keine aktive Session gefunden.");
      }
    } catch (err) {
      console.error(err);
      alert("Fehler beim Abrufen der Session.");
    } finally {
      setLoading(false);
    }
  };

  const pay = async () => {
    if (!session) return;
    try {
      const res = await axios.post(
        `http://localhost:8000/session/${session.id}/pay`
      );
      const { client_secret } = res.data;
      if (client_secret) {
        setClientSecret(client_secret);
      } else {
        alert("❌ Zahlung konnte nicht gestartet werden.");
      }
    } catch (err) {
      console.error(err);
      alert("Fehler beim Starten des Bezahlvorgangs.");
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-lg bg-neutral-800 p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">🚗 LPR Parking App</h1>

        {/* 🔐 Login-/Logout-Logik */}
        {user ? (
          <div className="mb-6">
            <p className="mb-2">Angemeldet als: <strong>{user.email}</strong></p>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            >
              Logout
            </button>
            <LicensePlateForm user={user} onUpdate={setUser} />
          </div>
        ) : (
          <div className="mb-6">
            <Login onLogin={setUser} />
          </div>
        )}

        {/* 🔍 Session-Suche */}
        <input
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          placeholder="Kennzeichen eingeben (z. B. M-AB1234)"
          className="w-full p-3 text-black rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button
          onClick={searchSession}
          className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-md font-medium transition"
        >
          Suchen
        </button>

        {loading && <p className="mt-4 text-sm">🔄 Lädt...</p>}

        {/* 📄 Session-Details */}
        {session && (
          <div className="mt-6 bg-neutral-700 p-5 rounded-md">
            <h3 className="text-xl font-medium mb-3">Session-Details</h3>
            <p><strong>Kennzeichen:</strong> {session.license_plate}</p>
            <p><strong>Einfahrt:</strong> {new Date(session.entry_time).toLocaleString()}</p>
            <p><strong>Ausfahrt:</strong> {session.exit_time ? new Date(session.exit_time).toLocaleString() : "Noch aktiv"}</p>
            <p><strong>Status:</strong> {session.is_paid ? "✅ Bezahlt" : "❌ Offen"}</p>
            <p><strong>Betrag:</strong> {amountDue ?? 0} €</p>

            {!session.is_paid && !clientSecret && (
              <button
                onClick={pay}
                className="mt-4 w-full bg-green-500 hover:bg-green-700 text-white py-3 rounded-md font-semibold transition"
              >
                Jetzt bezahlen
              </button>
            )}
          </div>
        )}

        {/* 💳 Stripe Payment UI */}
        {clientSecret && (
          <div className="mt-6">
            <CheckoutPage clientSecret={clientSecret} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
