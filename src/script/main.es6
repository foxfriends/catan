'use strict';
require("babel/polyfill");
let io = require('socket.io-client');

const PASTURE = 0,
  FIELD = 1,
  FOREST = 2,
  QUARRY = 3,
  MOUNTAIN = 4,
  DESERT = 5,
  WATER = 6;
const WOOL = 0,
  WHEAT = 1,
  WOOD = 2,
  BRICK = 3,
  ORE = 4,
  OTHER = 5;
const RED = 0,
  ORANGE = 1,
  BLUE = 2,
  WHITE = 3;
const SETTLEMENT = 1,
  CITY = 2;
const KNIGHT = 0,
  VP = 1,
  MONOPOLY = 2,
  ROAD_BUILDING = 3,
  YEAR_OF_PLENTY = 4;
const RESOURCE = 0,
  DEVELOPMENT = 1;

let socket = io();
let data, game_name, your_name, my_number, overlay, turn;

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

let chatboxInput, chatboxTimeout;
let run_chatbox = (e) => {
  if (e.keyCode === 13) {
    window.clearTimeout(chatboxTimeout);
    chatboxTimeout = undefined;
    let chatbox = document.getElementById("chatbox_container");
    if (chatboxInput === undefined) {
      chatboxInput = document.createElement("input");
      chatboxInput.type = "text";
      chatbox.style.height = "500px";
      chatbox.style.overflow = "auto";
      chatbox.style.backgroundColor = "RGBA(0,0,0,0.6)";
      document.getElementById("chatbox").appendChild(chatboxInput);
      chatboxInput.focus();
    } else {
      if (chatboxInput.value !== "") {
        socket.emit("chat message", {
          author: your_name,
          body: chatboxInput.value
        });
      }
      chatboxInput.parentElement.removeChild(chatboxInput);
      chatboxInput = undefined;
      window.clearTimeout(chatboxTimeout);
      chatboxTimeout = window.setTimeout(() => {
        chatbox.style.height = "32px";
        chatbox.style.overflow = "hidden";
        chatbox.style.backgroundColor = "RGBA(0,0,0,0.3)";
      }, 5000);
    }
  }
};
let add_message = (msg) => {
  var p = document.createElement("p");
  p.innerHTML = msg;
  p.className = "chat_message";
  document.getElementById("chatbox").appendChild(p);
  var chatbox = document.getElementById("chatbox_container");
  chatbox.style.height = "200px";
  chatbox.style.overflow = "hidden";
  chatbox.style.backgroundColor = "RGBA(0,0,0,0.6)";
  if (chatboxInput === undefined) {
    window.clearTimeout(chatboxTimeout);
    chatboxTimeout = window.setTimeout(() => {
      chatbox.style.height = "32px";
      chatbox.style.overflow = "hidden";
      chatbox.style.backgroundColor = "RGBA(0,0,0,0.3)";
    }, 5000);
  }
};

let start_game = () => {
  socket.emit("start game");
  document.getElementById("start_game").style.display = "none";
};
let start_game_button = (show) => {
  // Creator gets to start when ready
  if (data.players[0].name == your_name) {
    document.getElementById("start_game").style.display = (show ? "block" : "none");
  }
};
let start_menu = (show) => {
  document.getElementById("start_form").style.display = (show ? "block" : "none");
  window.onkeydown = show ? undefined : run_chatbox;
};
let init = () => {
  overlay = document.getElementById("request_form");
  game_name = document.getElementById("game_name").value;
  your_name = document.getElementById("your_name").value;
  if (game_name !== "" && your_name !== "") {
    socket.emit("join game", {
      game: game_name,
      name: your_name
    });
    start_menu(false);
  }
};
let game_full = () => {
  start_menu(true);
  document.getElementById("start_form_error").innerHTML = game_name + " is full";
};
let get_color = (players) => {
  let colors = ['red', 'orange', 'blue', 'white'], i;
  for (i = 0; i < players.length; i++) {
    if (colors.indexOf(players[i].color) != -1) {
      colors.splice(colors.indexOf(players[i].color), 1);
    }
  }
  if (colors.length) {
    overlay.style.display = "block";
    let options = document.createElement("div");
    options.style.margin = "0 auto";
    options.style.textAlign = "center";
    overlay.appendChild(options);
    let clickHandler = (c) => {
      return () => {
        socket.emit("choose color", {
          name: your_name,
          color: c
        });
        overlay.style.display = "none";
        overlay.innerHTML = "";
      };
    };
    for (i = 0; i < colors.length; i++) {
      let div = document.createElement("div");
      div.className = "color_selector";
      div.style.backgroundColor = colors[i];
      div.onclick = clickHandler(div.style.backgroundColor);
      options.appendChild(div);
    }
  }
};
let ask_knight = () => {
  //Make this better
  if(data.hands[my_number][1][KNIGHT]) {
    turn.next(window.confirm("Use a knight?"));
  } else {
    turn.next();
  }
};
let knight = () => {
  data.hands[my_number][1][KNIGHT]--;
  socket.emit('knight');
};
let roll = () => {
  socket.emit('roll');
};
let show_end_turn = () => {
  document.getElementById("end-turn").style.display = "block";
};
let end_turn = () => {
  turn.next({done: true});
};
let buy_dev_card = () => {
  if (data.hands[my_number][0][WOOL] && data.hands[my_number][0][ORE] && data.hands[my_number][0][WHEAT]) {
    data.hands[my_number][0][WOOL]--;
    data.hands[my_number][0][ORE]--;
    data.hands[my_number][0][WHEAT]--;
    data.hands[my_number][1][data.dev_cards.pop()]++;
  }
};
let build_house = (i, j, free) => {
  data.houses[i][j] = [1, my_number];
  if (!free) {
    data.hands[my_number][0][WOOD]--;
    data.hands[my_number][0][BRICK]--;
    data.hands[my_number][0][WOOL]--;
    data.hands[my_number][0][WHEAT]--;
  }
  turn.next([i, j]);
  return [i, j];
};
let build_city = (i, j, free) => {
  data.houses[i][j][0] = [2];
  if (!free) {
    data.hands[my_number][0][WHEAT] -= 3;
    data.hands[my_number][0][ORE] -= 2;
  }
  turn.next([i, j]);
  return [i, j];
};
let build_road = (i, j, free) => {
  data.roads[i][j] = my_number;
  if (!free) {
    data.hands[my_number][0][WOOD]--;
    data.hands[my_number][0][BRICK]--;
  }
  turn.next([i, j]);
  return [i, j];
};
let show_house_build = (force) => {
  let _build_house = (i, j, force) => {
    return () => {
      build_house(i, j, force);
    };
  };
  if (force || (data.hands[my_number][0][WOOD] && data.hands[my_number][0][WOOL] &&
    data.hands[my_number][0][WHEAT] && data.hands[my_number][0][BRICK])) {
    let i, j;
    for (i = 0; i < data.houses.length; i++) {
      for (j = 0; j < data.houses[i].length; j++) {
        let house = document.getElementsByClassName("house_row")[i].getElementsByClassName("house")[j];
        if (data.houses[i][j][0] === 0) {
          let adj_road = adjacent(i, j, "house", "road");
          let adj_house = adjacent(i, j, "house", "house");
          let n;
          for (n = 0; n < adj_road.length; n++) {
            if (data.roads[adj_road[n][0]][adj_road[n][1]] == my_number) {
              break;
            }
          }
          if (force || n != adj_road.length) {
            for (n = 0; n < adj_house.length; n++) {
              if (data.houses[adj_house[n][0]][adj_house[n][1]][0]) {
                break;
              }
            }
            if (n == adj_house.length) {
              house.style.backgroundColor = "black";
              house.style.opacity = 0.5;
              house.style.cursor = "pointer";
              house.onclick = _build_house(i, j, force);
            }
          }
        }
      }
    }
  }
};
let show_city_build = (force) => {
  let _build_city = (i, j, force) => {
    return () => {
      build_city(i, j, force);
    };
  };
  if (force || (data.hands[my_number][0][ORE] >= 2 && data.hands[my_number][0][WHEAT] >= 3)) {
    let i, j;
    for (i = 0; i < data.houses.length; i++) {
      for (j = 0; j < data.houses[i].length; j++) {
        let house = document.getElementsByClassName("house_row")[i].getElementsByClassName("house")[j];
        if (data.houses[i][j][0] === 1 && data.houses[i][j][1] === my_number) {
          house.style.backgroundColor = data.players[my_number].color;
          house.style.opacity = 0.5;
          house.style.cursor = "pointer";
          house.onclick = _build_city(i, j, force);
        }
      }
    }
  }
};
let show_road_build = (force, house) => {
  let _build_road = (i, j, force) => {
    return () => {
      build_road(i, j, force);
    };
  };
  if (force || (data.hands[my_number][0][WOOD] && data.hands[my_number][0][BRICK])) {
    let i, j;
    if (house) {
      let roads = adjacent(house[0], house[1], "house", "road");
      for([i, j] of roads) {
        let road = document.getElementsByClassName("road_row")[i].getElementsByClassName("road")[j];
        if (data.roads[i][j] === -1) {
          road.style.backgroundColor = "black";
          road.style.opacity = 0.5;
          road.style.cursor = "pointer";
          road.onclick = _build_road(i, j, force);
        }
      }
    } else {
      for (i = 0; i < data.roads.length; i++) {
        for (j = 0; j < data.roads[i].length; j++) {
          if (data.roads[i][j] === -1) {
            let road = document.getElementsByClassName("road_row")[i].getElementsByClassName("road")[j];
            let roads = adjacent(i, j, "road", "road");
            let n;
            for (n = 0; n < roads.length; n++) {
              if (data.roads[roads[n][0]][roads[n][1]] != -1) {
                break;
              }
            }
            if (n != roads.length) {
              road.style.backgroundColor = "black";
              road.style.opacity = 0.5;
              road.onclick = _build_road(i, j, force);
            }
          }
        }
      }
    }
  }
};

let show_buy_dev_card = () => {
  if (data.hands[my_number][0][WOOL] && data.hands[my_number][0][ORE] && data.hands[my_number][0][WHEAT]) {
    document.getElementById('buy-dev-card').display = "block";
  }
};

let play_dev_card = (c) => {
  data.hands[my_number][1][c]--;
  turn.next({devcard: c});
};
let show_dev_card_list = () => {
  //Show the dev card list
};
let show_play_dev_card = () => {
  document.getElementById('play_dev_card').display = "block";
};
let show_trade = () => {
  document.getElementById('init-trade').display = "block";
};
let init_trade = () => {

};

let force_house = () => {
  show_house_build(true);
};
let force_road = (house) => {
  show_road_build(true, house);
};

let arrange = () => {
  let i, j;
  for (i = 0; i < data.tiles.length; i++) {
    for (j = 0; j < data.tiles[i].length; j++) {
      let tile = document.getElementsByClassName("tile_row")[i].getElementsByClassName("tile")[j];
      tile.style.left = 200 + (200 * j + 100 * Math.abs(i - 2)) + "px";
      tile.style.top = (174 * i) + "px";
      let type = "";
      switch (data.tiles[i][j][0]) {
        case PASTURE:
          type = "pasture";
          break;
        case FIELD:
          type = "field";
          break;
        case FOREST:
          type = "forest";
          break;
        case QUARRY:
          type = "quarry";
          break;
        case MOUNTAIN:
          type = "mountain";
          break;
        case DESERT:
          type = "desert";
          break;
        case WATER:
          type = "water";
          break;
      }
      tile.className = "tile " + type;
      if (data.tiles[i][j][1] !== 7) {
        let red = "";
        if (data.tiles[i][j][1] === 6 || data.tiles[i][j][1] === 8) {
          red = " red";
        }
        tile.innerHTML = `<span class='number ${red}'>${data.tiles[i][j][1]}</span>`;
      }
    }
  }
  for (i = 0; i < data.roads.length; i++) {
    for (j = 0; j < data.roads[i].length; j++) {
      let road = document.getElementsByClassName("road_row")[i].getElementsByClassName("road")[j];
      if (i & 1) {
        road.style.left = 150 + (200 * j + 100 * Math.abs((i - 1) / 2 - 2)) + "px";
        road.style.top = (174 * (i - 1) / 2 + 231 / 2) + "px";
      } else {
        road.style.left = 150 + (100 * j + 100 * Math.abs((i - 1) / 2 - 2)) + "px";
        road.style.top = (174 * i / 2 + 231 / 12) + "px";
      }
      if (data.roads[i][j] !== -1) {
        road.style.backgroundColor = data.players[data.roads[i][j]].color;
        road.style.opacity = 1;
      } else {
        road.style.opacity = 0;
      }
      road.style.cursor = "default";
      road.onclick = undefined;
    }
  }
  for (i = 0; i < data.houses.length; i++) {
    for (j = 0; j < data.houses[i].length; j++) {
      let house = document.getElementsByClassName("house_row")[i].getElementsByClassName("house")[j];
      house.style.left = (100 + 100 * j + 100 * Math.abs(i - 3) - 16 + 100 * (i >= 3)) + "px";
      if (i < 3) {
        house.style.top = (174 * i + (231 / 6 + 16) * ((j + 1) % 2)) - 16 + "px";
      } else {
        house.style.top = (174 * i + (231 / 6 + 16) * (j % 2)) - 16 + "px";
      }
      if (data.houses[i][j][0] !== 0) {
        house.style.backgroundColor = data.players[data.houses[i][j][1]].color;
        house.style.opacity = 1;
      } else {
        house.style.opacity = 0;
      }
      house.style.cursor = "default";
      house.onclick = undefined;
    }
  }
  let colors = {
    "red": "RGBA(255, 150, 150, 0.5)",
    "orange": "RGBA(255, 127, 0, 0.5)",
    "blue": "RGBA(0, 255, 255, 0.5)",
    "white": "RGBA(255, 255, 255, 0.5)"
  };
  let n;
  for (i = 0, n = 0; i < data.players.length; i++) {
    let player;
    if (data.players[i].name != your_name) {
      player = document.getElementsByClassName("player")[n++];
      player.getElementsByClassName("cards")[0].innerHTML = `<img src='image/wool.png' width='20'>` +
        `<img src='image/wheat.png' width='20'>` +
        `<img src='image/wood.png' width='20'>` +
        `<img src='image/brick.png' width='20'>` +
        `<img src='image/ore.png' width='20'>` +
        data.hands[i][0].reduce((x, y) => x + y, 0);
    } else {
      my_number = i;
      player = document.getElementsByClassName("player me")[0];
      player.getElementsByClassName("cards")[0].innerHTML = `<img src='image/wool.png' width='20'> ${data.hands[i][0][WOOL]}` +
        `<img src='image/wheat.png' width='20'> ${data.hands[i][0][WHEAT]}` +
        `<img src='image/wood.png' width='20'> ${data.hands[i][0][WOOD]}` +
        `<img src='image/brick.png' width='20'> ${data.hands[i][0][BRICK]}` +
        `<img src='image/ore.png' width='20'> ${data.hands[i][0][ORE]}`;
    }
    if (i === data.turn) {
      player.style.border = "2px solid white";
    } else {
      player.style.border = "none";
    }
    player.getElementsByClassName("name")[0].innerHTML = data.players[i].name;
    player.style.backgroundColor = colors[data.players[i].color];

    document.getElementById("buy-dev-card").style.display = "none";
    document.getElementById("play-dev-card").style.display = "none";
    document.getElementById("init-trade").style.display = "none";
    document.getElementById("end-turn").style.display = "none";
  // Points
  // Prizes
  }
  document.getElementById("yellowdie").src = `/image/ydie${data.dice[0]}.png`;
  document.getElementById("reddie").src = `/image/rdie${data.dice[1]}.png`;
  if (data.players.length >= 3 && !data.game_started) {
    start_game_button(true);
  }
};

let start_turn = () => {
  if (data.setup < data.players.length * 2) {
    //Setup
    turn = (function* () {
      let house = yield force_house();
      arrange();
      yield force_road(house);
      arrange();
      socket.emit("turn end", data);
    })();
    turn.next();
    //turn.next();
  } else {
    turn = (function* () {
      if(yield ask_knight()) {
        yield knight();
      }
      yield roll();
      let done = false;
      while(done !== true) {
        show_road_build();
        show_house_build();
        show_city_build();
        show_buy_dev_card();
        show_play_dev_card();
        show_trade();
        show_end_turn();
        let resp = yield;
        arrange();
        if(resp.done) {
          done = true;
        } else if(resp.devcard) {
          switch(resp.devcard) {
            case ROAD_BUILDING:
              yield force_road();
              arrange();
              yield force_road();
              arrange();
              break;
            case MONOPOLY:
              //Show card list
              //Take cards
              break;
            case YEAR_OF_PLENTY:
              //Show card list
              //Take cards
              break;
          }
        }
      }
      socket.emit("turn end", data);
    })();
    turn.next();
  }
};


let set_data = (d) => {
  data = d;
  arrange();
  if (data.turn == my_number) {
    start_turn();
  }
};
let part_data = (d) => {
  data[d.part] = d.val;
  arrange();
};

socket.on("new data", set_data);
socket.on("part data", part_data);
socket.on("get color", get_color);
socket.on("game full", game_full);
socket.on("new message", add_message);

let out = {
  init: init,
  start_game: start_game,
  buy_dev_card: buy_dev_card,
  show_dev_card_list: show_dev_card_list,
  play_dev_card: play_dev_card,
  init_trade: init_trade
};

module.exports = out;
