import {{ name }} from "../contracts/{{ name }}.cdc"

pub struct Drop {

    pub let size: Int
    pub let supply: Int
    pub let status: String

    init(size: Int, supply: Int, status: {{ name }}.DropStatus) {
        self.size = size
        self.supply = supply
        self.status = getStatus(status)
    }
}

pub fun getStatus(_ status: {{ name }}.DropStatus): String {
    switch status {
    case {{ name }}.DropStatus.paused:
        return "paused"
    case {{ name }}.DropStatus.closed:
        return "closed"
    }

    return "open"
}

pub fun main(): Drop? {
    if let drop = {{ name }}.getDrop() {
        return Drop(size: drop.size, supply: drop.supply(), status: drop.status)
    }

    return nil
}
