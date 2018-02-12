const t = require('task');

const taskTypes = {
    "HarvesterTask": t.HarvesterTask,
    "BuilderTask": t.BuilderTask,
    "RepairTask": t.RepairTask
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
        // TODO: this is all horribly inefficient
        let eligibleCreeps = [];
        let runnableTasks = [];

        // var bookCount = Object.keys(this.memory.tasks).length;

        for (let creep of this.room.find(FIND_MY_CREEPS)) {
            // eligibleCreeps.push(creep);
            // break
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

        // Garbage collection
        for (let taskId in this.memory.tasks) {
            var pos = runnableTasks.map(function (x) {
                return x.creep.id;
            }).indexOf(taskId);
            if (pos === -1) {
                console.log("Cleaning garbage: " + taskId);
                delete this.memory.tasks[taskId]
            }
        }
    }

    bindTask(BestTask, creep) {
        let id = BestTask.bindTo(creep);
        this.memory.tasks[id] = BestTask.executionState;
    }

    chooseBestTask(creep) {
        // TODO: FIX ME
        function shuffle(a) {
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }


        let fuckDoItProperly = [
            taskTypes.HarvesterTask, taskTypes.HarvesterTask, taskTypes.HarvesterTask
            , taskTypes.HarvesterTask, taskTypes.HarvesterTask, taskTypes.HarvesterTask,
            taskTypes.BuilderTask, taskTypes.BuilderTask,
            taskTypes.RepairTask, taskTypes.RepairTask];
        // // TODO: Implement task choosing logic.
        for (let task of shuffle(fuckDoItProperly)) {
            return new task()
        }
        // return task
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