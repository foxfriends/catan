"use strict";
let express = require("express");
let app = express();
let http = require("http");
let server = app.listen(8888, () => {
    console.log("Server started at 8888");
});
let io = require("socket.io")(server);
let ss = require("socket.io-stream");
let game = require("./script/game.es6");
let data = [];
let stream = require("stream");

let adjacent = require("./script/adjacent.es6");

app.use("", express.static("public_html"));

io.on("connection", (socket) => {
    //Setup
    socket.on("join game", (name, res) => {
        socket.your_name = name.name;
        socket.game_name = name.game;
        console.log(
            `${socket.your_name} is attempting to join ${socket.game_name}`
        );
        socket.join(socket.game_name);
        if(data[socket.game_name] === undefined) {
            data[socket.game_name] = {};
            if(game.exists(socket.game_name)) {
                data[socket.game_name].data = game.load(socket.game_name);
            } else {
                data[socket.game_name].data = game.new(socket.game_name);
            }
            data[socket.game_name].population = 0;
            data[socket.game_name].robber_clear = 4;
            data[socket.game_name].trade = [
                [],
                []
            ];
            data[socket.game_name].songs = [];
            data[socket.game_name].songs_playing = 0;
        }
        let i;
        for(i = 0; i < data[socket.game_name].data.players.length; i++) {
            if(data[socket.game_name].data.players[i].name == socket.your_name) {
                break;
            }
        }
        if(i == data[socket.game_name].data.players.length) {
            if(data[socket.game_name].data.players.length < 4 && !data[socket.game_name].data.game_started) {
                data[socket.game_name].data.players[data[socket.game_name].data.players.length] = {
                    name: socket.your_name,
                    color: ""
                };
            } else {
                socket.emit("game full");
                socket.leave(socket.game_name);
                res(false);
                return;
            }
        }

        for(i = 0; i < data[socket.game_name].data.players.length; i++) {
            if(data[socket.game_name].data.players[i].name == socket.your_name && data[socket.game_name].data.players[i].color === "") {
                socket.emit("get color", data[socket.game_name].data.players);
            }
        }
        data[socket.game_name].population++;
        res(true);
        socket.emit("new data", data[socket.game_name].data);
        socket.broadcast.to(socket.game_name).emit("part data", {
            part: 'players',
            val: data[socket.game_name].data.players
        });
    });
    socket.on("choose color", (color) => {
        let i;
        for(i = 0; i < data[socket.game_name].data.players.length; i++) {
            if(data[socket.game_name].data.players[i].color == color.color) {
                break;
            }
        }
        if(i == data[socket.game_name].data.players.length) {
            for(i = 0; i < data[socket.game_name].data.players.length; i++) {
                if(data[socket.game_name].data.players[i].name == color.name) {
                    data[socket.game_name].data.players[i].color = color.color;
                    break;
                }
            }
        } else {
            socket.emit("get color", data[socket.game_name].data.players);
        }
        io.to(socket.game_name).emit("part data", {
            part: "players",
            val: data[socket.game_name].data.players
        });
    });
    socket.on("chat message", (msg) => {
        io.to(socket.game_name).emit("new message", msg.author + ": " + msg.body);
    });


    //Game
    socket.on("start game", () => {
        data[socket.game_name].data.game_started = true;
        for(let i = data[socket.game_name].data.players.length; i > 0; i--) {
            //Choose random player order
            let r = Math.floor(Math.random() * i);
            [data[socket.game_name].data.players[r], data[socket.game_name].data.players[i - 1]] = [data[socket.game_name].data.players[i - 1], data[socket.game_name].data.players[r]];
        }
        data[socket.game_name].data.turn = 0;
        io.to(socket.game_name).emit("new data", data[socket.game_name].data);
    });
    socket.on("turn end", (d) => {
        data[socket.game_name].data = d;
        if(data[socket.game_name].data.setup < data[socket.game_name].data.players.length * 2) {
            if(data[socket.game_name].data.setup < data[socket.game_name].data.players.length - 1) {
                data[socket.game_name].data.turn++;
            } else if(  data[socket.game_name].data.setup >= data[
                        socket.game_name].data.players.length &&
                        data[socket.game_name].data.setup != data[socket.game_name].data.players.length * 2 -1) {
                data[socket.game_name].data.turn--;
            }
            data[socket.game_name].data.setup++;
        } else {
            data[socket.game_name].data.turn = (data[socket.game_name].data.turn + 1) % data[socket.game_name].data.players.length;
        }
        data[socket.game_name].data.rolled = false;
        io.to(socket.game_name).emit("new data", data[socket.game_name].data);
    });

    socket.on("disconnect", () => {
        if(data[socket.game_name] !== undefined) {
            data[socket.game_name].population--;
            if(data[socket.game_name].songs_playing > 0) {
                data[socket.game_name].songs_playing--;
            }
            if(data[socket.game_name].population === 0) {
                game.save(socket.game_name, data[socket.game_name].data);
                delete data[socket.game_name];
            }
        }
    });

    socket.on("add song", (song) => {
        data[socket.game_name].songs.push(song);
        console.log("Song received");
        if(data[socket.game_name].songs_playing === 0) {
            io.to(socket.game_name).emit("play song", data[socket.game_name].songs[0]);
            data[socket.game_name].songs_playing = data[socket.game_name].population;
            data[socket.game_name].songs.splice(0, 1);
            console.log("Song sent");
        }
    });
    socket.on("request song", () => {
        if(data[socket.game_name].songs_playing > 0) {
            data[socket.game_name].songs_playing--;
        }
        if(data[socket.game_name].songs_playing === 0) {
            if(data[socket.game_name].songs.length !== 0) {
                console.log("Song sent");
                io.to(socket.game_name).emit("play song", data[socket.game_name].songs[0]);
                data[socket.game_name].songs_playing = data[socket.game_name].population;
                data[socket.game_name].songs.splice(0, 1);
            }
        }
    });

    socket.on("roll", () => {
        let dice = [Math.floor(Math.random() * 1000) % 6 + 1,
            Math.floor(Math.random() * 1000) % 6 + 1
        ];
        let d = data[socket.game_name].data;
        d.rolled = true;
        d.dice = dice;
        if(dice[0] + dice[1] == 7) {
            data[socket.game_name].robber_clear = 0;
            io.to(socket.game_name).emit("robber-start", dice);
        } else {
            for(let i = 0; i < d.tiles.length; i++) {
                for(let j = 0; j < d.tiles[i].length; j++) {
                    if(d.tiles[i][j][1] == dice[0] + dice[1]) {
                        let adj = adjacent(i, j, "tile", "house");
                        adj.forEach((house) => {
                            if(d.houses[house[0]][house[1]][0] > 0) {
                                d.hands[d.houses[house[0]][house[1]][1]][0][d.tiles[i][j][0]] += d.houses[house[0]][house[1]][0];
                            }
                        });
                    }
                }
            }
            io.to(socket.game_name).emit('roll-back', d);
        }
    });
    socket.on("robber-clear", (d) => {
        if(d && d.discards) {
            for(let i = 0; i < 5; i++) {
                data[socket.game_name].data.hands[d.n][0][i] -= d.discards[i];
            }
        }
        io.to(socket.game_name).emit("new data");
        data[socket.game_name].robber_clear++;
        if(data[socket.game_name].robber_clear == data[socket.game_name].data.players.length) {
            io.to(socket.game_name).emit("robber-choose");
        }
    });
    socket.on("robber-move", (d) => {
        data[socket.game_name].data.robber = d;
        socket.broadcast.to(socket.game_name).emit("new data", data[socket.game_name].data);
    });
    socket.on("robber-steal", ({
        d, n
    }) => {
        let x = Math.floor(Math.random() * 1000) % data[socket.game_name].data.hands[d].reduce((p, c) => p + c, 0);
        let r = 0;
        while(x >= data[socket.game_name].data.hands[d][r]) {
            x -= data[socket.game_name].data.hands[d][r];
            r++;
        }
        data[socket.game_name].data.hands[d][r]--;
        data[socket.game_name].data.hands[n][r]++;
        socket.broadcast.to(socket.game_name).emit("new data", data[socket.game_name].data);
    });
});
