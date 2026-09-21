import { create } from 'zustand';

// Visual state only. Authentication remains in auth.store and the API.
export const useLoginTransition = create<{
  phase: 'idle' | 'cover' | 'reveal';
  setPhase: (phase: 'idle' | 'cover' | 'reveal') => void;
}>((set) => ({ phase: 'idle', setPhase: (phase) => set({ phase }) }));
