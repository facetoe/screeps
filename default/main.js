const rc = require('roomController');

module.exports.loop = function () {
    for (let room in Game.rooms) {
        let controller = new rc.RoomController(Game.rooms[room]);
        controller.run();
    }
};