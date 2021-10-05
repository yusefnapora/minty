import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import MyNFT from "../contracts/MyNFT.cdc"

// This transaction configures an account to hold Kitty Items.

transaction {
    prepare(signer: AuthAccount) {
        // if the account doesn't already have a collection
        if signer.borrow<&MyNFT.Collection>(from: MyNFT.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- MyNFT.createEmptyCollection()
            
            // save it to the account
            signer.save(<-collection, to: MyNFT.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&MyNFT.Collection{NonFungibleToken.CollectionPublic, MyNFT.MyNFTCollectionPublic}>(MyNFT.CollectionPublicPath, target: MyNFT.CollectionStoragePath)
        }
    }
}
