import { Context } from "effect";
import type {
  ICoinTransactionPort,
  CoinTransactionDTO,
} from "@mirai-app/domain";

/**
 * Context.Tag for ICoinTransactionPort dependency injection
 */
export class CoinTransactionPortTag extends Context.Tag("CoinTransactionPort")<
  CoinTransactionPortTag,
  ICoinTransactionPort
>() {}

/**
 * Re-export types from domain for backward compatibility
 */
export type { ICoinTransactionPort, CoinTransactionDTO };

/**
 * CoinTransaction DTO (alias for backward compatibility)
 */
export type CoinTransaction = CoinTransactionDTO;

/**
 * @deprecated Use CoinTransactionPortTag instead. Kept for backward compatibility.
 */
export const CoinTransactionPort = CoinTransactionPortTag;

/**
 * @deprecated Use ICoinTransactionPort instead. Kept for backward compatibility.
 */
export type CoinTransactionPort = typeof CoinTransactionPortTag;
