import {expect} from 'chai';

import {address} from '@solana/addresses';
import {AccountRole} from '@solana/instructions';
import {PublicKey, TransactionInstruction} from '../../src';
import {decodeData, encodeData} from '../../src/instruction';
import {SYSTEM_INSTRUCTION_LAYOUTS} from '../../src/programs/system';

import {
  toKitAddress,
  toKitInstruction,
  fromKitInstruction,
} from '../../src/compat';
import {isKitInstruction} from '../../src/compat/instruction';
import {Transaction} from '../../src';

function toLegacyByteArrayAppropriateForPlatform(data: Uint8Array) {
  return typeof Buffer !== 'undefined'
    ? Buffer.from(data)
    : (new Uint8Array(data) as Buffer);
}

describe('toKitInstruction', () => {
  it('decodeData accepts Uint8Array inputs', () => {
    const encoded = encodeData(SYSTEM_INSTRUCTION_LAYOUTS.Transfer, {
      lamports: 1n,
    });

    expect(encoded.constructor).to.equal(Uint8Array);

    expect(
      decodeData(SYSTEM_INSTRUCTION_LAYOUTS.Transfer, Uint8Array.from(encoded)),
    ).to.deep.equal(decodeData(SYSTEM_INSTRUCTION_LAYOUTS.Transfer, encoded));
  });

  it('converts a basic TransactionInstruction', () => {
    const programId = new Uint8Array([1, 2, 3, 4]);
    const keys = [
      {
        isSigner: false,
        isWritable: true,
        pubkey: new PublicKey('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
      },
    ];
    const data = new Uint8Array([10, 20, 30]);

    const instruction = new TransactionInstruction({
      data: toLegacyByteArrayAppropriateForPlatform(data),
      keys,
      programId: new PublicKey(programId),
    });

    const converted = toKitInstruction(instruction);

    expect(converted).to.deep.equal({
      accounts: [
        {
          address: address('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
          role: AccountRole.WRITABLE,
        },
      ],
      data,
      programAddress: toKitAddress(new PublicKey(programId)),
    });
  });

  it('freezes the accounts array', () => {
    const programId = new Uint8Array([1, 2, 3, 4]);
    const keys = [
      {
        isSigner: false,
        isWritable: true,
        pubkey: new PublicKey('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
      },
    ];
    const data = new Uint8Array([10, 20, 30]);

    const instruction = new TransactionInstruction({
      data: toLegacyByteArrayAppropriateForPlatform(data),
      keys,
      programId: new PublicKey(programId),
    });

    const converted = toKitInstruction(instruction);

    expect(Object.isFrozen(converted.accounts)).to.be.true;
  });

  it('freezes each account', () => {
    const programId = new Uint8Array([1, 2, 3, 4]);
    const keys = [
      {
        isSigner: false,
        isWritable: true,
        pubkey: new PublicKey('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
      },
    ];
    const data = new Uint8Array([10, 20, 30]);

    const instruction = new TransactionInstruction({
      data: toLegacyByteArrayAppropriateForPlatform(data),
      keys,
      programId: new PublicKey(programId),
    });

    const converted = toKitInstruction(instruction);

    expect(Object.isFrozen(converted.accounts?.[0])).to.be.true;
  });

  it('freezes the instruction', () => {
    const programId = new Uint8Array([1, 2, 3, 4]);
    const keys = [
      {
        isSigner: false,
        isWritable: true,
        pubkey: new PublicKey('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
      },
    ];
    const data = new Uint8Array([10, 20, 30]);

    const instruction = new TransactionInstruction({
      data: toLegacyByteArrayAppropriateForPlatform(data),
      keys,
      programId: new PublicKey(programId),
    });

    const converted = toKitInstruction(instruction);

    expect(Object.isFrozen(converted)).to.be.true;
  });

  it('applies no accounts given an instruction with no keys', () => {
    const programId = new Uint8Array([5, 6, 7, 8]);
    const data = new Uint8Array([40, 50, 60]);

    const instruction = new TransactionInstruction({
      data: toLegacyByteArrayAppropriateForPlatform(data),
      keys: [],
      programId: new PublicKey(programId),
    });

    const converted = toKitInstruction(instruction);

    expect(converted).to.deep.equal({
      data,
      programAddress: toKitAddress(new PublicKey(programId)),
    });
  });

  it('handles an instruction with multiple keys', () => {
    const programId = new Uint8Array([9, 10, 11, 12]);
    const keys = [
      {
        isSigner: true,
        isWritable: true,
        pubkey: new PublicKey('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
      },
      {
        isSigner: false,
        isWritable: false,
        pubkey: new PublicKey('9A87Qt8sxxLMe7hcrjC4cPnho1CwWKRpk84ZTRPyvWNw'),
      },
    ];
    const data = new Uint8Array([70, 80, 90]);

    const instruction = new TransactionInstruction({
      data: toLegacyByteArrayAppropriateForPlatform(data),
      keys,
      programId: new PublicKey(programId),
    });

    const converted = toKitInstruction(instruction);

    expect(converted).to.deep.equal({
      accounts: [
        {
          address: address('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
          role: AccountRole.WRITABLE_SIGNER,
        },
        {
          address: address('9A87Qt8sxxLMe7hcrjC4cPnho1CwWKRpk84ZTRPyvWNw'),
          role: AccountRole.READONLY,
        },
      ],
      data,
      programAddress: toKitAddress(new PublicKey(programId)),
    });
  });

  it('applies no data field if the data is zero-length', () => {
    const programId = new Uint8Array([13, 14, 15, 16]);
    const keys = [
      {
        isSigner: true,
        isWritable: false,
        pubkey: new PublicKey('F7Kzv7G6p1PvHXL1xXLPTm4myKWpLjnVphCV8ABZJfgT'),
      },
    ];

    const instruction = new TransactionInstruction({
      data: toLegacyByteArrayAppropriateForPlatform(new Uint8Array()),
      keys,
      programId: new PublicKey(programId),
    });

    const converted = toKitInstruction(instruction);

    expect(converted).to.deep.equal({
      accounts: [
        {
          address: address('F7Kzv7G6p1PvHXL1xXLPTm4myKWpLjnVphCV8ABZJfgT'),
          role: AccountRole.READONLY_SIGNER,
        },
      ],
      programAddress: toKitAddress(new PublicKey(programId)),
    });
  });

  it('applies no data field if the data is missing', () => {
    const programId = new Uint8Array([13, 14, 15, 16]);
    const keys = [
      {
        isSigner: true,
        isWritable: false,
        pubkey: new PublicKey('F7Kzv7G6p1PvHXL1xXLPTm4myKWpLjnVphCV8ABZJfgT'),
      },
    ];

    const instruction = new TransactionInstruction({
      keys,
      programId: new PublicKey(programId),
    });

    const converted = toKitInstruction(instruction);

    expect(converted).to.deep.equal({
      accounts: [
        {
          address: address('F7Kzv7G6p1PvHXL1xXLPTm4myKWpLjnVphCV8ABZJfgT'),
          role: AccountRole.READONLY_SIGNER,
        },
      ],
      programAddress: toKitAddress(new PublicKey(programId)),
    });
  });

  const keyConversionCases = [
    {isSigner: false, isWritable: false, expected: AccountRole.READONLY},
    {isSigner: false, isWritable: true, expected: AccountRole.WRITABLE},
    {isSigner: true, isWritable: false, expected: AccountRole.READONLY_SIGNER},
    {isSigner: true, isWritable: true, expected: AccountRole.WRITABLE_SIGNER},
  ];

  keyConversionCases.forEach(({isSigner, isWritable, expected}) => {
    it(`converts keys with isSigner: ${isSigner}, isWritable: ${isWritable} to ${expected}`, () => {
      const converted = toKitInstruction(
        new TransactionInstruction({
          keys: [{isSigner, isWritable, pubkey: PublicKey.default}],
          programId: PublicKey.default,
        }),
      );

      expect(converted.accounts?.some(account => account.role === expected)).to
        .be.true;
    });
  });
});

describe('fromKitInstruction', () => {
  it('converts a Kit instruction to a TransactionInstruction', () => {
    const kitInstruction = {
      programAddress: address('11111111111111111111111111111111'),
      accounts: [
        {
          address: address('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
          role: AccountRole.WRITABLE_SIGNER,
        },
        {
          address: address('9A87Qt8sxxLMe7hcrjC4cPnho1CwWKRpk84ZTRPyvWNw'),
          role: AccountRole.READONLY,
        },
      ],
      data: new Uint8Array([10, 20, 30]),
    };

    const converted = fromKitInstruction(kitInstruction);

    expect(converted).to.be.instanceOf(TransactionInstruction);
    expect(converted.programId.toBase58()).to.eq(
      '11111111111111111111111111111111',
    );
    expect(converted.keys).to.have.length(2);
    expect(converted.keys[0].isSigner).to.be.true;
    expect(converted.keys[0].isWritable).to.be.true;
    expect(converted.keys[0].pubkey.toBase58()).to.eq(
      '7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK',
    );
    expect(converted.keys[1].isSigner).to.be.false;
    expect(converted.keys[1].isWritable).to.be.false;
    expect(converted.data).to.deep.equal(new Uint8Array([10, 20, 30]));
  });

  it('handles instruction with no accounts', () => {
    const kitInstruction = {
      programAddress: address('11111111111111111111111111111111'),
      data: new Uint8Array([1, 2, 3]),
    };

    const converted = fromKitInstruction(kitInstruction);

    expect(converted.keys).to.have.length(0);
  });

  it('handles instruction with no data', () => {
    const kitInstruction = {
      programAddress: address('11111111111111111111111111111111'),
      accounts: [
        {
          address: address('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
          role: AccountRole.WRITABLE,
        },
      ],
    };

    const converted = fromKitInstruction(kitInstruction);

    expect(converted.data).to.deep.equal(new Uint8Array(0));
  });

  it('roundtrips with toKitInstruction', () => {
    const original = new TransactionInstruction({
      keys: [
        {
          isSigner: true,
          isWritable: true,
          pubkey: new PublicKey('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
        },
        {
          isSigner: false,
          isWritable: false,
          pubkey: new PublicKey('9A87Qt8sxxLMe7hcrjC4cPnho1CwWKRpk84ZTRPyvWNw'),
        },
      ],
      programId: new PublicKey('11111111111111111111111111111111'),
      data: new Uint8Array([42, 43, 44]),
    });

    const roundtripped = fromKitInstruction(toKitInstruction(original));

    expect(roundtripped.programId.equals(original.programId)).to.be.true;
    expect(roundtripped.keys).to.have.length(original.keys.length);
    for (let i = 0; i < original.keys.length; i++) {
      expect(roundtripped.keys[i].pubkey.equals(original.keys[i].pubkey)).to.be
        .true;
      expect(roundtripped.keys[i].isSigner).to.eq(original.keys[i].isSigner);
      expect(roundtripped.keys[i].isWritable).to.eq(
        original.keys[i].isWritable,
      );
    }
    expect(roundtripped.data).to.deep.equal(original.data);
  });

  it('preserves signer and writable roles from Codama client with noopSigner', async () => {
    const {createNoopSigner} = await import('@solana/signers');
    const {getTransferSolInstruction} = await import('@solana-program/system');
    const {Keypair, SystemInstruction} = await import('../../src');

    const from = (await Keypair.generate()).publicKey;
    const to = (await Keypair.generate()).publicKey;

    const kitIx = getTransferSolInstruction({
      source: createNoopSigner(toKitAddress(from)),
      destination: toKitAddress(to),
      amount: 42,
    });
    const ix = fromKitInstruction(kitIx);

    // source should be signer + writable
    expect(ix.keys[0].pubkey.toBase58()).to.equal(from.toBase58());
    expect(ix.keys[0].isSigner).to.equal(true);
    expect(ix.keys[0].isWritable).to.equal(true);

    // destination should be non-signer + writable
    expect(ix.keys[1].pubkey.toBase58()).to.equal(to.toBase58());
    expect(ix.keys[1].isSigner).to.equal(false);
    expect(ix.keys[1].isWritable).to.equal(true);

    // programId should be system program
    expect(ix.programId.toBase58()).to.equal('11111111111111111111111111111111');

    // data should decode correctly
    const decoded = SystemInstruction.decodeTransfer(ix);
    expect(decoded.lamports).to.equal(42n);
  });
});

describe('isKitInstruction', () => {
  it('returns true for a Kit instruction', () => {
    expect(
      isKitInstruction({
        programAddress: address('11111111111111111111111111111111'),
        accounts: [],
        data: new Uint8Array([1]),
      }),
    ).to.be.true;
  });

  it('returns true for a minimal Kit instruction', () => {
    expect(
      isKitInstruction({
        programAddress: address('11111111111111111111111111111111'),
      }),
    ).to.be.true;
  });

  it('returns false for a TransactionInstruction', () => {
    const ix = new TransactionInstruction({
      keys: [],
      programId: PublicKey.default,
    });
    expect(isKitInstruction(ix)).to.be.false;
  });

  it('returns false for null/undefined/primitives', () => {
    expect(isKitInstruction(null)).to.be.false;
    expect(isKitInstruction(undefined)).to.be.false;
    expect(isKitInstruction('string')).to.be.false;
    expect(isKitInstruction(42)).to.be.false;
  });
});

describe('Transaction.add() with Kit instructions', () => {
  it('accepts a Kit instruction via add()', () => {
    const kitIx = {
      programAddress: address('11111111111111111111111111111111'),
      accounts: [
        {
          address: address('7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK'),
          role: AccountRole.WRITABLE_SIGNER,
        },
      ],
      data: new Uint8Array([1, 2, 3]),
    };

    const tx = new Transaction();
    tx.add(kitIx);

    expect(tx.instructions).to.have.length(1);
    const ix = tx.instructions[0];
    expect(ix).to.be.instanceOf(TransactionInstruction);
    expect(ix.programId.toBase58()).to.eq('11111111111111111111111111111111');
    expect(ix.keys[0].pubkey.toBase58()).to.eq(
      '7EqQdEULxWcraVx3mXKFjc84LhCkMGZCkRuDpvcMwJeK',
    );
    expect(ix.keys[0].isSigner).to.be.true;
    expect(ix.keys[0].isWritable).to.be.true;
    expect(ix.data).to.deep.equal(new Uint8Array([1, 2, 3]));
  });

  it('mixes Kit and web3.js instructions in a single add()', () => {
    const kitIx = {
      programAddress: address('11111111111111111111111111111111'),
      accounts: [],
      data: new Uint8Array([10]),
    };
    const web3jsIx = new TransactionInstruction({
      keys: [],
      programId: PublicKey.default,
      data: new Uint8Array([20]),
    });

    const tx = new Transaction();
    tx.add(kitIx, web3jsIx);

    expect(tx.instructions).to.have.length(2);
    expect(tx.instructions[0].data).to.deep.equal(new Uint8Array([10]));
    expect(tx.instructions[1].data).to.deep.equal(new Uint8Array([20]));
  });
});
