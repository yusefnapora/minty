import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import McMoments from "../contracts/McMoments.cdc"

// This transaction configures an account to hold Kitty Items.

transaction {
    prepare(signer: AuthAccount) {
        // if the account doesn't already have a collection
        if signer.borrow<&McMoments.Collection>(from: McMoments.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- McMoments.createEmptyCollection()
            
            // save it to the account
            signer.save(<-collection, to: McMoments.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&McMoments.Collection{NonFungibleToken.CollectionPublic, McMoments.McMomentsCollectionPublic}>(McMoments.CollectionPublicPath, target: McMoments.CollectionStoragePath)
        }
    }
}
