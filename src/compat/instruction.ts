import {
  AccountRole,
  type AccountMeta,
  type Instruction,
  type InstructionWithAccounts,
  type InstructionWithData,
} from '@solana/instructions';
import {TransactionInstruction} from '../transaction';
import {Address} from '../address';

import {toKitAddress} from './address';
export {isKitInstruction} from './kit-instruction-utils';
import {kitInstructionToLegacyArgs} from './kit-instruction-utils';

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
): Instruction & InstructionWithAccounts<readonly AccountMeta[]> & InstructionWithData<Uint8Array> {
  const data =
    web3jsInstruction.data?.byteLength > 0
      ? Uint8Array.from(web3jsInstruction.data)
      : new Uint8Array(0);

  const accounts = Object.freeze(
    web3jsInstruction.keys.map(accountMeta =>
      Object.freeze({
        address: toKitAddress(accountMeta.pubkey),
        role: toAccountRole(accountMeta.isSigner, accountMeta.isWritable),
      }),
    ),
  );

  const programAddress = toKitAddress(web3jsInstruction.programId);

  return Object.freeze({
    accounts,
    data,
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
  return new TransactionInstruction(kitInstructionToLegacyArgs(ix));
}

function toAccountRole(isSigner: boolean, isWritable: boolean): AccountRole {
  if (isSigner && isWritable) return AccountRole.WRITABLE_SIGNER;
  if (isSigner) return AccountRole.READONLY_SIGNER;
  if (isWritable) return AccountRole.WRITABLE;
  return AccountRole.READONLY;
}
