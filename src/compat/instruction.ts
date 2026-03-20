import {AccountRole, type Instruction} from '@solana/instructions';
import {TransactionInstruction} from '../transaction';
import {Address} from '../address';

import {toKitAddress} from './address';

/**
 * This can be used to convert a Web3.js [`TransactionInstruction`](https://solana-foundation.github.io/solana-web3.js/classes/TransactionInstruction.html)
 * object to a Kit {@link Instruction}.
 *
 * @example
 * ```ts
 * import { toKitInstruction } from '@solana/web3.js/compat';
 *
 * // Imagine a function that returns a Web3.js `TransactionInstruction`
 * const web3jsInstruction = getWeb3jsInstruction();
 * const instruction = toKitInstruction(web3jsInstruction);
 * ```
 */
export function toKitInstruction(
  web3jsInstruction: TransactionInstruction,
): Instruction {
  const data =
    web3jsInstruction.data?.byteLength > 0
      ? Uint8Array.from(web3jsInstruction.data)
      : undefined;

  const accounts = web3jsInstruction.keys.map(accountMeta =>
    Object.freeze({
      address: toKitAddress(accountMeta.pubkey),
      role: toAccountRole(accountMeta.isSigner, accountMeta.isWritable),
    }),
  );

  const programAddress = toKitAddress(web3jsInstruction.programId);

  return Object.freeze({
    ...(accounts.length ? {accounts: Object.freeze(accounts)} : null),
    ...(data ? {data} : null),
    programAddress,
  });
}

/**
 * This can be used to convert a Kit {@link Instruction} to a Web3.js
 * [`TransactionInstruction`](https://solana-foundation.github.io/solana-web3.js/classes/TransactionInstruction.html).
 *
 * @example
 * ```ts
 * import { fromKitInstruction } from '@solana/web3.js/compat';
 *
 * // Imagine a Kit instruction from a Codama-generated client
 * const kitInstruction = getTransferInstruction({ ... });
 * const web3jsInstruction = fromKitInstruction(kitInstruction);
 * ```
 */
export function fromKitInstruction(ix: Instruction): TransactionInstruction {
  const accounts = (ix.accounts ?? []).map(a => ({
    pubkey: new Address(a.address),
    isSigner:
      a.role === AccountRole.READONLY_SIGNER ||
      a.role === AccountRole.WRITABLE_SIGNER,
    isWritable:
      a.role === AccountRole.WRITABLE || a.role === AccountRole.WRITABLE_SIGNER,
  }));

  return new TransactionInstruction({
    keys: accounts,
    programId: new Address(ix.programAddress),
    data: ix.data ? Uint8Array.from(ix.data) : Uint8Array.of(),
  });
}

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

function toAccountRole(isSigner: boolean, isWritable: boolean): AccountRole {
  if (isSigner && isWritable) return AccountRole.WRITABLE_SIGNER;
  if (isSigner) return AccountRole.READONLY_SIGNER;
  if (isWritable) return AccountRole.WRITABLE;
  return AccountRole.READONLY;
}
