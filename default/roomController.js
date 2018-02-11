const tm = require('taskManager');
const sm = require('spawnManager');


RoomSpecification = {
    taskType: "HarvesterTask",
    count: 2
};

class RoomController {
    constructor(room) {
        this.taskManager = new tm.TaskManager(room);
        this.spawnManager = new sm.SpawnManager(room);
        this.room = room;
        this.memory = room.memory;

        // TODO: Make these pluggable/dynamic
        this.roomSpec = RoomSpecification
    }

    run() {
        console.log(this.taskManager.getRunningTasks('HarvesterTask'));
        this.taskManager.run();
    }

    toString() {
        return '[' + this.constructor.name + ' ' + this.room.name + ']';
    }
}

module.exports = {
    RoomController
};