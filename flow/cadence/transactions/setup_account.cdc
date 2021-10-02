import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import NextToken from "../contracts/NextToken.cdc"

// This transaction configures an account to hold Kitty Items.

transaction {
    prepare(signer: AuthAccount) {
        // if the account doesn't already have a collection
        if signer.borrow<&NextToken.Collection>(from: NextToken.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- NextToken.createEmptyCollection()
            
            // save it to the account
            signer.save(<-collection, to: NextToken.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&NextToken.Collection{NonFungibleToken.CollectionPublic, NextToken.NextTokenCollectionPublic}>(NextToken.CollectionPublicPath, target: NextToken.CollectionStoragePath)
        }
    }
}
