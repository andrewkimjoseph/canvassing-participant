import { functions } from "@/firebase";
import { TempSigningResult } from "@/types/tempSigningResult";
import { httpsCallable } from "@firebase/functions";

export const generateTempSignature = httpsCallable<
    {
        surveyContractAddress: string;
        chainId: number;
        participantWalletAddress: string;
        surveyId: string;
        network: string;
    },
    TempSigningResult
>(functions, "generateScreeningSignature");