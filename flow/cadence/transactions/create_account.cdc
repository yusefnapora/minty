import FlowToken from ${publicConfig.contractFlowToken}
import FungibleToken from ${publicConfig.contractFungibleToken}

transaction(publicKey: String, flowTokenAmount: UFix64) {
  let tokenAdmin: &FlowToken.Administrator
  let tokenReceiver: &{FungibleToken.Receiver}
  prepare(signer: AuthAccount) {
    let account = AuthAccount(payer: signer)
    account.addPublicKey(publicKey.decodeHex())
		self.tokenAdmin = signer
		  .borrow<&FlowToken.Administrator>(from: /storage/flowTokenAdmin)
		  ?? panic("Signer is not the token admin")
		self.tokenReceiver = account
		  .getCapability(/public/flowTokenReceiver)!
		  .borrow<&{FungibleToken.Receiver}>()
		  ?? panic("Unable to borrow receiver reference")
	}
	execute {
		let minter <- self.tokenAdmin.createNewMinter(allowedAmount: flowTokenAmount)
		let mintedVault <- minter.mintTokens(amount: flowTokenAmount)
		self.tokenReceiver.deposit(from: <-mintedVault)
		destroy minter
	}
}
