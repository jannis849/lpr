import { create } from 'zustand';
import axios from 'axios';

export const useParkingStore = create((set) => ({
  activeVehicles: [],
  selectedSession: null,
  setSelectedSession: (s) => set({ selectedSession: s }),
  fetchVehicles: async () => {
    const res = await axios.get('http://localhost:8000/session/active');
    set({ activeVehicles: res.data });
  }
}));