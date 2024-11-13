// /types/index.ts
export interface Reward {
    id: string;
    surveyId: string | null;
    participantId: string | null;
    respondentIdFromForm: string | null;
    surveyIdFromForm: string | null;
    amountIncUSD: number | null;
    isClaimed: boolean | null;
    transactionHash: string | null;
    participantWalletAddress: string | null;
  }
  