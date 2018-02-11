class SpawnManager {
    constructor(room) {
        this.room = room;
        this.memory = room.memory;
        if (!this.memory.spawns) {
            this.memory.spawns = {}
        }
    }

    run() {
        for (let parts in this.memory.spawns) {
            let pendingRequests = this.memory.spawns[parts];
            if (pendingRequests > 0) {
                let spawns = this.room.find(FIND_MY_SPAWNS);
                for (let spawn of spawns) {
                    let rc = spawn.createCreep(this.reconstructParts(parts));
                    rc = 0;
                    // TODO: Handle errors better. Some requests may not be satisfied, might need to have an error callback.
                    console.log("Pending parts count: " + this.memory.spawns[parts]);
                    if (rc === OK) {
                        console.log("Spawned creep with parts: " + parts);
                        this.setPending(parts, 0);
                        console.log("Pending parts count after: " + this.memory.spawns[parts]);
                    } else if (rc !== ERR_NOT_ENOUGH_ENERGY) {
                        console.log("Spawn Result: " + rc);
                    }

                }
            }
        }
    }

    reconstructParts(parts) {
        return parts.split(',')
    }

    getPending(parts) {
        return this.memory.spawns[parts] || 0
    }

    setPending(parts, count) {
        this.memory.spawns[parts] = count
    }

    getAllPending() {
        let pending = 0;
        for (let parts in this.memory.spawns) {
            pending += this.memory.spawns[parts]
        }
        return pending;

    }

    submit(parts, count) {
        count = count || 1;
        if (count < 1) {
            console.log("ERROR: negative value passed as count!");
            return
        }
        console.log("Spawn " + count + " requests for: " + parts);
        this.memory.spawns[parts] += count;
    }

    cancel(parts) {
        this.memory.spawns[parts] = 0;
    }


}

module.exports = {
    SpawnManager

};