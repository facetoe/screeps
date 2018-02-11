const tm = require('taskManager');
const sm = require('spawnManager');


RoomSpecification = [
    {
        taskType: "HarvesterTask",
        count: 0
    },
    {
        taskType: "BuilderTask",
        count: 1
    },
];

class RoomController {
    constructor(room) {
        this.taskManager = new tm.TaskManager(room);
        this.spawnManager = new sm.SpawnManager(room, RoomSpecification);
        this.room = room;
        this.memory = room.memory;

    }

    run() {
        this.spawnManager.run();
        this.taskManager.run();
    }

    toString() {
        return '[' + this.constructor.name + ' ' + this.room.name + ']';
    }
}

module.exports = {
    RoomController
};