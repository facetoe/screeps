class Task {
    constructor(executionState, requiredParts) {
        if (!executionState) {
            this.executionState = ExecutionState(this._generateId(), this.constructor.name)
        } else {
            this.executionState = executionState
        }

        this.memory = this.executionState.memory;

        this._requiredParts = requiredParts;

        if (this.executionState.creepId) {
            this.creep = Game.getObjectById(this.executionState.creepId)
        }
    };

    static combatibility(creep) {
        throw new Error('Implement compatibility()');
    }

    requiredParts() {
        return this._requiredParts
    }

    bindTo(creep) {
        console.log("Binding " + this + " to creep: " + creep);
        this.executionState.creepId = creep.id;
        this.creep = creep;
        return this.executionState.creepId;
    }

    run() {
        throw new Error('Implement run()');
    }

    _generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    toString() {
        return this.constructor.name
    }
}

const ExecutionState = function (id, type) {
    return {
        id: id,
        creepId: null,
        taskType: type,
        runTime: 0,
        preEmptable: false,
        priority: 10,
        memory: {},
        toString: function () {
            return "ExecutionState(id=" + this.id + ",creepId=" + this.creepId + ")"
        }
    }
};


class WorkerTask extends Task {
    constructor(executionState) {
        super(executionState, [WORK, MOVE, CARRY]);
        this.state = {
            FILLING: "FILLING",
            EMPTYING: "EMPTYING",
        };
    }

    run() {
        if (!this.memory.state) {
            this.changeState(this.state.FILLING)
        }

        switch (this.memory.state) {
            case this.state.FILLING:
                this.filling();
                break;
            case this.state.EMPTYING:
                this.emptying();
                break;
            default:
                console.log("Unknown State: " + this.memory.state)
        }
        return false;
    }

    changeState(targetState) {
        // console.log(this.creep.name + " " + this.memory.state + " -> " + targetState);
        this.memory.state = targetState;
    }

    filling() {
        console.log("IMPLEMENT ME")
    }

    emptying() {
        console.log("IMPLEMENT ME")
    }

    compatibility(creep) {
        let creepParts = {};
        for (let part of creep.body) {
            creepParts[part.type] = null
        }
        for (let part of this.requiredParts()) {
            if (!part in creepParts) {
                return 0
            }
        }
        return 10
    }
}

class HarvesterTask extends WorkerTask {

    filling() {
        if (!this.memory.sourceId) {
            // Pick a random source in the room.
            let sources = this.creep.room.find(FIND_SOURCES);
            let source = sources[Math.floor(Math.random() * sources.length)];
            this.memory.sourceId = source.id;
            this.changeState(this.state.FILLING);
        }

        let source = Game.getObjectById(this.memory.sourceId);
        let rc = this.creep.harvest(source);
        if (rc === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(source);
        } else if (rc === OK) {
            if (this.creep.carry.energy >= this.creep.carryCapacity) {
                this.changeState(this.state.EMPTYING)
            }
        } else {
            console.log("HarvesterTask: " + rc)
        }
    }


    emptying() {
        if (!this.memory.spawnId) {
            let spawns = this.creep.room.find(FIND_MY_SPAWNS);
            if (spawns.length === 0) {
                return
            }
            this.memory.spawnId = spawns[0].id;
        }

        if (!this.memory.destinationId) {
            let container = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER &&
                    s.store.energy < s.storeCapacity
            });
            if (container) {
                this.memory.destinationId = container.id
            }
        }

        // FIX ME FUCK
        if (Math.floor(Math.random() * Math.floor(600)) === 1) {
            let spawn = Game.getObjectById(this.memory.spawnId);
            let spawnEnergyPercent = (spawn.energy / spawn.energyCapacity) * 100;
            if (spawnEnergyPercent < 50) {
                this.memory.destinationId = spawn.id
            } else if (!this.creep.memory.destinationId) {
                this.memory.destinationId = this.creep.room.controller.id
            }
        }


        let deliveryTarget = Game.getObjectById(this.memory.destinationId);
        if (deliveryTarget instanceof StructureSpawn || deliveryTarget instanceof StructureContainer) {
            this.creep.say("Spawn");
            let r = this.creep.transfer(deliveryTarget, RESOURCE_ENERGY);
            if (r === ERR_FULL) {
                this.clear();
                this.changeState(this.state.FILLING)
            } else if (r === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(deliveryTarget)
            }
        } else if (deliveryTarget instanceof StructureController) {
            this.creep.say("Controller");
            if (this.creep.upgradeController(deliveryTarget) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(deliveryTarget)
            }
        }

        if (this.creep.carry.energy === 0) {
            // this.clear();
            this.changeState(this.state.FILLING);
        }
    }

    clear() {
        this.memory.destinationId = null;
    }


    requiredParts() {
        return [WORK, CARRY, MOVE]
    }
}


class BuilderTask extends WorkerTask {

    requiredParts() {
        return [WORK, WORK, MOVE, CARRY]
    }

    filling() {
        if (!this.memory.sourceId) {
            let containers = this.creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER &&
                    (s.store.energy / s.storeCapacity) * 100 > 10
            });

            let source = containers[Math.floor(Math.random() * containers.length)];
            if (source) {
                this.memory.sourceId = source.id;
            } else {
                let sources = this.creep.room.find(FIND_SOURCES);
                let source = sources[Math.floor(Math.random() * sources.length)];
                if(source) {
                    this.memory.sourceId = source.id;
                } else {
                    this.memory.sourceId = source.id = null;
                }
            }
        }

        let source = Game.getObjectById(this.memory.sourceId);
        let rc = this.creep.harvest(source, RESOURCE_ENERGY);
        if (rc === ERR_INVALID_TARGET) {
            rc = this.creep.withdraw(source, RESOURCE_ENERGY)
        }
        if (rc === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(source)
        }

        if (this.creep.carry.energy >= this.creep.carryCapacity) {
            this.changeState(this.state.EMPTYING)
        }

    }

    emptying() {
        if (!this.memory.destinationId) {
            let repairSite = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => ((s.hits / s.hitsMax) * 100) < 60 && s.structureType !== STRUCTURE_WALL
            });

            if (repairSite) {
                this.creep.say("Repair");
                this.memory.destinationId = repairSite.id;
            } else {
                const targetSite = this.creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                this.creep.say("Construct");
                if (targetSite) {
                    this.memory.destinationId = targetSite.id;
                } else {
                    let sites = this.creep.room.find(FIND_CONSTRUCTION_SITES);
                    if (sites.length === 0) {
                        this.creep.say("ILL BE BACK");
                        console.log(this.creep + " TIME TO DIE: " + sites);
                        this.creep.suicide();
                    }
                }
            }
        }

        let dest = Game.getObjectById(this.memory.destinationId);
        if (dest instanceof ConstructionSite) {
            var r = this.creep.build(dest);
        } else {
            var r = this.creep.repair(dest);
            if (r === OK && dest.hits === dest.hitsMax) {
                this.clear();
                this.changeState(this.state.FILLING);
                return
            }
        }

        if (r === ERR_NOT_ENOUGH_ENERGY || r === ERR_INVALID_TARGET) {
            this.clear()
            this.changeState(this.state.FILLING)
        } else if (r === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(dest);
        }
    }

    clear() {
        this.memory.destinationId = null;
        this.memory.sourceId = null;
    }
}

class UpgraderTask extends WorkerTask {

    filling() {
        if (!this.memory.sources) {
            let sources = this.creep.room.find(STRUCTURE_CONTAINER, {
                filter: (s) => s.structureType === STRUCTURE_CONTAINER &&
                    (s.store.energy / s.storeCapacity) * 100 > 80
            });
            console.log(sources)
        }
    }
}

module.exports = {
    HarvesterTask,
    BuilderTask
};