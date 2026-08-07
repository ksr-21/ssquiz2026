import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CandidateState {
  candidateId: string | null;
  setCandidateId: (id: string) => void;
  sessionId: string | null;
  setSessionId: (id: string) => void;
  clearSession: () => void;
}

export const useStore = create<CandidateState>()(
  persist(
    (set) => ({
      candidateId: null,
      setCandidateId: (id) => set({ candidateId: id }),
      sessionId: null,
      setSessionId: (id) => set({ sessionId: id }),
      clearSession: () => set({ candidateId: null, sessionId: null })
    }),
    {
      name: 'success-squad-storage',
    }
  )
);
