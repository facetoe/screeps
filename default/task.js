/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('task');
 * mod.thing == 'a thing'; // true
 */

class TaskManager {
    constructor(room, tasks) {
        this.room = room;
        this.tasks = tasks;
    }
}


class SpawnManager {
    constructor(pendingSpawns) {
        this.pendingSpawns = pendingSpawns
    }
}


class Task {
    constructor(creep, executionState) {
        this.creep = creep;
        this.executionState = executionState;
    };

    runnable() {
        return this.executionState.runnable;
    }

    run() {
        throw new Error('Implement run()');
    }
}

class TestTask extends Task {
    run() {
        return this.executionState
    }
}

const ExecutionState = function () {
    return {
        id: null,
        creepId: null,
        type: null,
        runTime: 0,
        preEmptable: true,
        runnable: true,
        complete: false,
        memory: {},
        toString: function () {
            return "ExecutionState(id=" +  this.id + ",creepId=" + this.creepId + ")"
        }
    }
};


module.exports = {
    ExecutionState,
    TestTask
};