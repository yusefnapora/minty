import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import {{name}} from "../contracts/{{name}}.cdc"

// This transaction configures an account to hold Kitty Items.

transaction {
    prepare(signer: AuthAccount) {
        // if the account doesn't already have a collection
        if signer.borrow<&{{name}}.Collection>(from: {{name}}.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- {{name}}.createEmptyCollection()
            
            // save it to the account
            signer.save(<-collection, to: {{name}}.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&{{name}}.Collection{NonFungibleToken.CollectionPublic, {{name}}.{{name}}CollectionPublic}>({{name}}.CollectionPublicPath, target: {{name}}.CollectionStoragePath)
        }
    }
}
