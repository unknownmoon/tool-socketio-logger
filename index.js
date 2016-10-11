var io = require('socket.io')(9528);

io.on('connection', function(socket) {

    io.emit('broadcast', {
        id: socket.id,
        msg: socket.id + ' connected'
    });

    socket.on('debug', function(data) {
        console.log('Data from ' + (data && data['from']) + ': ' + (data && data.msg));
    });

    socket.on('disconnect', function() {
        io.emit(socket.id + ' disconnected');
    });
});