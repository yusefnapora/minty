import * as fcl from "@onflow/fcl";
import sign from "./signer";

const config = {}; // TODO

const authFucntion = (account) => {
  return {
    ...account, // bunch of defaults in here, we want to overload some of them though
    tempId: `${config.flowAddress}}-${config.keyId}`, // tempIds are more of an advanced topic, for 99% of the times where you know the address and keyId you will want it to be a unique string per that address and keyId
    addr: fcl.sansPrefix(config.flowAddress), // the address of the signatory, currently it needs to be without a prefix right now
    keyId: Number(config.keyId), // this is the keyId for the accounts registered key that will be used to sign, make extra sure this is a number and not a string
    signingFunction: async ({
      message, // The encoded string which needs to be used to produce the signature.
      addr, // The address of the Flow Account this signature is to be produced for.
      keyId, // The keyId of the key which is to be used to produce the signature.
      roles: {
        proposer, // A Boolean representing if this signature to be produced for a proposer.
        authorizer, // A Boolean representing if this signature to be produced for a authorizer.
        payer // A Boolean representing if this signature to be produced for a payer.
      },
      voucher // The raw transactions information, can be used to create the message for additional safety and lack of trust in the supplied message.
    }) => {
      // Singing functions are passed a signable and need to return a composite signature
      // signable.message is a hex string of what needs to be signed.
      return {
        addr: fcl.withPrefix(config.flowAddress), // needs to be the same as the account.addr but this time with a prefix, eventually they will both be with a prefix
        keyId: Number(config.keyId), // needs to be the same as account.keyId, once again make sure its a number and not a string
        signature: sign(message) // this needs to be a hex string of the signature, where signable.message is the hex value that needs to be signed
      };
    }
  };
};

module.exports = authFucntion;
