export interface Survey {
    id: string;
    researcherId: string | null;
    topic: string | null;
    brief: string | null;
    instructions: string | null;
    durationInMinutes: number | null;
    formLink: string | null;
    rewardAmountIncUSD: number | null;
    smartContractAddress: string | null;
    isAvailable: boolean | null;
  }