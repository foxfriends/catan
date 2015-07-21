"use strict";
let express = require("express");
let app = express();
let http = require("http");
let server = app.listen(8888, () => {
  console.log("Server started at 8888");
});
let io = require("socket.io")(server);
let ss = require("socket.io-stream")(io);
let game = require("./script/game.es6");
let data = [];
let stream = require("stream");

let adjacent = (i, j, typea, typeb) => {
  let roads = [
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1, -1, -1],
    [-1, -1, -1, -1],
    [-1, -1, -1, -1, -1, -1]
  ];
  let houses = [
    [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
    [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]
  ];
  let adj = {
    tile: {
      road: ((a, b) => {
        let x = [
          [
            [a * 2, b * 2], [a * 2, b * 2 + 1],
            [a * 2 + 1, b * 2], [a * 2 + 1, b * 2 + 1],
            [a * 2 + 2, b * 2 + 1], [a * 2 + 2, b * 2 + 2]
          ],
          [
            [a * 2, b * 2 + 1], [a * 2, b * 2 + 2],
            [a * 2 + 1, b * 2], [a * 2 + 1, b * 2 + 1],
            [a * 2 + 2, b * 2 + 1], [a * 2 + 2, b * 2 + 2]
          ],
          [
            [a * 2, b * 2 + 1], [a * 2, b * 2 + 2],
            [a * 2 + 1, b * 2], [a * 2 + 1, b * 2 + 1],
            [a * 2 + 2, b * 2], [a * 2 + 2, b * 2 + 1]
          ]
        ];
        return x[Math.floor(a / 2)];
      }),
      house: ((a, b) => {
        let x = [
          [
            [a * 2, b * 2], [a * 2, b * 2 + 1], [a * 2, b * 2 + 2],
            [a * 2 + 1, b * 2 + 1], [a * 2 + 1, b * 2 + 2], [a * 2 + 1, b * 2 + 3]
          ],
          [
            [a * 2, b * 2 + 1], [a * 2, b * 2 + 2], [a * 2, b * 2 + 3],
            [a * 2 + 1, b * 2 + 1], [a * 2 + 1, b * 2 + 2], [a * 2 + 1, b * 2 + 3]
          ],
          [
            [a * 2, b * 2 + 1], [a * 2, b * 2 + 2], [a * 2, b * 2 + 3],
            [a * 2 + 1, b * 2], [a * 2 + 1, b * 2 + 1], [a * 2 + 1, b * 2 + 2]
          ]
        ];
        return x[Math.floor(a / 2)];
      })
    },
    road: {
      road: ((a, b) => {
        let x, y, set;
        if (a % 2) {
          x = [
            [
              [a - 1, b * 2 - 1], [a - 1, b * 2],
              [a + 1, b * 2], [a + 1, b * 2 + 1]
            ],
            [
              [a - 1, b * 2 - 1], [a - 1, b * 2],
              [a + 1, b * 2], [a + 1, b * 2 + 1]
            ],
            [
              [a - 1, b * 2], [a - 1, b * 2 + 1],
              [a + 1, b * 2 - 1], [a + 1, b * 2]
            ]
          ];
          set = x[1 - (a < 5) + (a > 5)];
          for (y = set.length - 1; y >= 0; y--) {
            if (set[y][0] >= roads.length || set[y][0] < 0 || set[y][1] < 0 || set[y][1] >= roads[set[y][0]].length) {
              set.splice(y, 1);
            }
          }
          return set;
        } else {
          x = [
            [
              [a, b - 1], [a, b + 1],
              [a - 1, Math.floor(b / 2)], [a + 1, Math.ceil(b / 2)]
            ],
            [
              [a, b - 1], [a, b + 1],
              [a + 1, Math.ceil(b / 2)], [a + 1, Math.floor(b / 2)]
            ]
          ];
          set = x[Math.floor(a / 6)];
          for (y = set.length - 1; y >= 0; y--) {
            if (set[y][0] >= roads.length || set[y][0] < 0 || set[y][1] < 0 || set[y][1] >= roads[set[y][0]].length) {
              set.splice(y, 1);
            }
          }
          return set;
        }
      }),
      house: ((a, b) => {
        if (a % 2) {
          let x = [
            [
              [a - 1, b * 2], [a + 1, b * 2 + 1]
            ],
            [
              [a - 1, b * 2], [a + 1, b * 2]
            ],
            [
              [a - 1, b * 2 + 1], [a + 1, b * 2]
            ]
          ];
          return x[1 - (a < 5) + (a > 5)];
        } else {
          return [[a, b], [a, b + 1]];
        }
      })
    },
    house: {
      road: ((a, b) => {
        let x = [
          [
            [a * 2, b - 1], [a * 2, b],
            [a * 2 + (~b & 1) - (b & 1), Math.floor(b / 2)]
          ],
          [
            [a * 2, b - 1], [a * 2, b],
            [a * 2 - (~b & 1) + (b & 1), Math.floor(b / 2)]
          ]
        ];
        let set = x[0 + (a > 2)];
        for (let y = set.length - 1; y >= 0; y--) {
          if (set[y][0] >= roads.length || set[y][0] < 0 || set[y][1] < 0 || set[y][1] >= roads[set[y][0]].length) {
            set.splice(y, 1);
          }
        }
        return set;
      }),
      house: ((a, b) => {
        let x = [
          [
            [a, b - 1], [a, b + 1],
            [a + (~b & 1) - (b & 1), b + (~b & 1) - (b & 1)]
          ],
          [
            [a, b - 1], [a, b + 1],
            [a - (~b & 1) + (b & 1), b - (~b & 1) + (b & 1)]
          ]
        ];
        let set = x[0 + (a > 2)];
        for (let y = set.length - 1; y >= 0; y--) {
          if (set[y][0] >= houses.length || set[y][0] < 0 || set[y][1] < 0 || set[y][1] >= houses[set[y][0]].length) {
            set.splice(y, 1);
          }
        }
        return set;
      }),
      tile: ((a, b) => {
        let x = [
          [
            [a - 1, b / 2 - 1],
            [a, b / 2 - 1],
            [a, b / 2]
          ],
          [
            [a - 1, (b - 1) / 2 - 1],
            [a - 1, (b - 1) / 2],
            [a, (b - 1) / 2]
          ],

        ];
        return x[a % 2];
      })
    }
  };
  return adj[typea][typeb](i, j);
};

app.use("", express.static("public_html"));

io.on("connection", (socket) => {
  //Setup
  socket.on("join game", (name, res) => {
    socket.your_name = name.name;
    socket.game_name = name.game;
    console.log(`${socket.your_name} is attempting to join ${socket.game_name}`);
    socket.join(socket.game_name);
    if (data[socket.game_name] === undefined) {
      data[socket.game_name] = {};
      if (game.exists(socket.game_name)) {
        data[socket.game_name].data = game.load(socket.game_name);
      } else {
        data[socket.game_name].data = game.new(socket.game_name);
      }
      data[socket.game_name].population = 0;
      data[socket.game_name].robber_clear = 4;
      data[socket.game_name].trade = [[], []];
      data[socket.game_name].songs = [];
      data[socket.game_name].songs_playing = 0;
    }
    let i;
    for (i = 0; i < data[socket.game_name].data.players.length; i++) {
      if (data[socket.game_name].data.players[i].name == socket.your_name) {
        break;
      }
    }
    if (i == data[socket.game_name].data.players.length) {
      if (data[socket.game_name].data.players.length < 4 && !data[socket.game_name].data.game_started) {
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

    for (i = 0; i < data[socket.game_name].data.players.length; i++) {
      if (data[socket.game_name].data.players[i].name == socket.your_name && data[socket.game_name].data.players[i].color === "") {
        socket.emit("get color", data[socket.game_name].data.players);
      }
    }
    data[socket.game_name].population++;
    res(true);
    io.to(socket.game_name).emit("new data", data[socket.game_name].data);
  });
  socket.on("choose color", (color) => {
    let i;
    for (i = 0; i < data[socket.game_name].data.players.length; i++) {
      if (data[socket.game_name].data.players[i].color == color.color) {
        break;
      }
    }
    if (i == data[socket.game_name].data.players.length) {
      for (i = 0; i < data[socket.game_name].data.players.length; i++) {
        if (data[socket.game_name].data.players[i].name == color.name) {
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
    for (let i = data[socket.game_name].data.players.length; i > 0; i--) {
      //Choose random player order
      let r = Math.floor(Math.random() * i);
      [data[socket.game_name].data.players[r], data[socket.game_name].data.players[i - 1]] = [data[socket.game_name].data.players[i - 1], data[socket.game_name].data.players[r]];
    }
    data[socket.game_name].data.turn = 0;
    io.to(socket.game_name).emit("new data", data[socket.game_name].data);
  });
  socket.on("turn end", (d) => {
    data[socket.game_name].data = d;
    if (data[socket.game_name].data.setup < data[socket.game_name].data.players.length * 2) {
      if (data[socket.game_name].data.setup < data[socket.game_name].data.players.length - 1) {
        data[socket.game_name].data.turn++;
      } else if (data[socket.game_name].data.setup >= data[socket.game_name].data.players.length && data[socket.game_name].data.setup != data[socket.game_name].data.players.length * 2 - 1) {
        data[socket.game_name].data.turn--;
      }
      data[socket.game_name].data.setup++;
    } else {
      data[socket.game_name].data.turn = (data[socket.game_name].data.turn + 1) % data[socket.game_name].data.players.length;
    }
    io.to(socket.game_name).emit("new data", data[socket.game_name].data);
  });

  socket.on("disconnect", () => {
    if (data[socket.game_name] !== undefined) {
      data[socket.game_name].population--;
      if(data[socket.game_name].songs_playing > 0) {
        data[socket.game_name].songs_playing--;
      }
      if (data[socket.game_name].population === 0) {
        game.save(socket.game_name, data[socket.game_name].data);
        delete data[socket.game_name];
      }
    }
  });

  socket.on("add song", (song) => {
    data[socket.game_name].songs.push(song);
    console.log("Song received");
    console.log(data[socket.game_name].songs_playing);
    if (data[socket.game_name].songs_playing === 0) {
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
    if (data[socket.game_name].songs_playing === 0) {
      if (data[socket.game_name].songs.length !== 0) {
        io.to(socket.game_name).emit("play song", data[socket.game_name].songs[0]);
        data[socket.game_name].songs_playing = data[socket.game_name].population;
        data[socket.game_name].songs.splice(0, 1);
      }
    }
  });
});
