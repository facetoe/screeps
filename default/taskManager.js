const t = require('task');

class TaskManager {
    constructor(room) {
        this.room = room;
        this.memory = room.memory;
        if (!this.memory.tasks) {
            this.memory.tasks = {}
        }
    }


    run() {
        let eligibleCreeps = [];
        let runnableTasks = [];

        for (let creep of this.room.find(FIND_MY_CREEPS)) {
            if (!(creep.id in this.memory.tasks || creep.spawning)) {
                eligibleCreeps.push(creep);
            } else if (creep.id in this.memory.tasks) {
                runnableTasks.push(new t.HarvesterTask(this.memory.tasks[creep.id]))
            }
        }

        for (let creep of eligibleCreeps) {
            let harvester = new t.HarvesterTask();
            let score = harvester.compatibility(creep);
            if (score > 0) {
                let id = harvester.bindTo(creep);
                this.memory.tasks[id] = harvester.executionState;
                runnableTasks.push(harvester);
            }
        }

        for (let task of runnableTasks) {
            let completed = task.run();
            if (completed) {
                delete this.memory.tasks[task.executionState.creepId];
            }
        }
    }

    submit(task) {
        console.log("Submitting: " + task + " with type: " + task.executionState.taskType);
        let taskType = task.executionState.taskType;
        let creepId = task.executionState.creepId;
        if (this.memory.tasks[creepId]) {
            console.log("Updating task: " + taskType.executionState.creepId)
        }
        this.memory.tasks[creepId] = task.executionState;
    }

    remove(task) {

    }
}

module.exports = {
    TaskManager
};