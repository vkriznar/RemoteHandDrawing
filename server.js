var express = require("express");
var socket = require("socket.io");
var https = require("https");
var fs = require("fs");

var app = express();

var server = https.createServer({
        key: fs.readFileSync('ssl/server.key'),
        cert: fs.readFileSync('ssl/server.cert')
    }, app).listen(3000, () => {
        console.log('Listening...')
})

var io = socket().listen(server, {key: fs.readFileSync('ssl/server.key'), cert: fs.readFileSync('ssl/server.cert')});
var adminClientId = null;

app.use("/", express.static("public"));
app.use("/admin", express.static("admin"));

io.sockets.on("connection", newConnection);

function newConnection(socket) {
    if (socket.handshake.headers.referer.indexOf("/admin") > -1) {
        adminClientId = socket.id;
        console.log("Admin has connected");
    } else {
        if (adminClientId === null) return
        console.log("New client has connected with id: " + socket.id);
        io.to(adminClientId).emit("newClient", {id: socket.id, color: "#1a1aff", lastPoint: null});
    }

    socket.on("point", draw)
    socket.on("colorChange", colorChange);

    function colorChange(data) {
        if (adminClientId !== null) {
            io.to(adminClientId).emit("colorChange", {id: socket.id, color: data});
        }
    }

    function draw(data) {
        if (adminClientId !== null) {
            io.to(adminClientId).emit("point", {id: socket.id, coordinates: data});
        }
    }
}
