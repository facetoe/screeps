const t = require('taskManager');
const taskTypes = t.taskTypes;

class SpawnManager {
    constructor(room, roomSpecification) {
        this.room = room;
        this.memory = room.memory;
        this.roomSpecification = roomSpecification;
    }

    run() {

        // TODO: Refactor this crap
        let creeps = this.room.find(FIND_MY_CREEPS);
        let creepPartCounts = {};
        for (let creep of creeps) {
            let parts = creep.body.map(b => b.type);
            if (parts in creepPartCounts) {
                creepPartCounts[parts] += 1
            } else {
                creepPartCounts[parts] = 1
            }
        }

        for (let spec of this.roomSpecification) {
            let TaskType = taskTypes[spec.taskType];
            let parts = new TaskType().requiredParts();
            let compatibleCreepsCount = creepPartCounts[parts] || 0;
            if (spec.count - compatibleCreepsCount > 0) {
                this.spawnCreep(parts);
            }
        }
    }

    spawnCreep(parts) {
        let spawns = this.room.find(FIND_MY_SPAWNS);
        for (let spawn of spawns) {
            let rc = spawn.createCreep(parts);
            rc = 0;
            // TODO: Handle errors better. Some requests may not be satisfied, might need to have an error callback.
            if (rc !== ERR_NOT_ENOUGH_ENERGY && rc !== OK) {
                console.log("Spawn Result: " + rc);
            }

        }
    }

    reconstructParts(parts) {
        return parts.split(',')
    }
}

module.exports = {
    SpawnManager

};