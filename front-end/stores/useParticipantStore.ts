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
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/firebase';

interface ParticipantStoreState {
  participant: Participant | null;
  loading: boolean;
  getParticipant: (walletAddress: string) => Promise<Participant | null>;
  setParticipant: (participant: Omit<Participant, 'id'>, authId: string) => Promise<void>;
  updateParticipantUsername: (username: string) => Promise<void>;
  ensureAnonymousAuth: (participant: Participant) => Promise<string>;
}

const useParticipantStore = create<ParticipantStoreState>()(
  persist(
    (set, get) => ({
      participant: null,
      loading: false,

      ensureAnonymousAuth: async (participant: Participant) => {
        // If participant already has an authId, return it
        if (participant.authId) {
          return participant.authId;
        }

        try {
          // Sign in anonymously
          const userCredential = await signInAnonymously(auth);
          const authId = userCredential.user.uid;

          // Update participant with new authId
          const participantRef = doc(db, 'participants', participant.id);
          await updateDoc(participantRef, {
            authId,
            timeUpdated: Timestamp.now()
          });

          // Update local state
          set({ 
            participant: {
              ...participant,
              authId
            }
          });

          return authId;
        } catch (error) {
          console.error('Error ensuring anonymous auth:', error);
          throw error;
        }
      },

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
            const participant = { ...data, id: snapshot.docs[0].id };
            set({ participant, loading: false });
            
            // Ensure anonymous auth for existing participant
            if (!participant.authId) {
              await get().ensureAnonymousAuth(participant);
            }
            
            return participant;
          } else {
            set({ participant: null, loading: false });
            return null;
          }
        } catch (error) {
          console.error('Error getting participant:', error);
          set({ loading: false });
          return null;
        }
      },

      setParticipant: async (participant, authId) => {
        set({ loading: true });
        try {
          const existingParticipant = await get().getParticipant(participant.walletAddress);

          if (existingParticipant) {
            set({ participant: existingParticipant, loading: false });
            return;
          }

          const participantsRef = collection(db, 'participants');
          const docRef = await addDoc(participantsRef, {
            ...participant,
            authId,
            timeCreated: Timestamp.now(),
            timeUpdated: Timestamp.now()
          });

          const newParticipant: Participant = {
            ...participant,
            id: docRef.id,
            authId
          };

          await updateDoc(doc(db, 'participants', docRef.id), {
            id: docRef.id,
          });

          set({ participant: newParticipant, loading: false });
        } catch (error) {
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