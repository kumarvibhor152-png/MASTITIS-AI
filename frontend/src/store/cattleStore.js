import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const MOCK_CATTLE = [
  { id: '1', name: 'Ganga', tag: 'GJ-001', breed: 'Gir', age: 5, riskLevel: 'LOW', milkYield: 14.5, lactation: 2, daysInMilk: 45, lastChecked: '2026-09-02', village: 'Anand' },
  { id: '2', name: 'Lakshmi', tag: 'GJ-002', breed: 'Sahiwal', age: 4, riskLevel: 'HIGH', milkYield: 8.2, lactation: 3, daysInMilk: 120, lastChecked: '2026-09-01', village: 'Anand' },
  { id: '3', name: 'Kamdhenu', tag: 'GJ-003', breed: 'HF Cross', age: 3, riskLevel: 'MEDIUM', milkYield: 18.0, lactation: 1, daysInMilk: 30, lastChecked: '2026-09-02', village: 'Anand' },
  { id: '4', name: 'Saraswati', tag: 'GJ-004', breed: 'Jersey', age: 6, riskLevel: 'LOW', milkYield: 12.5, lactation: 4, daysInMilk: 78, lastChecked: '2026-09-01', village: 'Anand' },
  { id: '5', name: 'Durga', tag: 'GJ-005', breed: 'Gir', age: 4, riskLevel: 'LOW', milkYield: 11.0, lactation: 2, daysInMilk: 55, lastChecked: '2026-09-02', village: 'Anand' },
  { id: '6', name: 'Parvati', tag: 'GJ-006', breed: 'Sahiwal', age: 5, riskLevel: 'HIGH', milkYield: 6.8, lactation: 3, daysInMilk: 145, lastChecked: '2026-09-01', village: 'Anand' },
  { id: '7', name: 'Meera', tag: 'GJ-007', breed: 'HF Cross', age: 2, riskLevel: 'LOW', milkYield: 20.0, lactation: 1, daysInMilk: 18, lastChecked: '2026-09-02', village: 'Anand' },
  { id: '8', name: 'Radha', tag: 'GJ-008', breed: 'Murrah', age: 4, riskLevel: 'MEDIUM', milkYield: 9.5, lactation: 2, daysInMilk: 95, lastChecked: '2026-09-01', village: 'Anand' },
];

const useCattleStore = create(
  persist(
    (set) => ({
      cattle: MOCK_CATTLE,

      setCattle: (cattle) => set({ cattle }),

      addCattle: (cow) =>
        set((state) => ({
          cattle: [...state.cattle, { ...cow, id: Date.now().toString() }],
        })),

      updateCattle: (id, updates) =>
        set((state) => ({
          cattle: state.cattle.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      removeCattle: (id) =>
        set((state) => ({
          cattle: state.cattle.filter((c) => c.id !== id),
        })),
    }),
    {
      name: 'mastitrack-cattle',
    }
  )
);

export default useCattleStore;
