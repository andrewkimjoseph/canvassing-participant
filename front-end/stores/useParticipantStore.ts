import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  doc, 
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { Participant } from '@/entities/participant';
import { db } from '@/firebase';

interface ParticipantStoreState {
  participant: Participant | null;
  loading: boolean;
  getParticipant: (walletAddress: string) => Promise<Participant | null>;
  setParticipant: (participantData: Omit<Participant, 'id'>) => Promise<void>;
  updateParticipantUsername: (username: string) => Promise<void>;
}

const useParticipantStore = create<ParticipantStoreState>()(
  persist(
    (set, get) => ({
      participant: null,
      loading: false,

      getParticipant: async (walletAddress) => {
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
          const existingParticipant = await get().getParticipant(participantData.walletAddress);

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
          });

          set({ participant: newParticipant, loading: false });
        } catch (error) {
          console.error('Error creating participant:', error);
          set({ loading: false });
          throw error;
        }
      },

      updateParticipantUsername: async (username: string) => {
        set({ loading: true });
        try {
          const currentParticipant = get().participant;
          
          if (!currentParticipant?.id) {
            throw new Error('No participant loaded in store');
          }

          const participantRef = doc(db, 'participants', currentParticipant.id);

          const data = {
            username: username,
            timeUpdated: Timestamp.now(),
          }
          await updateDoc(participantRef, data);

          const updatedParticipant: Participant = {
            ...currentParticipant,
            ...data,
          };

          set({ 
            participant: updatedParticipant,
            loading: false 
          });
        } catch (error) {
          console.error('Error updating participant:', error);
          set({ loading: false });
          throw error;
        }
      },
    }),
    {
      name: 'participant-storage',
      partialize: (state) => ({ participant: state.participant }),
    }
  )
);

export default useParticipantStore;