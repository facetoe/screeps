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
        console.log(this.creep.name + " " + this.memory.state + " -> " + targetState);
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
            let roomCreeps = this.creep.room.find(FIND_MY_CREEPS);
            let source = this.creep.pos.findClosestByPath(FIND_SOURCES, {
                filter: (source) => _.sum(roomCreeps, (creep) => source.id === this.memory.sourceId) === 0
            });

            if (!source) {
                let sources = this.creep.room.find(FIND_SOURCES);
                if (sources.length) {
                    source = _.min(sources, (s) => _.sum(roomCreeps, (c) => s.id === this.memory.sourceId));
                }
            }
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
        if (!this.memory.destinationId) {
            let spawns = this.creep.room.find(FIND_MY_SPAWNS);
            // TODO: Support multiple spawns/destinations
            this.memory.destinationId = spawns[0].id
        }

        let destination = Game.getObjectById(this.memory.destinationId);
        let rc = this.creep.transfer(destination, RESOURCE_ENERGY);
        if (rc === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(destination);
        } else if (rc === ERR_FULL) {
            // TODO: Handle this
        } else if (this.creep.carry.energy === 0) {
            this.changeState(this.state.FILLING);
        }
    }


    requiredParts() {
        return [WORK, CARRY, MOVE]
    }
}


class BuilderTask extends HarvesterTask {

    requiredParts() {
        return [WORK, WORK, MOVE, CARRY]
    }

    filling() {
        console.log("CALLED FI");
        if (!this.memory.sourceId) {
            let roomCreeps = this.creep.room.find(FIND_MY_CREEPS);
            let source = this.creep.pos.findClosestByPath(FIND_SOURCES, {
                filter: (source) => _.sum(roomCreeps, (creep) => source.id === this.memory.sourceId) === 0
            });

            if (!source) {
                let sources = this.creep.room.find(FIND_SOURCES);
                if (sources.length) {
                    source = _.min(sources, (s) => _.sum(roomCreeps, (c) => s.id === this.memory.sourceId));
                }
            }
            this.memory.sourceId = source.id;
            this.changeState(this.state.FILLING);
        }
    }
    emptying() {
        console.log("CALLED EMP");
        if (!this.memory.destinationId) {
            let repairSite = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: (s) => ((s.hits / s.hitsMax) * 100) < 70 && s.structureType !== STRUCTURE_WALL
            });

            if (repairSite) {
                this.creep.say("Repair");
                this.memory.destinationId = repairSite.id;
            } else {
                const targetSite = this.creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
                if (targetSite) {
                    this.memory.destinationId = targetSite.id;
                } else {
                    console.log("WAT: " + targetSite)
                }
            }
        }

        let dest = Game.getObjectById(this.memory.destinationId);
        if (dest instanceof ConstructionSite) {
            var r = this.creep.build(dest);
        } else {
            var r = this.creep.repair(dest);
            if (r === OK && dest.hits === dest.hitsMax) {
                this.creep.memory.destinationId = null;
                this.creep.say("Done!");
                this.changeState(this.state.FILLING)
            }
        }

        if (r === ERR_NOT_ENOUGH_ENERGY || r === ERR_INVALID_TARGET) {
            this.creep.memory.destinationId = null;
            this.creep.memory.sourceId = null;
            this.changeState(this.state.FILLING)
        } else if (r === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(dest);
            return false
        }
    }
}

module.exports = {
    HarvesterTask,
    BuilderTask
};