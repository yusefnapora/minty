import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import TestToken from "../contracts/TestToken.cdc"

// This transaction configures an account to hold Kitty Items.

transaction {
    prepare(signer: AuthAccount) {
        // if the account doesn't already have a collection
        if signer.borrow<&TestToken.Collection>(from: TestToken.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- TestToken.createEmptyCollection()
            
            // save it to the account
            signer.save(<-collection, to: TestToken.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&TestToken.Collection{NonFungibleToken.CollectionPublic, TestToken.TestTokenCollectionPublic}>(TestToken.CollectionPublicPath, target: TestToken.CollectionStoragePath)
        }
    }
}
