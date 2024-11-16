import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { Participant } from '@/entities/participant';
import { db } from '@/firebase';

interface ParticipantStoreState {
  participant: Participant | null;
  loading: boolean;
  checkParticipant: (walletAddress: string) => Promise<Participant | null>;
  setParticipant: (participantData: Omit<Participant, 'id'>) => Promise<void>;
}

const useParticipantStore = create<ParticipantStoreState>()(
  persist(
    (set, get) => ({
      participant: null,
      loading: false,

      checkParticipant: async (walletAddress) => {
        set({ loading: true });
        try {
          const q = query(
            collection(db, 'participants'),
            where('walletAddress', '==', walletAddress)
          );
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const data = snapshot.docs[0].data() as Participant;
            set({ participant: data, loading: false });
            return data;
          } else {
            set({ participant: null, loading: false });
            return null;
          }
        } catch (error) {
          console.error('Error checking participant:', error);
          set({ loading: false });
          return null;
        }
      },

      setParticipant: async (participantData) => {
        set({ loading: true });
        try {
          const existingParticipant = await get().checkParticipant(participantData.walletAddress);

          if (existingParticipant) {
            set({ participant: existingParticipant, loading: false });
            return;
          }

          const participantsRef = collection(db, 'participants');
          const docRef = await addDoc(participantsRef, {
            ...participantData,
          });

          const newParticipant: Participant = {
            ...participantData,
            id: docRef.id,
          };

          await updateDoc(doc(db, 'participants', docRef.id), {
            id: docRef.id,
            updatedAt: new Date().toISOString()
          });

          set({ participant: newParticipant, loading: false });
        } catch (error) {
          console.error('Error creating participant:', error);
          set({ loading: false });
          throw error;
        }
      },
    }),
    {
      name: 'participant-storage', // Unique name for localStorage
      partialize: (state) => ({ participant: state.participant }), // Only persist participant data
    }
  )
);

export default useParticipantStore;
