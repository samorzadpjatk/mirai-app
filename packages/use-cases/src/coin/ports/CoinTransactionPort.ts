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
 * CoinTransaction DTO (alias for backward compatibility)
 */
export type CoinTransaction = CoinTransactionDTO;
