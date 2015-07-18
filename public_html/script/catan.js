var socket = io();
var PASTURE = 0, FIELD = 1, FOREST = 2, QUARRY = 3, MOUNTAIN = 4, DESERT = 5, WATER = 6;
var WOOL = 0, WHEAT = 1, WOOD = 2, BRICK = 3, ORE = 4, OTHER = 5;
var RED = 0, ORANGE = 1, BLUE = 2, WHITE = 3;
var SETTLEMENT = 1, CITY = 2;
var KNIGHT = 0, VP = 1, MONOPOLY = 2, ROAD_BUILDING = 3, YEAR_OF_PLENTY = 4;
var RESOURCE = 0, DEVELOPMENT = 1;
var data, game_name, your_name, my_number;

function arrange() {
    var i, j;
    for(i = 0; i < data.tiles.length; i++) {
        for(j = 0; j < data.tiles[i].length; j++) {
            var tile = document.getElementsByClassName("tile_row")[i].getElementsByClassName("tile")[j];
            tile.style.left = 200 + (200 * j + 100 * Math.abs(i - 2)) + "px";
            tile.style.top = (174 * i) + "px";
            var type = "";
            switch(data.tiles[i][j][0]) {
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
            if(data.tiles[i][j][1] !== 7) {
                var red = "";
                if(data.tiles[i][j][1] === 6 || data.tiles[i][j][1] === 8) {
                    red = " red";
                }
                tile.innerHTML = "<span class='number" + red + "'>" + data.tiles[i][j][1] + "</span>";
            }
        }
    }
    for(i = 0; i < data.roads.length; i++) {
        for(j = 0; j < data.roads[i].length; j++) {
            var road = document.getElementsByClassName("road_row")[i].getElementsByClassName("road")[j];
            if( i & 1 ) {
                road.style.left = 150 + (200 * j + 100 * Math.abs((i-1)/2 - 2)) + "px";
                road.style.top = (174 * (i - 1) / 2 + 231 / 2) + "px";
            } else {
                road.style.left = 150 + (100 * j + 100 * Math.abs((i-1)/2 - 2)) + "px";
                road.style.top = (174 * i / 2 + 231/12) + "px";
            }
        }
    }
    for(i = 0; i < data.houses.length; i++) {
        for(j = 0; j < data.houses[i].length; j++) {
            var house = document.getElementsByClassName("house_row")[i].getElementsByClassName("house")[j];
            house.style.left = (100 + 100 * j + 100 * Math.abs(i - 3) - 16 + 100 * (i >= 3)) + "px";
            if(i < 3) {
                house.style.top = (174 * i + (231 / 6 + 16) * ((j + 1) % 2)) - 16 + "px";
            } else {
                house.style.top = (174 * i + (231 / 6 + 16) * (j % 2)) - 16 + "px";
            }
        }
    }
    var colors = {
        "red": "RGBA(255, 150, 150, 0.5)",
        "orange": "RGBA(255, 127, 0, 0.5)",
        "blue": "RGBA(0, 255, 255, 0.5)",
        "white": "RGBA(255, 255, 255, 0.5)"
    };
    for(i = 0, n = 0; i < data.players.length; i++) {
        if(data.players[i].name != your_name) {
            player = document.getElementsByClassName("player")[n++];
        } else {
            my_number = i;
            player = document.getElementsByClassName("player me")[0];
        }
        if(i === data.turn) {
            player.style.border = "2px solid white";
        } else {
            player.style.border = "none";
        }
        player.getElementsByClassName("name")[0].innerHTML = data.players[i].name;
        player.style.backgroundColor = colors[data.players[i].color];
    }
    document.getElementById("yellowdie").src = "/image/ydie" + data.dice[0] + ".png";
    document.getElementById("reddie").src = "/image/rdie" + data.dice[1] + ".png";
    if(data.players.length >= 3 && !data.game_started) {
        start_game_button(true);
    }
}

function recolor() {
    var i, j;
    for(i = 0; i < data.tiles.length; i++) {
        for(j = 0; j < data.tiles[i].length; j++) {
            if(data.tiles[i][j][1] !== 7) {
                if(data.robber == [i,j]) {
                    tile.innerHTML = "<img src='style/image/robber.png' alt='R'>";
                } else {
                    var red = "";
                    if(data.tiles[i][j][1] === 6 || data.tiles[i][j][1] === 8) {
                        red = " red";
                        tile.innerHTML = "<span class='number" + red + "'>" + data.tiles[i][j][1] + "</span>";
                    }
                }
            }
        }
    }
    for(i = 0; i < data.roads.length; i++) {
        for(j = 0; j < data.roads[i].length; j++) {
            var road = document.getElementsByClassName("road_row")[i].getElementsByClassName("road")[j];
            if( i & 1 ) {
                road.style.left = 150 + (200 * j + 100 * Math.abs((i-1)/2 - 2)) + "px";
                road.style.top = (174 * (i - 1) / 2 + 231 / 2) + "px";
            } else {
                road.style.left = 150 + (100 * j + 100 * Math.abs((i-1)/2 - 2)) + "px";
                road.style.top = (174 * i / 2 + 231/12) + "px";
            }
        }
    }
    for(i = 0; i < data.houses.length; i++) {
        for(j = 0; j < data.houses[i].length; j++) {
            var house = document.getElementsByClassName("house_row")[i].getElementsByClassName("house")[j];
            house.style.backgroundColor = colors[data.houses[i][j][1]];
            if(data.houses[i][j][0] !== 0) {
                house.style.opacity = "1";
                house.className = "house " + shape[data.houses[i][j][0]];
            }
        }
    }
}

function start_game() {
    socket.emit("start game");
    document.getElementById("start_game").style.display = "none";
}

function start_game_button(show) {
    // Creator gets to start when ready
    if(data.players[0].name == your_name) {
        document.getElementById("start_game").style.display = (show ? "block" : "none");
    }
}

function start_menu(show) {
    document.getElementById("start_form").style.display = (show ? "block" : "none");
    window.onkeydown = show ? undefined : run_chatbox;
}

function init() {
    overlay = document.getElementById("request_form");
    game_name = document.getElementById("game_name").value;
    your_name = document.getElementById("your_name").value;
    if(game_name !== "" && your_name !== "") {
        socket.emit("join game", {game: game_name, name: your_name});
        start_menu(false);
    }
}

function start_turn() {
    var i;
    if(data.hands[data.turn][DEVELOPMENT][KNIGHT] > 0) {
        overlay.style.display = "block";
        var options = document.createElement("div");
        options.style.margin = "0 auto";
        options.style.textAlign = "center";
        overlay.appendChild(options);
        var clickHandler = function (c) {
            return function(opt) {
                socket.emit(opt);
                overlay.style.display = "none";
                overlay.innerHTML = "";
            };
        };
        var option = ["knight", "roll"];
        for(i = 0; i < option.length; i++) {
            var div = document.createElement("div");
            div.class = option[i];
            div.onclick = clickHandler(option[i]);
            options.appendChild(div);
        }
    } else {
        socket.emit("roll");
    }
}

var chatboxInput, chatboxTimeout;
function run_chatbox(e) {
    if(e.keyCode === 13) {
        window.clearTimeout(chatboxTimeout);
        chatboxTimeout = undefined;
        var chatbox = document.getElementById("chatbox_container");
        if(chatboxInput === undefined) {
            chatboxInput = document.createElement("input");
            chatboxInput.type = "text";
            chatbox.style.height = "500px";
            chatbox.style.overflow = "auto";
            chatbox.style.backgroundColor = "RGBA(0,0,0,0.6)";
            document.getElementById("chatbox").appendChild(chatboxInput);
            chatboxInput.focus();
        } else {
            if(chatboxInput.value !== "") {
                socket.emit("chat message", {author: your_name, body: chatboxInput.value});
            }
            chatboxInput.parentElement.removeChild(chatboxInput);
            chatboxInput = undefined;
            window.clearTimeout(chatboxTimeout);
            chatboxTimeout = window.setTimeout(function() {
                chatbox.style.height = "32px";
                chatbox.style.overflow = "hidden";
                chatbox.style.backgroundColor = "RGBA(0,0,0,0.3)";
            }, 5000);
        }
    }
}

function set_data(d) {
    data = d;
    arrange();
    if(data.turn == my_number) {
        start_turn();
    }
}

function part_data(d) {
    data[d.part] = d.val;
    arrange();
}

function get_color(players) {
    var colors = ['red', 'orange', 'blue', 'white'], i;
    for(i = 0; i < players.length; i++) {
        if(colors.indexOf(players[i].color) != -1) {
            colors.splice(colors.indexOf(players[i].color), 1);
        }
    }
    if(colors.length) {
        overlay.style.display = "block";
        var options = document.createElement("div");
        options.style.margin = "0 auto";
        options.style.textAlign = "center";
        overlay.appendChild(options);
        var clickHandler = function (c) {
            return function() {
                socket.emit("choose color", {name: your_name, color: c});
                overlay.style.display = "none";
                overlay.innerHTML = "";
            };
        };
        for(i = 0; i < colors.length; i++) {
            var div = document.createElement("div");
            div.className = "color_selector";
            div.style.backgroundColor = colors[i];
            div.onclick = clickHandler(div.style.backgroundColor);
            options.appendChild(div);
        }
    }
}

function game_full() {
    start_menu(true);
    document.getElementById("start_form_error").innerHTML = game_name + " is full";
}

function add_message(msg) {
    var p = document.createElement("p");
    p.innerHTML = msg;
    p.className = "chat_message";
    document.getElementById("chatbox").appendChild(p);
    var chatbox = document.getElementById("chatbox_container");
    chatbox.style.height = "200px";
    chatbox.style.overflow = "hidden";
    chatbox.style.backgroundColor = "RGBA(0,0,0,0.6)";
    if(chatboxInput === undefined) {
        window.clearTimeout(chatboxTimeout);
        chatboxTimeout = window.setTimeout(function() {
            chatbox.style.height = "32px";
            chatbox.style.overflow = "hidden";
            chatbox.style.backgroundColor = "RGBA(0,0,0,0.3)";
        }, 5000);
    }
}

function card_menu(type, validate) {
    var i, cards = [0,0,0,0,0];
    overlay.style.display = "block";
    var options = document.createElement("div");
    options.style.margin = "10 auto";
    options.style.textAlign = "center";
    overlay.appendChild(options);
    var res = ["wool", "wheat", "wood", "brick", "ore"];
    var clickHandler = function (i, a) {
        return function() {
            cards[i] += a;
            document.getElementById("card" + i).innerHTML = cards[i];
        };
    };
    for(i = 0; i < 5; i++) {
        var divcard = document.createElement("div");
        divcard.className = "card_selector card " + res[i];
        divcard.innerHTML = 0;
        divcard.id = "card" + i;
        var divup = document.createElement("div");
        divup.className = "card_selector up";
        divup.onclick = clickHandler(i, 1);
        var divdown = document.createElement("div");
        divdown.className = "card_selector down";
        divdown.onclick = clickHandler(i, -1);
        options.appendChild(divcard);
        options.appendChild(divup);
        options.appendChild(divdown);
    }
    var button = document.createElement("button");
    button.innerHTML = "Done";
    button.onclick = function() {
        if(validate(cards)) {
            socket.emit(type, {user: my_number, cards: cards});
        }
    };
    overlay.appendChild(button);
}

function turn_part(part) {
    var i,j;
    switch(part.type) {
        case "robber discard":
            var cards = data.hands[my_number].reduce(function(p,c,i,a) {return p + c;}, 0);
            if(cards >= 8) {
                card_menu("discard", function(selected) {
                    return (selected.reduce(function(p,c,i,a) {return p + c;}, 0) == Math.floor(cards / 2));
                });
            } else {
                socket.emit("discard", 0);
            }
            break;
        case "robber steal":

            break;
        case "roll":
            document.getElementById("yellowdie").src = "/image/ydie" + part.val.dice[0] + ".png";
            document.getElementById("reddie").src = "/image/rdie" + part.val.dice[1] + ".png";
            data.dice = part.val.dice;
            for(i = 0; i < players.length; i++) {
                for(j = 0; j < 5; j++) {
                    data.hands[i][j] += part.val.hands[i][j];
                }
            }
            break;
    }
}

socket.on("new data", set_data);
socket.on("part data", part_data);
socket.on("get color", get_color);
socket.on("game full", game_full);
socket.on("new message", add_message);
socket.on("turn part", turn_part);
