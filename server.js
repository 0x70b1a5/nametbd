var express = require('express')
  , app = express(app)
  , server = require('http').createServer(app)
  , io = require('socket.io')(server)
  , port = process.env.PORT || 8000;

// serve static files from the current directory
app.use(express.static(__dirname));

//we'll keep clients data here
var clients = {};

//get EurecaServer class
var EurecaServer = require('eureca.io').EurecaServer;

//create an instance of EurecaServer
var eurecaServer = new EurecaServer({allow:['setId', 'spawnPlayer', 'kill', 'updateState']});

//attach eureca.io to our http server
eurecaServer.attach(server);




//eureca.io provides events to detect clients connect/disconnect

//detect client connection
eurecaServer.onConnect(function (conn) {
    console.log('New Client id=%s ', conn.id, conn.remoteAddress);

	//the getClient method provide a proxy allowing us to call remote client functions
    var remote = eurecaServer.getClient(conn.id);

	//register the client
	clients[conn.id] = {id:conn.id, remote:remote}

	//here we call setId (defined in the client side)
	remote.setId(conn.id);
});

//detect client disconnection
eurecaServer.onDisconnect(function (conn) {
    console.log('Client disconnected ', conn.id);

	var removeId = clients[conn.id].id;

	delete clients[conn.id];

	for (var c in clients)
	{
		var remote = clients[c].remote;

		//here we call kill() method defined in the client side
		remote.kill(conn.id);
	}
});


eurecaServer.exports.handshake = function()
{
	for (var c in clients)
	{
		var remote = clients[c].remote;
		for (var cc in clients)
		{
			//send latest known position
			var x = clients[cc].laststate ? clients[cc].laststate.x : 0;
			var y = clients[cc].laststate ? clients[cc].laststate.y : 0;
      var nick = clients[cc].laststate ? clients[cc].laststate.nick : "Player";

			remote.spawnPlayer(clients[cc].id, x, y, nick);
		}
	}
}


//be exposed to client side
eurecaServer.exports.handleState = function (state) {
	var conn = this.connection;
	var updatedClient = clients[conn.id];

	for (var c in clients)
	{
		var remote = clients[c].remote;
		remote.updateState(updatedClient.id, state);

		//keep last known state so we can send it to new connected clients
		clients[c].laststate = state;
	}
}


// Chatroom (thank you SOCKET.IO)

var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});


// SERVER START!
server.listen(8000, function () {
  console.log('Server listening at port %d', port);
});
