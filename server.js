var express = require("express"),
    app = express(),
    http = require("http"),
    server = app.listen(8888, function() {console.log("Server started at 8888");}),
    io = require("socket.io")(server),
    game = require("./script/game.js"),
    data = [];

function adjacent(i, j, typea, typeb) {
    var adj = {
        tile: {
            road: (function(i, j) {
                var x = [
                    [
                        [i * 2, j * 2], [i * 2, j * 2 + 1],
                        [i * 2 + 1, j * 2], [i * 2 + 1, j * 2 + 1],
                        [i * 2 + 2, j * 2 + 1], [i * 2 + 2, j * 2 + 2]
                    ],
                    [
                        [i * 2, j * 2 + 1], [i * 2, j * 2 + 2],
                        [i * 2 + 1, j * 2], [i * 2 + 1, j * 2 + 1],
                        [i * 2 + 2, j * 2 + 1], [i * 2 + 2, j * 2 + 2]
                    ],
                    [
                        [i * 2, j * 2 + 1], [i * 2, j * 2 + 2],
                        [i * 2 + 1, j * 2], [i * 2 + 1, j * 2 + 1],
                        [i * 2 + 2, j * 2], [i * 2 + 2, j * 2 + 1]
                    ]
                ];
                return x[Math.floor(i / 2)];
            })(),
            house: (function(i, j) {
                var x = [
                    [
                        [i * 2, j * 2], [i * 2, j * 2 + 1], [i * 2, j * 2 + 2],
                        [i * 2 + 1, j * 2 + 1], [i * 2 + 1, j * 2 + 2], [i * 2 + 1, j * 2 + 3]
                    ],
                    [
                        [i * 2, j * 2 + 1], [i * 2, j * 2 + 2], [i * 2, j * 2 + 3],
                        [i * 2 + 1, j * 2 + 1], [i * 2 + 1, j * 2 + 2], [i * 2 + 1, j * 2 + 3]
                    ],
                    [
                        [i * 2, j * 2 + 1], [i * 2, j * 2 + 2], [i * 2, j * 2 + 3],
                        [i * 2 + 1, j * 2], [i * 2 + 1, j * 2 + 1], [i * 2 + 1, j * 2 + 2]
                    ]
                ];
                return x[Math.floor(i / 2)];
            })()
        },
        road: {
            road: (function(i, j) {
                var x, y, set;
                if(i % 2) {
                    x = [
                        [
                            [i - 1, j * 2 - 1], [i - 1, j * 2],
                            [i + 1, j * 2], [i + 1, j * 2 + 1]
                        ],
                        [
                            [i - 1, j * 2 - 1], [i - 1, j * 2],
                            [i + 1, j * 2], [i + 1, j * 2 + 1]
                        ],
                        [
                            [i - 1, j * 2], [i - 1, j * 2 + 1],
                            [i + 1, j * 2 - 1], [i + 1, j * 2]
                        ]
                    ];
                    set = x[1 - (i < 5) + (i > 5)];
                    for(y = set.length - 1; y >= 0; y--) {
                        if(set[y][0] > roads.length  || set[y][0] < 0 || set[y][1] < 0 || set[y][1] > roads[set[y][0]].length) {
                            set.splice(y, 1);
                        }
                    }
                    return set;
                } else {
                    x = [
                        [
                            [i, j - 1], [i, j + 1],
                            [i - 1, Math.floor(j / 2)], [i + 1, Math.ceil(j / 2)]
                        ],
                        [
                            [i, j - 1], [i, j + 1],
                            [i + 1, Math.ceil(j / 2)], [i + 1, Math.floor(j / 2)]
                        ]
                    ];
                    set = x[Math.floor(i / 6)];
                    for(y = set.length - 1; y >= 0; y--) {
                        if(set[y][0] > roads.length  || set[y][0] < 0 || set[y][1] < 0 || set[y][1] > roads[set[y][0]].length) {
                            set.splice(y, 1);
                        }
                    }
                    return set;
                }
            })(),
            house: (function(i, j) {
                if(i % 2) {
                    var x = [
                        [
                            [i - 1, j * 2], [i + 1, j * 2 + 1]
                        ],
                        [
                            [i - 1, j * 2], [i + 1, j * 2]
                        ],
                        [
                            [i - 1, j * 2 + 1], [i + 1, j * 2]
                        ]
                    ];
                    return x[1 - (i < 5) + (i > 5)];
                } else {
                    return [[i, j], [i, j + 1]];
                }
            })()
        },
        house: {
            road: (function(i, j) {
                var x = [
                    [
                        [i * 2, j - 1], [i * 2, j],
                        [i * 2 + (j & 0) - (j & 1), Math.floor(j / 2)]
                    ],
                    [
                        [i * 2, j - 1], [i * 2, j],
                        [i * 2 + (j & 0) - (j & 1), Math.floor(j / 2)]
                    ]
                ];
                var set = x[i > 2];
                for(y = set.length - 1; y >= 0; y--) {
                    if(set[y][0] > roads.length  || set[y][0] < 0 || set[y][1] < 0 || set[y][1] > roads[set[y][0]].length) {
                        set.splice(y, 1);
                    }
                }
                return set;
            })(),
            tile: (function(i, j) {
                var x = [
                    [
                        [i - 1, j / 2 - 1],
                        [i, j / 2 - 1],
                        [i, j / 2]
                    ],
                    [
                        [i - 1, (j - 1) / 2 - 1],
                        [i - 1, (j - 1) / 2],
                        [i, (j - 1) / 2]
                    ],

                ];
                return x[i % 2];
            })()
        }
    };
    return adj[typea][typeb](i, j);
}

app.use("", express.static("public_html"));

io.on("connection", function(socket) {
    socket.on("join game", function(name) {
        socket.your_name = name.name;
        socket.game_name = name.game;
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
            data[socket.game_name].trade = [[],[]];
        }
        var i;
        for(i = 0; i < data[socket.game_name].data.players.length; i++) {
            if(data[socket.game_name].data.players[i].name == socket.your_name) {
                break;
            }
        }
        if(i == data[socket.game_name].data.players.length) {
            if(data[socket.game_name].data.players.length < 4) {
                data[socket.game_name].data.players[data[socket.game_name].data.players.length] = {name: socket.your_name, color: ""};
            } else {
                socket.emit("game full");
                socket.leave(socket.game_name);
                return;
            }
        }

        for(i = 0; i < data[socket.game_name].data.players.length; i++) {
            if(data[socket.game_name].data.players[i].name == socket.your_name && data[socket.game_name].data.players[i].color === "") {
                socket.emit("get color", data[socket.game_name].data.players);
            }
        }
        data[socket.game_name].population++;
        io.to(socket.game_name).emit("new data", data[socket.game_name].data);
    });
    socket.on("choose color", function(color) {
        for(var i = 0; i < data[socket.game_name].data.players.length; i++) {
            if(data[socket.game_name].data.players[i].name == color.name) {
                data[socket.game_name].data.players[i].color = color.color;
                break;
            }
        }
        io.to(socket.game_name).emit("part data", {part: "players", val: data[socket.game_name].data.players});
    });
    socket.on("chat message", function(msg) {
        io.to(socket.game_name).emit("new message", msg.author + ": " + msg.body);
    });
    socket.on("start game", function() {
        data[socket.game_name].data.game_started = true;
        for(var i = data[socket.game_name].data.players.length; i > 0; i--) {
            var r = Math.floor(Math.random() * i);
            var t = data[socket.game_name].data.players[r];
            data[socket.game_name].data.players[r] = data[socket.game_name].data.players[i-1];
            data[socket.game_name].data.players[i-1] = t;
        }
        data[socket.game_name].data.turn = 0;
        io.to(socket.game_name).emit("new data", data[socket.game_name].data);
    });
    socket.on("roll", function() {
        var x = Math.floor(Math.random() * 6) + 1,
            y = Math.floor(Math.random() * 6) + 1,
            cards;
        data[socket.game_name].data.dice = [x,y];
        if(x + y == 7) {
            io.to(socket.game_name).emit("turn part", {type: "robber move"});
        } else {
            //Calculate cards
            io.to(socket.game_name).emit("turn part", {type: "roll", val: {dice: [x,y], hands: cards}});
        }
    });
    socket.on("knight", function() {
        io.to(socket.game_name).emit("turn part", {type: "robber move"});
    });
    socket.on("disconnect", function() {
        if(data[socket.game_name] !== undefined) {
            data[socket.game_name].population--;
            if(data[socket.game_name].population === 0) {
                game.save(socket.game_name, data[socket.game_name].data);
                delete data[socket.game_name];
            }
        }
    });
});
