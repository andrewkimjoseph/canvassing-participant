import { create } from 'zustand';
import { collection, getDocs, query, where, addDoc, doc, updateDoc } from 'firebase/firestore';
import { Participant } from '@/entities/participant';
import { db } from '@/app/firebase';

interface ParticipantStoreState {
  participant: Participant | null;
  loading: boolean;
  checkParticipant: (walletAddress: string) => Promise<void>;
  setParticipant: (participantData: Omit<Participant, 'id'>) => Promise<void>;
}

const useParticipantStore = create<ParticipantStoreState>((set) => ({
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
      } else {
        set({ participant: null, loading: false });
      }
    } catch (error) {
      console.error('Error checking participant:', error);
      set({ loading: false });
    }
  },

  setParticipant: async (participantData) => {
    set({ loading: true });
    try {
      const participantsRef = collection(db, 'participants');
      const docRef = await addDoc(participantsRef, participantData);
      
      const newParticipant: Participant = {
        ...participantData,
        id: docRef.id,
      };
      
      await updateDoc(doc(db, 'participants', docRef.id), {
        id: docRef.id
      });
      
      set({ participant: newParticipant, loading: false });
    } catch (error) {
      console.error('Error creating participant:', error);
      set({ loading: false });
      throw error;
    }
  },


}));

export default useParticipantStore;