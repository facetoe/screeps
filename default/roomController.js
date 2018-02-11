const tm = require('taskManager');
const sm = require('spawnManager');

class RoomController {
    constructor(room) {
        this.taskManager = new tm.TaskManager(room);
        this.spawnManager = new sm.SpawnManager(room);
        this.room = room;
        this.memory = room.memory;
    }

    run() {
        this.taskManager.run();
    }

    toString() {
        return '[' + this.constructor.name + ' ' + this.room.name + ']';
    }
}

module.exports = {
    RoomController
};