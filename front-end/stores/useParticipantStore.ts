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
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { Participant } from '@/entities/participant';
import { db } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/firebase';

interface ParticipantStoreState {
  participant: Participant | null;
  loading: boolean;
  getParticipant: (
    walletAddress: string,
    authId: string
  ) => Promise<Participant | null>;
  setParticipant: (
    participant: Omit<Participant, 'id'>,
    authId: string
  ) => Promise<void>;
  updateParticipantUsername: (username: string) => Promise<void>;
  ensureAnonymousAuth: (participant: Participant) => Promise<string>;
}

const useParticipantStore = create<ParticipantStoreState>()(
  persist(
    (set, get) => ({
      participant: null,
      loading: false,

      ensureAnonymousAuth: async (participant: Participant) => {
        try {
          // Get fresh participant data to ensure we have the latest authId
          const participantRef = doc(db, 'participants', participant.id);
          const participantDoc = await getDoc(participantRef);

          if (!participantDoc.exists()) {
            throw new Error('Participant not found');
          }

          const currentParticipant = {
            ...participantDoc.data(),
            id: participantDoc.id,
          } as Participant;

          // If participant already has an authId, use it
          if (currentParticipant.authId) {
            // Update local state if needed
            if (currentParticipant.authId !== get().participant?.authId) {
              set({ participant: currentParticipant });
            }
            return currentParticipant.authId;
          }

          // Check for existing anonymous user
          const currentUser = auth.currentUser;

          if (currentUser) {
            // Use existing anonymous user
            const authId = currentUser.uid;

            // Update participant with existing authId
            await updateDoc(participantRef, {
              authId,
              timeUpdated: Timestamp.now(),
            });

            // Update local state
            const updatedParticipant = {
              ...currentParticipant,
              authId,
            };

            set({ participant: updatedParticipant });
            return authId;
          }

          // Create new anonymous user only if no existing user
          const userCredential = await signInAnonymously(auth);
          const authId = userCredential.user.uid;

          // Update participant with new authId
          await updateDoc(participantRef, {
            authId,
            timeUpdated: Timestamp.now(),
          });

          // Update local state
          const updatedParticipant = {
            ...currentParticipant,
            authId,
          };

          set({ participant: updatedParticipant });
          return authId;
        } catch (error) {
          console.error('Error in ensureAnonymousAuth:', error);
          throw error;
        }
      },

      getParticipant: async (walletAddress, authId) => {
        set({ loading: true });
        try {
          const q = query(
            collection(db, 'participants'),
            where('walletAddress', '==', walletAddress),
            where('authId', '==', authId)
          );
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const data = snapshot.docs[0].data() as Participant;
            const participant = { ...data, id: snapshot.docs[0].id };
            set({ participant, loading: false });
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
          const existingParticipant = await get().getParticipant(
            participant.walletAddress,
            authId
          );

          if (existingParticipant) {
            set({ participant: existingParticipant, loading: false });
            return;
          }

          const participantsRef = collection(db, 'participants');
          const docRef = await addDoc(participantsRef, {
            ...participant,
            authId,
            timeCreated: Timestamp.now(),
            timeUpdated: Timestamp.now(),
          });

          const newParticipant: Participant = {
            ...participant,
            id: docRef.id,
            authId,
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
          };

          await updateDoc(participantRef, data);

          const updatedParticipant: Participant = {
            ...currentParticipant,
            ...data,
          };

          set({
            participant: updatedParticipant,
            loading: false,
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
