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
        } else {
            console.log("Spawn result: " + r)
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
        if (spawn.energy < spawn.energyCapacity) {
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
            return true;
        }
        return false;
    }


}


// Harvester = {
//     state: {
//         SPAWNING: "SPAWNING",
//         MOVING: "MOVING",
//         HARVESTING: "HARVESTING",
//         DELIVERING: "DELIVERING",
//     },
//     body: [WORK, CARRY, MOVE],
//     type: CreepType.HARVESTER,
//
//     runnable: function (creep) {
//         // if (creep.memory.state === this.state.SPAWNING) {
//         //     return false
//         // }
//         //
//         // if (creep.memory.spawnID) {
//         //     let spawn = Game.getObjectById(creep.memory.spawnID);
//         //     if (spawn.energy >= spawn.energyCapacity) {
//         //         return false
//         //     }
//         // }
//         return !creep.spawning
//     },
//
//     run: function (creep) {
//         if (!creep.memory.state) {
//             creep.memory.state = this.state.SPAWNING
//         }
//
//         // creep.memory.state = this.state.SPAWNING;
//
//         switch (creep.memory.state) {
//             case this.state.SPAWNING:
//                 this.spawn(creep);
//                 break;
//             case this.state.MOVING:
//                 this.move(creep);
//                 break;
//             case this.state.HARVESTING:
//                 this.harvest(creep);
//                 break;
//             case this.state.DELIVERING:
//                 this.deliver(creep);
//                 break;
//         }
//
//     },
//
//     spawn: function (creep) {
//         let sources = creep.room.find(FIND_SOURCES);
//         let i = Math.floor(Math.random() * sources.length);
//         creep.memory.sourceId = sources[i].id;
//         this.changeState(creep, this.state.MOVING)
//     },
//
//     move: function (creep) {
//         if (!creep.memory.sourceId) {
//             console.log("No source WTF!")
//         }
//
//         let source = Game.getObjectById(creep.memory.sourceId);
//
//         let r = creep.harvest(source);
//         if (r === ERR_NOT_IN_RANGE) {
//             creep.moveTo(source);
//         } else if (r === OK) {
//             this.changeState(creep, this.state.HARVESTING);
//             this.harvest(creep);
//         } else {
//             console.log("Unkexpected return code: " + r);
//         }
//     },
//
//     harvest: function (creep) {
//         let source = Game.getObjectById(creep.memory.sourceId);
//
//         if (creep.carry.energy < creep.carryCapacity) {
//             let r = creep.harvest(source);
//             if (r === ERR_NOT_IN_RANGE) {
//                 console.log("Harvest moving to source");
//                 creep.moveTo(source);
//             }
//         } else {
//             let spawns = creep.room.find(FIND_MY_SPAWNS);
//
//             // TODO: Handle multiple spawns
//             let spawn = spawns[0];
//
//
//             creep.memory.spawnID = spawn.id;
//
//             this.changeState(creep, this.state.DELIVERING);
//         }
//
//     },
//
//     deliver: function (creep) {
//         if (!creep.memory.spawnID) {
//             console.log("No spawnID WTF!")
//         }
//
//         if (creep.carry.energy === 0) {
//             creep.memory.deliveryTargetID = null;
//             this.changeState(creep, this.state.MOVING);
//             return
//         }
//
//
//         if (!creep.memory.deliveryTargetID) {
//             let spawn = Game.getObjectById(creep.memory.spawnID);
//             if (spawn.energy < spawn.energyCapacity) {
//                 creep.memory.deliveryTargetID = spawn.id
//             } else {
//                 creep.memory.deliveryTargetID = creep.room.controller.id
//             }
//         }
//
//
//         let deliveryTarget = Game.getObjectById(creep.memory.deliveryTargetID);
//
//         if (deliveryTarget instanceof StructureSpawn) {
//             if (creep.transfer(deliveryTarget, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
//                 creep.moveTo(deliveryTarget)
//             }
//         } else if (deliveryTarget instanceof StructureController) {
//             if (creep.upgradeController(deliveryTarget) === ERR_NOT_IN_RANGE) {
//                 creep.moveTo(deliveryTarget)
//             }
//         }
//     },
//
//     changeState(creep, target_state) {
//         // console.log(creep.memory.state + " -> " + target_state);
//         creep.memory.state = target_state
//     }
// };

Builder = {
    body: [WORK, CARRY, MOVE],
    type: CreepType.BUILDER,

    runnable: function (creep) {
        return true;
    },

    run: function (creep) {

        if (!creep.memory.targetSiteID) {
            const targetSite = creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
            let r = creep.build(targetSite);
            if (r === ERR_NOT_IN_RANGE) {
                creep.memory.targetSiteID = targetSite.id;
                creep.moveTo(targetSite)
            } else {
                console.log("SHIT: " + r)
            }

        }
        // console.log("sites" + constructionStites)
    }
};


RoomSpec = [
    {
        class: Harvester,
        type: CreepType.HARVESTER,
        count: 30
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
                        if (result === 0) {
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
    for (let creep_name in Game.creeps) {
        let creep = Game.creeps[creep_name];

        // let r = creep.room.lookForAt(LOOK_CONSTRUCTION_SITES, creep.pos);
        // if (isEmpty(r)) {
        //     let x = creep.room.createConstructionSite(creep.pos, STRUCTURE_ROAD);
        //     // console.log(x)
        // }

        // creep.suicide()
        let worker = new Harvester(creep);
        worker.run()



        // if (creep.memory.type === CreepType.HARVESTER && Harvester.runnable(creep)) {
        //     Harvester.run(creep);
        // } else if (creep.memory.type === CreepType.BUILDER && Builder.runnable(creep)) {
        //     Builder.run(creep);
        // } else {
        //     console.log(creep + " not runnable")
        // }
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