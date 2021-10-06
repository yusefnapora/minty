import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import TestNFT from "../contracts/TestNFT.cdc"

// This transaction configures an account to hold Kitty Items.

transaction {
    prepare(signer: AuthAccount) {
        // if the account doesn't already have a collection
        if signer.borrow<&TestNFT.Collection>(from: TestNFT.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- TestNFT.createEmptyCollection()
            
            // save it to the account
            signer.save(<-collection, to: TestNFT.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&TestNFT.Collection{NonFungibleToken.CollectionPublic, TestNFT.TestNFTCollectionPublic}>(TestNFT.CollectionPublicPath, target: TestNFT.CollectionStoragePath)
        }
    }
}
