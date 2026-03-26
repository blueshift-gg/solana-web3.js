/**
 * Shared Kit instruction utilities.
 *
 * These live in their own file to avoid a circular dependency:
 *   transaction/legacy.ts → compat/instruction.ts → transaction/legacy.ts
 *
 * Both `transaction/legacy.ts` and `compat/instruction.ts` import from here instead.
 */
import {
  AccountRole,
  type Instruction,
} from '@solana/instructions';
import {Address} from '../address';

/**
 * Type guard that checks whether the given value is a Kit {@link Instruction}.
 * Detects the Kit shape (`programAddress` string + optional `accounts`/`data`)
 * and distinguishes it from a web3.js `TransactionInstruction` (`programId` + `keys`).
 */
export function isKitInstruction(value: unknown): value is Instruction {
  if (typeof value !== 'object' || value === null) return false;
  const obj = value as Record<string, unknown>;
  return (
    typeof obj.programAddress === 'string' &&
    !('programId' in obj) &&
    !('keys' in obj)
  );
}

/**
 * Converts a Kit {@link Instruction} to a web3.js `TransactionInstruction`-compatible
 * plain object `{ keys, programId, data }`.
 *
 * Returns a plain object rather than a `TransactionInstruction` instance to avoid
 * importing from `transaction/legacy` (which would create a circular dependency).
 */
export function kitInstructionToLegacyArgs(ix: Instruction): {
  keys: {pubkey: Address; isSigner: boolean; isWritable: boolean}[];
  programId: Address;
  data: Uint8Array;
} {
  const accounts = ((ix as any).accounts ?? []).map((a: any) => ({
    pubkey: new Address(a.address),
    isSigner:
      a.role === AccountRole.READONLY_SIGNER ||
      a.role === AccountRole.WRITABLE_SIGNER,
    isWritable:
      a.role === AccountRole.WRITABLE || a.role === AccountRole.WRITABLE_SIGNER,
  }));
  return {
    keys: accounts,
    programId: new Address(ix.programAddress),
    data: (ix as any).data ? Uint8Array.from((ix as any).data) : Uint8Array.of(),
  };
}
