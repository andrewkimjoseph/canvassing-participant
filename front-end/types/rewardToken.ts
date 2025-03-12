/**
 * Represents the types of tokens that can be used as rewards in the system.
 * 
 * celoDollar: Represents the Celo Dollar (cUSD) stablecoin on the Celo network.
 *             Used primarily for mainnet rewards. Value pegged to the US Dollar.
 * 
 * goodDollar: Represents the GoodDollar (G$) token, a universal basic income token
 *             on the Celo network. Used for social impact initiatives.
 */
export enum RewardToken {
  celoDollar = "celoDollar",
  goodDollar = "goodDollar"
}