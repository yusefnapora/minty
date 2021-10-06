import {{ name }} from "../contracts/{{ name }}.cdc"

transaction {
    
    let admin: &{{ name }}.Admin

    prepare(signer: AuthAccount) {
        self.admin = signer
            .borrow<&{{ name }}.Admin>(from: {{ name }}.AdminStoragePath)
            ?? panic("Could not borrow a reference to the NFT admin")
    }

    execute {
        self.admin.removeDrop()
    }
}
