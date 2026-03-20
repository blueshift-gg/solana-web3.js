import {expect} from 'chai';

import {Keypair} from '../../src';

import {toKitKeypair, createSignerFromLegacyKeypair} from '../../src/compat';

describe('toKitKeypair', function () {
  let legacyKeypair: Keypair;

  before(async () => {
    legacyKeypair = await Keypair.generate();
  });

  ['public', 'private'].forEach(type => {
    describe(`${type} key`, () => {
      let keyPair: CryptoKeyPair;
      beforeEach(async () => {
        keyPair = await toKitKeypair(legacyKeypair);
      });
      it('has the algorithm "Ed25519"', () => {
        const key = keyPair[`${type}Key` as 'publicKey' | 'privateKey'];
        expect(key.algorithm.name).to.equal('Ed25519');
      });
      it('has the string tag "CryptoKey"', () => {
        const key = keyPair[`${type}Key` as 'publicKey' | 'privateKey'];
        expect(Object.prototype.toString.call(key)).to.equal(
          '[object CryptoKey]',
        );
      });
      it(`has the type "${type}"`, () => {
        const key = keyPair[`${type}Key` as 'publicKey' | 'privateKey'];
        expect(key.type).to.equal(type);
      });
    });
  });
  [true, false].forEach(extractable => {
    it(`sets the private key's \`extractable\` accordingly when generating a key pair with the extractability \`${extractable}\``, async () => {
      const keyPair = await toKitKeypair(legacyKeypair, extractable);
      expect(keyPair.privateKey.extractable).to.equal(extractable);
    });
  });
});

describe('createSignerFromLegacyKeypair', function () {
  let legacyKeypair: Keypair;

  before(async () => {
    legacyKeypair = await Keypair.generate();
  });

  it('returns a KeyPairSigner', async () => {
    const signer = await createSignerFromLegacyKeypair(legacyKeypair);
    expect(signer).to.have.property('address');
    expect(signer).to.have.property('signMessages');
    expect(signer).to.have.property('signTransactions');
  });

  it('has an address matching the legacy keypair public key', async () => {
    const signer = await createSignerFromLegacyKeypair(legacyKeypair);
    expect(signer.address).to.equal(legacyKeypair.publicKey.toBase58());
  });

  it('can sign a message', async () => {
    const signer = await createSignerFromLegacyKeypair(legacyKeypair);
    const message = new Uint8Array([1, 2, 3]);
    const [signature] = await signer.signMessages([
      {content: message, signatures: {}},
    ]);
    expect(signature).to.be.an('object');
    // Signature should have exactly one entry keyed by the signer's address
    const sigBytes = Object.values(signature)[0];
    expect(sigBytes).to.be.instanceOf(Uint8Array);
    expect(sigBytes).to.have.lengthOf(64);
  });

  it('passes extractable through to the underlying keypair', async () => {
    const signer = await createSignerFromLegacyKeypair(legacyKeypair, true);
    expect(signer).to.have.property('address');
    // Non-extractable by default
    const signerDefault = await createSignerFromLegacyKeypair(legacyKeypair);
    expect(signerDefault).to.have.property('address');
  });
});
