CreepType = {
    HARVESTER: "HARVESTER",
    BUILDER: "BUILDER",
    BASE: "BASE"
};

class CreepBase {
    constructor(creep) {
        this.creep = creep
    };

    runnable() {
        return true;
    }
}


// // Creeps are runnable by default
// CreepBase.prototype.type = function () {
//     console.log("Thjis should never happen");
// };
//
// // Creeps are runnable by default
// CreepBase.prototype.body = function () {
//     console.log("Thjis should never happen");
// };


class Worker extends CreepBase {

    constructor(creep) {
        super(creep);
        this.state = {
            SPAWNING: "SPAWNING",
            FILLING: "FILLING",
            EMPTYING: "EMPTYING",
        };
    }

    run() {
        // this.creep.memory.state = null;

        if (!this.creep.memory.state) {
            this.changeState(this.state.SPAWNING);
        }

        switch (this.creep.memory.state) {
            case this.state.SPAWNING:
                this.spawn();
                break;
            case this.state.FILLING:
                this.filling();
                break;
            case this.state.EMPTYING:
                this.emptying();
                break;

            default:
            // console.log("Shits fucked yo")
        }

    };


    changeState(target_state) {
        console.log(this.creep.memory.state + " -> " + target_state);
        this.creep.memory.state = target_state
    };


    spawn() {
        let source = this._get_source();
        let r = this.creep.moveTo(source);
        if (r === OK) {
            this.changeState(this.state.FILLING);
        }
    };


    filling() {
        if (this._source_action_complete()) {
            this.changeState(this.state.EMPTYING)
        }
    };

    emptying() {
        if (this._dest_action_complete()) {
            this.changeState(this.state.FILLING)
        }
    };

    _get_source() {

    };

    _get_dest() {

    };

    _source_action_complete() {

    };

    _dest_action_complete() {

    };

}


class Harvester extends Worker {

    constructor(creep) {
        super(creep)
    }

    static spawnCreep(spawn) {
        return spawn.createCreep([MOVE, MOVE, WORK, CARRY], CreepType.HARVESTER + Game.time, {type: CreepType.HARVESTER})
    }

    _get_source() {
        if (!this.creep.memory.sourceId) {
            let sources = this.creep.room.find(FIND_SOURCES);
            let i = Math.floor(Math.random() * sources.length);
            this.creep.memory.sourceId = sources[i].id;
        }
        return Game.getObjectById(this.creep.memory.sourceId);
    };

    _source_action_complete() {
        let source = this._get_source();
        let r = this.creep.harvest(this._get_source());
        if (r === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(source);
        }

        if (this.creep.carry.energy >= this.creep.carryCapacity) {
            return true
        }
        return false
    }

    _get_dest() {
        if (!this.creep.memory.spawnId) {
            let spawns = this.creep.room.find(FIND_MY_SPAWNS);
            this.creep.memory.spawnId = spawns[0].id;
        }

        let spawn = Game.getObjectById(this.creep.memory.spawnId);
        let spawnEnergyPercent = (spawn.energy / spawn.energyCapacity) * 100;
        if (spawnEnergyPercent < 20) {
            this.creep.memory.destinationId = spawn.id
        } else {
            this.creep.memory.destinationId = this.creep.room.controller.id
        }

        return Game.getObjectById(this.creep.memory.destinationId)
    };

    _dest_action_complete() {
        if (!this.creep.memory.destinationId) {
            let dest = this._get_dest()
            this.creep.memory.destinationId = dest.id
        }

        let deliveryTarget = Game.getObjectById(this.creep.memory.destinationId);
        if (deliveryTarget instanceof StructureSpawn) {
            let r = this.creep.transfer(deliveryTarget, RESOURCE_ENERGY);
            if (r === ERR_FULL) {
                this.creep.memory.destinationId = null;
                return true;
            } else if (r === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(deliveryTarget)
            }
        } else if (deliveryTarget instanceof StructureController) {
            if (this.creep.upgradeController(deliveryTarget) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(deliveryTarget)
            }
        }

        if (this.creep.carry.energy === 0) {
            this.creep.memory.destinationId = null;
            return true;
        }
        return false;
    }


}


class Builder extends Worker {
    constructor(creep) {
        super(creep)
    }

    static spawnCreep(spawn) {
        return spawn.createCreep([MOVE, WORK, CARRY], CreepType.BUILDER + Game.time, {type: CreepType.BUILDER})
    }

    _get_source() {
        if (!this.creep.memory.spawnId) {
            let spawns = this.creep.room.find(FIND_MY_SPAWNS);
            this.creep.memory.spawnId = spawns[0].id;
        }

        let spawn = Game.getObjectById(this.creep.memory.spawnId);
        let spawnEnergyPercent = (spawn.energy / spawn.energyCapacity) * 100;

        if (spawnEnergyPercent < 70) {
            let source = this.creep.pos.findClosestByPath(FIND_SOURCES);
            this.creep.memory.sourceId = source.id
        }

        if (this.creep.memory.sourceId) {
            return Game.getObjectById(this.creep.memory.sourceId)
        } else {
            return spawn;
        }
    }

    _source_action_complete() {
        let source = this._get_source();
        if (source instanceof StructureSpawn) {
            var r = this.creep.withdraw(source, RESOURCE_ENERGY);

        } else if (source instanceof Source) {
            var r = this.creep.harvest(source)
        }
        if (r === ERR_FULL) {
            this.creep.sourceId = null;
            return true
        }
        else if (r === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(source);
            return false
        }

        return this.creep.carry.energy >= this.creep.carryCapacity
    }

    _get_dest() {
        if (!this.creep.memory.destinationId) {
            const targetSite = this.creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            this.creep.memory.destinationId = targetSite.id;
        }
        return Game.getObjectById(this.creep.memory.destinationId)
    }

    _dest_action_complete() {
        let dest = this._get_dest();
        let r = this.creep.build(dest);
        if (r === ERR_NOT_ENOUGH_ENERGY) {
            this.creep.memory.destinationId = null;
            this.creep.memory.sourceId = null;
            return true;
        } else if (r === ERR_INVALID_TARGET) {
            this.creep.memory.destinationId = null;
            this.creep.memory.sourceId = null;
            return true
        } else if (r === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(dest);
            return false
        }
        return false
    }


}


RoomSpec = [
    {
        class: Harvester,
        type: CreepType.HARVESTER,
        count: 10
    },
    {
        class: Builder,
        type: CreepType.BUILDER,
        count: 0
    }

];


function countRoomCreeps(room, type) {
    return room.find(FIND_MY_CREEPS, {filter: (creep) => creep.memory.type === type}).length;
}


function spawnRoomCreeps() {
    console.log("Executing spawner");
    for (let spawn_name in Game.spawns) {
        let spawn = Game.spawns[spawn_name];
        if (spawn.room.name in Memory.room_specs) {
            for (let spec of Memory.room_specs[spawn.room.name]) {
                let count = countRoomCreeps(spawn.room, spec.type);
                if (count < spec.count) {
                    let to_spwan = spec.count - count;
                    for (let i = 0; i < to_spwan; i++) {
                        let result = spec.class.spawnCreep(spawn);
                        if (result === OK) {
                            console.log("Spawned: " + spec.class)
                        }
                    }
                }
            }
        }
    }
}


function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function runCreeps() {
    let creeps = [];
    for (let creep_name in Game.creeps) {
        let creep = Game.creeps[creep_name];

        // let r = creep.room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.pos);
        // if (isEmpty(r)) {
        //     let x = creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
        //     // console.log(x)
        // }

        if (creep.memory.type === CreepType.HARVESTER) {
            creeps.push(new Harvester(creep));
        } else if (creep.memory.type === CreepType.BUILDER) {
            creeps.push(new Builder(creep))
        }
    }
    for (let creep of creeps) {
        if (creep.runnable()) {
            creep.run()
        }
    }
}

Constants = {
    SPAWN_FREQUENCY: 30,
};

module.exports.loop = function () {
    Memory.room_specs = {
        W2N8: RoomSpec
    };

    if (Game.time % Constants.SPAWN_FREQUENCY === 0) {
        spawnRoomCreeps();
    }

    runCreeps();

    // console.log(Game.cpu.getUsed(), Game.cpu.tickLimit)

};