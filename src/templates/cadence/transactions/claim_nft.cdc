import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import {{ name }} from "../contracts/{{ name }}.cdc"

transaction {
    prepare(signer: AuthAccount) {
        if signer.borrow<&{{ name }}.Collection>(from: {{ name }}.CollectionStoragePath) == nil {

            // create a new empty collection
            let collection <- {{ name }}.createEmptyCollection()
            
            // save it to the account
            signer.save(<-collection, to: {{ name }}.CollectionStoragePath)

            // create a public capability for the collection
            signer.link<&{{ name }}.Collection{NonFungibleToken.CollectionPublic, {{ name }}.{{ name }}CollectionPublic}>({{ name }}.CollectionPublicPath, target: {{ name }}.CollectionStoragePath)
        }
        
        let depositRef = signer
            .getCapability({{ name }}.CollectionPublicPath)!
            .borrow<&{NonFungibleToken.CollectionPublic}>()!

        {{ name }}.claim(recipient: depositRef)
    }
}
