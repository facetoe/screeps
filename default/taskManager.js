const t = require('task');

const taskTypes = {
    "HarvesterTask": t.HarvesterTask
};

class TaskManager {
    constructor(room) {
        this.room = room;
        this.memory = room.memory;
        if (!this.memory.tasks) {
            this.memory.tasks = {}
        }
        if (!this.memory.runningTasks) {
            this.memory.runningTasks = {}
        }
        if (!this.memory.pendingTasks) {
            // TODO: make this a priority queue
            this.memory.pendingTasks = []
        }
    }


    run() {
        let eligibleCreeps = [];
        let runnableTasks = [];


        for (let creep of this.room.find(FIND_MY_CREEPS)) {
            if (!(creep.id in this.memory.tasks || creep.spawning)) {
                eligibleCreeps.push(creep);
            } else if (creep.id in this.memory.tasks) {
                let type = this.memory.tasks[creep.id].taskType;
                let TaskType = taskTypes[type];
                runnableTasks.push(new TaskType(this.memory.tasks[creep.id]))
            }
        }


        for (let creep of eligibleCreeps) {
            let BestTask = this.chooseBestTask(creep);
            if (BestTask) {
                this.bindTask(BestTask, creep);
                runnableTasks.push(BestTask);
            }
        }

        this.clearRunningTasks();
        for (let task of runnableTasks) {
            let completed = task.run();
            if (completed) {
                delete this.memory.tasks[task.executionState.creepId];
                this.decrementRunningTasks(task.executionState.taskType);
            } else {
                this.incrementRunningTasks(task.executionState.taskType);
            }
        }
    }

    bindTask(BestTask, creep) {
        let id = BestTask.bindTo(creep);
        this.memory.tasks[id] = BestTask.executionState;
    }

    chooseBestTask(creep) {
        // TODO: Implement task choosing logic.
        for (let task of this.memory.pendingTasks) {
            console.log("Pending: " + task)

        }

        // This method returns null if no task is found suitable
        let harvester = new t.HarvesterTask();
        let score = harvester.compatibility(creep);
        return harvester
    }

    getRunningTasks(taskType) {
        return this.memory.runningTasks[taskType] || 0
    }


    clearRunningTasks() {
        this.memory.runningTasks = {}
    }

    incrementRunningTasks(taskType) {
        if (!this.memory.runningTasks[taskType]) {
            this.memory.runningTasks[taskType] = 0
        }
        this.memory.runningTasks[taskType] += 1;
    }

    decrementRunningTasks(taskType) {
        if (this.memory.runningTasks[taskType]) {
            this.memory.runningTasks[taskType] -= 1
        }
    }


    submit(taskType) {
        console.log("Submitting: " + taskType);
        this.memory.pendingTasks.push(taskType)
    }

    remove(task) {
        console.log("Implement me")
    }
}

module.exports = {
    TaskManager,
    taskTypes
};