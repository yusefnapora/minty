import {{ name }} from "../contracts/{{ name }}.cdc"

transaction {
    
    let admin: &{{ name }}.Admin
    let collection: Capability<&{{ name }}.Collection>

    prepare(signer: AuthAccount) {
        self.admin = signer
            .borrow<&{{ name }}.Admin>(from: {{ name }}.AdminStoragePath)
            ?? panic("Could not borrow a reference to the NFT admin")

        self.collection = signer
            .getCapability<&{{ name }}.Collection>({{ name }}.CollectionPrivatePath)
    }

    execute {
        self.admin.startDrop(collection: self.collection)
    }
}
