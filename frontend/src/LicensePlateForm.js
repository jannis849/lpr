import React, { useState } from "react";
import api from "./api";

function LicensePlateForm({ user, onUpdate }) {
  const [plate, setPlate] = useState(user.license_plate || "");
  const [msg, setMsg] = useState("");

  const handleSave = async () => {
    try {
      const res = await api.patch("/me", { license_plate: plate });
      onUpdate(res.data);
      setMsg("✅ Kennzeichen gespeichert.");
    } catch (err) {
      console.error(err);
      setMsg("❌ Fehler beim Speichern.");
    }
  };

  return (
    <div className="mt-6 bg-neutral-700 p-4 rounded-md">
      <h3 className="text-lg font-medium mb-2">Kennzeichen speichern</h3>
      <input
        value={plate}
        onChange={(e) => setPlate(e.target.value)}
        className="w-full p-2 text-black rounded-md mb-2"
        placeholder="z. B. B-AB1234"
      />
      <button
        onClick={handleSave}
        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
      >
        Speichern
      </button>
      {msg && <p className="mt-2 text-sm">{msg}</p>}
    </div>
  );
}

export default LicensePlateForm;
