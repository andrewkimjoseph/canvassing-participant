import { APIKeys } from "../apiKeys/apiKeys";

export class RPCUrls {
  private static  apiKey = APIKeys.getRPCAPIKey();

  static celoMainnet(): string {
    return `https://lb.drpc.org/ogrpc?network=celo&dkey=${this.apiKey}`;
  }

  static celoAlfajores(): string {
    return `https://lb.drpc.org/ogrpc?network=celo-alfajores&dkey=${this.apiKey}`;
  }
}
