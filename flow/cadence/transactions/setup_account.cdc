import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import CoolCats from "../contracts/CoolCats.cdc"

// This transaction configures an account to hold Kitty Items.

transaction {
    prepare(signer: AuthAccount) {
        // if the account doesn't already have a collection
        if signer.borrow<&CoolCats.Collection>(from: CoolCats.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- CoolCats.createEmptyCollection()
            
            // save it to the account
            signer.save(<-collection, to: CoolCats.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&CoolCats.Collection{NonFungibleToken.CollectionPublic, CoolCats.CoolCatsCollectionPublic}>(CoolCats.CollectionPublicPath, target: CoolCats.CollectionStoragePath)
        }
    }
}
