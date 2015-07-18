"use strict";
let express = require("express");
let app = express();
let http = require("http");
let server = app.listen(8888, () => {console.log("Server started at 8888");});
let io = require("socket.io")(server);
let game = require("./script/game.es6");
let data = [];

var adjacent = (i, j, typea, typeb) => {
    let roads = [
        [-1,-1,-1,-1,-1,-1],
        [-1,-1,-1,-1],
        [-1,-1,-1,-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1],
        [-1,-1,-1,-1,-1,-1,-1,-1],
        [-1,-1,-1,-1],
        [-1,-1,-1,-1,-1,-1]
    ];
    let adj = {
        tile: {
            road: ((i, j) => {
                let x = [
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
            house: ((i, j) => {
                let x = [
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
            road: ((i, j) => {
                let x, y, set;
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
            house: ((i, j) => {
                if(i % 2) {
                    let x = [
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
            road: ((i, j) => {
                let x = [
                    [
                        [i * 2, j - 1], [i * 2, j],
                        [i * 2 + (j & 0) - (j & 1), Math.floor(j / 2)]
                    ],
                    [
                        [i * 2, j - 1], [i * 2, j],
                        [i * 2 + (j & 0) - (j & 1), Math.floor(j / 2)]
                    ]
                ];
                let set = x[i > 2];
                for(let y = set.length - 1; y >= 0; y--) {
                    if(set[y][0] > roads.length  || set[y][0] < 0 || set[y][1] < 0 || set[y][1] > roads[set[y][0]].length) {
                        set.splice(y, 1);
                    }
                }
                return set;
            })(),
            tile: ((i, j) => {
                let x = [
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
};

app.use("", express.static("public_html"));

io.on("connection", (socket) => {
    socket.on("join game", (name) => {
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
        let i;
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
    socket.on("choose color", (color) => {
        for(let i = 0; i < data[socket.game_name].data.players.length; i++) {
            if(data[socket.game_name].data.players[i].name == color.name) {
                data[socket.game_name].data.players[i].color = color.color;
                break;
            }
        }
        io.to(socket.game_name).emit("part data", {part: "players", val: data[socket.game_name].data.players});
    });
    socket.on("chat message", (msg) => {
        io.to(socket.game_name).emit("new message", msg.author + ": " + msg.body);
    });
    socket.on("start game", () => {
        data[socket.game_name].data.game_started = true;
        for(let i = data[socket.game_name].data.players.length; i > 0; i--) {
            let r = Math.floor(Math.random() * i);
            let t = data[socket.game_name].data.players[r];
            data[socket.game_name].data.players[r] = data[socket.game_name].data.players[i-1];
            data[socket.game_name].data.players[i-1] = t;
        }
        data[socket.game_name].data.turn = 0;
        io.to(socket.game_name).emit("new data", data[socket.game_name].data);
    });
    socket.on("roll", () => {
        let x = Math.floor(Math.random() * 6) + 1,
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
    socket.on("knight", () => {
        io.to(socket.game_name).emit("turn part", {type: "robber move"});
    });
    socket.on("disconnect", () => {
        if(data[socket.game_name] !== undefined) {
            data[socket.game_name].population--;
            if(data[socket.game_name].population === 0) {
                game.save(socket.game_name, data[socket.game_name].data);
                delete data[socket.game_name];
            }
        }
    });
});
