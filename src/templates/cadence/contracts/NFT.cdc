import NonFungibleToken from "./NonFungibleToken.cdc"

pub contract {{ name }}: NonFungibleToken {

    // Events
    //
    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Minted(id: UInt64)

    // Named Paths
    //
    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath
    pub let CollectionPrivatePath: PrivatePath
    pub let AdminStoragePath: StoragePath

    // totalSupply
    // The total number of {{ name }} that have been minted
    //
    pub var totalSupply: UInt64
    pub var tokenName: String

    pub enum DropStatus: UInt8 {
        pub case open
        pub case paused
        pub case closed
    }

    pub struct Drop {

        access(self) let collection: Capability<&Collection>

        pub var size: Int
        pub var status: DropStatus

        pub fun pause() {
            self.status = DropStatus.paused
        }

        pub fun resume() {
            pre {
                self.status != DropStatus.closed : "Cannot resume drop that is closed"
            }

            self.status = DropStatus.open
        }

        pub fun close() {
            self.status = DropStatus.closed
        }

        pub fun supply(): Int {
            return self.collection.borrow()!.size()
        }

        pub fun complete(): Bool {
            return self.supply() == 0
        }

        access(contract) fun pop(): @NonFungibleToken.NFT {
            let collection = self.collection.borrow()!

            let nft <- collection.pop()

            if collection.size() == 0 {
                self.close()
            }

            return <- nft
        }

        init(collection: Capability<&Collection>) {
            self.collection = collection
            self.size = collection.borrow()!.size()
            self.status = DropStatus.open
        }
    }

    pub var drop: Drop?

    pub resource NFT: NonFungibleToken.INFT {

        pub let id: UInt64

        // The IPFS CID of the metadata file.
        pub let metadata: String

        init(id: UInt64, metadata: String) {
            self.id = id
            self.metadata = metadata
        }
    }

    pub resource interface {{ name }}CollectionPublic {
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT
        pub fun borrow{{ name }}(id: UInt64): &{{ name }}.NFT? {
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow {{ name }} reference: The ID of the returned reference is incorrect"
            }
        }
    }

    pub resource Collection: {{ name }}CollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic {
        
        // dictionary of NFTs
        // NFT is a resource type with an `UInt64` ID field
        //
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        // withdraw
        // Removes an NFT from the collection and moves it to the caller
        //
        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")

            emit Withdraw(id: token.id, from: self.owner?.address)

            return <-token
        }

        // deposit
        // Takes a NFT and adds it to the collections dictionary
        // and adds the ID to the id array
        //
        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @{{ name }}.NFT

            let id: UInt64 = token.id

            // add the new token to the dictionary which removes the old one
            let oldToken <- self.ownedNFTs[id] <- token

            emit Deposit(id: id, to: self.owner?.address)

            destroy oldToken
        }

        // getIDs
        // Returns an array of the IDs that are in the collection
        //
        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }

        // borrowNFT
        // Gets a reference to an NFT in the collection
        // so that the caller can read its metadata and call its methods
        //
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return &self.ownedNFTs[id] as &NonFungibleToken.NFT
        }

        // borrow{{ name }}
        // Gets a reference to an NFT in the collection as a {{ name }},
        // exposing all of its fields (including the typeID).
        // This is safe as there are no functions that can be called on the KittyItem.
        //
        pub fun borrow{{ name }}(id: UInt64): &{{ name }}.NFT? {
            if self.ownedNFTs[id] != nil {
                let ref = &self.ownedNFTs[id] as auth &NonFungibleToken.NFT
                return ref as! &{{ name }}.NFT
            } else {
                return nil
            }
        }

        pub fun pop(): @NonFungibleToken.NFT {
            let nextID = self.ownedNFTs.keys[0]
            return <- self.withdraw(withdrawID: nextID)
        }

        pub fun size(): Int {
            return self.ownedNFTs.length
        }

        // destructor
        destroy() {
            destroy self.ownedNFTs
        }

        // initializer
        //
        init () {
            self.ownedNFTs <- {}
        }
    }

    // createEmptyCollection
    // public function that anyone can call to create a new empty collection
    //
    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }

    // Admin
    // Resource that an admin can use to mint NFTs and manage drops.
    //
	pub resource Admin {

		// mintNFT
        // Mints a new NFT with a new ID
		// and deposit it in the recipients collection using their collection reference
        //
		pub fun mintNFT(recipient: &{NonFungibleToken.CollectionPublic}, metadata: String) {
            emit Minted(id: {{ name }}.totalSupply)

			// deposit it in the recipient's account using their reference
			recipient.deposit(token: <-create {{ name }}.NFT(id: {{ name }}.totalSupply, metadata: metadata))

            {{ name }}.totalSupply = {{ name }}.totalSupply + (1 as UInt64)
		}

        pub fun startDrop(collection: Capability<&Collection>) {
            {{ name }}.drop = Drop(collection: collection)
        }

        pub fun pauseDrop() {
            {{ name }}.drop!.pause()
        }

        pub fun resumeDrop() {
            {{ name }}.drop!.resume()
        }

        pub fun removeDrop() {
            {{ name }}.drop = nil
        }
	}

    // fetch
    // Get a reference to a {{ name }} from an account's Collection, if available.
    // If an account does not have a {{ name }}.Collection, panic.
    // If it has a collection but does not contain the itemID, return nil.
    // If it has a collection and that collection contains the itemID, return a reference to that.
    //
    pub fun fetch(_ from: Address, itemID: UInt64): &{{ name }}.NFT? {
        let collection = getAccount(from)
            .getCapability({{ name }}.CollectionPublicPath)!
            .borrow<&{ {{ name }}.{{ name }}CollectionPublic }>()
            ?? panic("Couldn't get collection")

        // We trust {{ name }}.Collection.borow{{ name }} to get the correct itemID
        // (it checks it before returning it).
        return collection.borrow{{ name }}(id: itemID)
    }

    pub fun getDrop(): Drop? {
        return {{ name }}.drop
    }

    pub fun claim(recipient: &{NonFungibleToken.CollectionPublic}) {
        pre {
            {{ name }}.drop != nil : "No active drop"
            {{ name }}.drop!.status != DropStatus.paused : "Drop is paused"
            {{ name }}.drop!.status != DropStatus.closed : "Drop is closed"
        }

        let nft <- {{ name }}.drop!.pop()

        recipient.deposit(token: <-nft)
    }

    // initializer
    //
	init() {
        self.tokenName = "{{ name }}"
        self.drop = nil

        // Set our named paths
        self.CollectionStoragePath = /storage/{{ name }}Collection
        self.CollectionPublicPath = /public/{{ name }}Collection
        self.CollectionPrivatePath = /private/{{ name }}Collection
        self.AdminStoragePath = /storage/{{ name }}Admin

        // Initialize the total supply
        self.totalSupply = 0

        let collection <- {{ name }}.createEmptyCollection()
        
        self.account.save(<-collection, to: {{ name }}.CollectionStoragePath)

        self.account.link<&{{ name }}.Collection>({{ name }}.CollectionPrivatePath, target: {{ name }}.CollectionStoragePath)

        self.account.link<&{{ name }}.Collection{NonFungibleToken.CollectionPublic, {{ name }}.{{ name }}CollectionPublic}>({{ name }}.CollectionPublicPath, target: {{ name }}.CollectionStoragePath)
        
        // Create an admin resource and save it to storage
        let admin <- create Admin()
        self.account.save(<-admin, to: self.AdminStoragePath)

        emit ContractInitialized()
	}
}
