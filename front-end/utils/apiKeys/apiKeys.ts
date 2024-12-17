export class APIKeys {
    static getRPCAPIKey(): string {
      const rpcAPIKey = process.env.NEXT_PUBLIC_RPC_API_KEY;
      if (!rpcAPIKey) {
        throw new Error('NEXT_PUBLIC_RPC_API_KEY is not defined in the environment variables');
      }
      return rpcAPIKey;
    }
  }