import React from 'react';
import { useParkingStore } from './store';
import axios from 'axios';

const VehicleList = () => {
  const { activeVehicles, setSelectedSession, fetchVehicles } = useParkingStore();

  const handlePay = async (id) => {
    const res = await axios.post(`http://localhost:8000/session/${id}/pay`);
    window.alert(`Stripe client_secret: ${res.data.client_secret}`);
  };

  return (
    <table className="w-full text-left border mt-4">
      <thead>
        <tr>
          <th>Kennzeichen</th>
          <th>Startzeit</th>
          <th>Betrag</th>
          <th>Bezahlt</th>
          <th>Aktion</th>
        </tr>
      </thead>
      <tbody>
        {activeVehicles.map((v) => (
          <tr key={v.id}>
            <td>{v.license_plate}</td>
            <td>{new Date(v.entry_time).toLocaleTimeString()}</td>
            <td>{v.amount_due?.toFixed(2) ?? '-'}</td>
            <td>{v.is_paid ? '✅' : '❌'}</td>
            <td>
              {!v.is_paid && (
                <button className="bg-blue-500 text-white px-2 py-1" onClick={() => handlePay(v.id)}>
                  Jetzt zahlen
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default VehicleList;