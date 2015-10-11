'use strict';
let express = require('express');
let app = express();
let server = app.listen(8888, () => {
    console.log('Server started at 8888');
});
app.use('', express.static('public_html'));

let io = require('socket.io')(server);

let game = require('./game');
let data = {};

let {CONST} = require('./public_html/script/src/const');
let {adjacent} = require('./public_html/script/src/adjacent');
let {countVPs} = require('./public_html/script/src/arrange');

io.on('connection', (socket) => {
    let playerName, gameName;
    socket.on('error', (err) => {
        console.error(err);
    });
    //Main game events
    socket.on('game:join', ([g, p], res) => {
        gameName = g;
        playerName = p;
        console.log(`${playerName} is attempting to join ${gameName}`);
        socket.join(gameName);
        if(data[gameName] === undefined) {
            data[gameName] = {};
            if(game.exists(gameName)) {
                data[gameName] = game.load(gameName);
                for(let player in data[gameName].players) {
                    data[gameName].players[player].connected = false;
                }
            } else {
                data[gameName] = game.new(gameName);
            }
        }
        if(data[gameName].players[playerName] === undefined) {
            if(Object.keys(data[gameName].players).length < 4 && data[gameName].gameState === CONST.OPEN) {
                data[gameName].players[playerName] = {
                    turn: Object.keys(data[gameName].players).length,
                    color: '',
                    hand: [
                        [0,0,0,0,0],
                        [[0,0,0,0,0],[0,0,0,0,0]]
                    ],
                    connected: true,
                    response: {
                        robber: null,
                        trade: null
                    },
                    longestRoadCount: 0,
                    knights: 0,
                    largestArmy: false,
                    longestRoad: false
                };
            } else {
                socket.leave(gameName);
                res(1, `${gameName} is full. Please choose a different game`);
                return;
            }
        } else {
            if(!data[gameName].players[playerName].connected) {
                data[gameName].players[playerName].connected = true;
            } else {
                socket.leave(gameName);
                res(1, `${playerName} is already connected. Please do not join twice`);
                return;
            }
        }
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    socket.on('game:color', (color, res) => {
        let colors = [];
        Object.keys(data[gameName].players).forEach((name) => {
            colors.push(data[gameName].players[name].color);
        });
        if(colors.indexOf(color) == -1) {
            data[gameName].players[playerName].color = color;
        }
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    socket.on('game:start', () => {
        if(data[gameName].gameState == CONST.OPEN) {
            data[gameName].gameState = CONST.SETUP;
        }
        let turns = Object.keys(data[gameName].players).length == 4 ? [0, 1, 2, 3] : [0, 1, 2];
        Object.keys(data[gameName].players).forEach((player) => {
            data[gameName].players[player].turn = turns.splice((Math.random() * 10) % turns.length, 1)[0];
        });
        data[gameName].turn = 0;
        io.to(gameName).emit('game:data', data[gameName]);
    });
    socket.on('game:turn', (x, res) => {
        if(data[gameName].gameState == CONST.SETUP) {
            if(data[gameName].turnCount < Object.keys(data[gameName].players).length - 1) {
                data[gameName].turn++;
            } else if(data[gameName].turnCount >= Object.keys(data[gameName].players).length) {
                data[gameName].turn--;
            }
            if(data[gameName].turn < 0) {
                data[gameName].gameState = CONST.PLAY;
                data[gameName].turn = 0;
                data[gameName].turnCount = 0;
            }
        } else {
            data[gameName].turn = (data[gameName].turn + 1) % Object.keys(data[gameName].players).length;
        }
        data[gameName].turnCount++;
        data[gameName].rolled = false;
        for(let player in data[gameName].players) {
            data[gameName].players[player].response = {
                robber: null,
                trade: null
            };
            for(let i = 0; i < data[gameName].players[player].hand[CONST.DEVELOPMENT][CONST.READY].length; i++) {
                //Transfer bought devcards to ready devcards
                data[gameName].players[player].hand[CONST.DEVELOPMENT][CONST.READY][i] += data[gameName].players[player].hand[CONST.DEVELOPMENT][CONST.BOUGHT][i];
                data[gameName].players[player].hand[CONST.DEVELOPMENT][CONST.BOUGHT][i] = 0;
            }
        }
        game.save(gameName, data[gameName]);
        if(countVPs(data[gameName], playerName, playerName) >= 10) {
            io.to(gameName).emit('game:win', [data[gameName], playerName]);
            console.log(`${playerName} has won ${gameName}`);
        } else {
            socket.broadcast.to(gameName).emit('game:data', data[gameName]);
            res(null, data[gameName]);
        }
    });
    socket.on('game:roll', (x, res) => {
        let dice = [
            Math.floor(Math.random() * 1000) % 6 + 1,
            Math.floor(Math.random() * 1000) % 6 + 1
        ];
        data[gameName].dice = dice;
        data[gameName].rolled = true;
        if(dice[0] + dice[1] !== 7) {
            for(let i = 0; i < data[gameName].tiles.length; i++) {
                for(let j = 0; j < data[gameName].tiles[i].length; j++) {
                    if(data[gameName].robber[0] !== i || data[gameName].robber[1] !== j) {
                        if(data[gameName].tiles[i][j][1] === dice[0] + dice[1]) {
                            let adj = adjacent(i, j, 'tile', 'house');
                            adj.forEach((house) => {
                                if(data[gameName].houses[house[0]][house[1]][0]) {
                                    let houseOwner = data[gameName].houses[house[0]][house[1]][1];
                                    let resourceType = data[gameName].tiles[i][j][0];
                                    let quantity = data[gameName].houses[house[0]][house[1]][0];
                                    data[gameName].players[houseOwner].hand[CONST.RESOURCE][resourceType] += quantity;
                                }
                            });
                        }
                    }
                }
            }
        }
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });

    //Building events
    socket.on('build:house', ([i, j], res) => {
        data[gameName].houses[i][j][0] = 1;
        data[gameName].houses[i][j][1] = playerName;
        if(data[gameName].gameState != CONST.SETUP) {
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WOOL] -= 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WOOD] -= 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WHEAT] -= 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.BRICK] -= 1;
        } else {
            if(data[gameName].turnCount >= Object.keys(data[gameName].players).length) {
                let tiles = adjacent(i, j, 'house', 'tile');
                tiles.forEach((tile) => {
                    let resourceType = data[gameName].tiles[tile[0]][tile[1]][0];
                    data[gameName].players[playerName].hand[CONST.RESOURCE][resourceType]++;
                });
            }
        }
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, [data[gameName], [i, j]]);
    });
    socket.on('build:road', ([i, j, free], res) => {
        data[gameName].roads[i][j] = playerName;
        if(!free) {
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WOOD] -= 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.BRICK] -= 1;
        }

        let check = (list) => {
            let adj = adjacent(list[list.length - 1][0], list[list.length - 1][1], 'road', 'road');
            let branch = [0, 0, 0, 0];
            let n = 0;
            outer:
            for(let [x, y] of adj) {
                if(data[gameName].roads[x][y] === playerName) {
                    for(let [a, b] of list) {
                        //If not in the list already
                        if(a === x && b === y) {
                            continue outer;
                        }
                    }
                    if(list.length >= 2) {
                        for(let [a, b] of adjacent(x, y, 'road', 'road')) {
                            //If on the same end of the road as the previous road
                            if(a === list[list.length - 2][0] && b === list[list.length - 2][1]) {
                                continue outer;
                            }
                        }
                    }
                    branch[n++] = check([...list, [x, y]]);
                }
            }
            if(n === 0) {
                return list.length;
            }
            let max = 0;
            while(--n >= 0) {
                max = Math.max(branch[n], max);
            }
            return max;
        };
        for(let a = 0; a < data[gameName].roads.length; a++) {
            for(let b = 0; b < data[gameName].roads[a].length; b++) {
                if(data[gameName].roads[a][b] === playerName) {
                    data[gameName].players[playerName].longestRoadCount = Math.max(data[gameName].players[playerName].longestRoadCount, check([[a,b]]));
                }
            }
        }

        let max = null;
        for(let player in data[gameName].players) {
            if(data[gameName].players[player].longestRoad) {
                data[gameName].players[player].longestRoad = false;
                max = player;
                break;
            }
        }
        for(let player in data[gameName].players) {
            if(data[gameName].players[player].longestRoadCount >= 5) {
                if(max === null || data[gameName].players[player].longestRoadCount > data[gameName].players[max].longestRoadCount) {
                    max = player;
                }
            }
        }
        if(max !== null) {
            data[gameName].players[max].longestRoad = true;
        }

        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, [data[gameName], [i, j]]);
    });
    socket.on('build:city', ([i, j], res) => {
        data[gameName].houses[i][j][0] = 2;
        data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.ORE] -= 3;
        data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WHEAT] -= 2;
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, [data[gameName], [i, j]]);
    });

    //Development cards
    socket.on('devcard:buy', (x, res) => {
        let c, err;
        if(data[gameName].devCards.length > 0) {
            c = data[gameName].devCards.splice(0, 1);
            data[gameName].players[playerName].hand[CONST.DEVELOPMENT][CONST.BOUGHT][c] += 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.ORE] -= 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WOOL] -= 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WHEAT] -= 1;
        } else {
            err = "There are no more development cards";
        }
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        socket.broadcast.to(gameName).emit('notification', `${playerName} bought a development card`);
        res(err, [data[gameName], c !== undefined ? ['Knight','VP','Monopoly','Road Building','Year Of Plenty'][c] : '']);
    });
    socket.on('devcard:play', (which, res) => {
        data[gameName].players[playerName].hand[CONST.DEVELOPMENT][CONST.READY][which] -= 1;
        let cardName;
        if(which === CONST.KNIGHT) {
            cardName = 'Knight';
            data[gameName].players[playerName].knights++;
            //Calculate the largest army
            let max = null;
            for(let p in data[gameName].players) {
                if(data[gameName].players[p].largestArmy) {
                    data[gameName].players[p].largestArmy = false;
                    max = p;
                    break;
                }
            }
            for(let p in data[gameName].players) {
                if(data[gameName].players[p].knights >= 3) {
                    if(max === null || data[gameName].players[p].knights > data[gameName].players[max].knights) {
                        max = p;
                    }
                }
            }
            if(max !== null) {
                data[gameName].players[max].largestArmy = true;
            }
        } else if(which === CONST.YEAR_OF_PLENTY) {
            cardName = 'Year of Plenty';
        } else if(which === CONST.ROAD_BUILDING) {
            cardName = 'Road Building';
        } else if(which === CONST.MONOPOLY) {
            cardName = 'Monopoly';
        }
        socket.broadcast.to(gameName).emit('notification', `${playerName} played a ${cardName} card`);
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    socket.on('devcard:monopoly', (which, res) => {
        for(let player in data[gameName].players) {
            if(player != playerName) {
                data[gameName].players[playerName].hand[CONST.RESOURCE][which] += data[gameName].players[player].hand[CONST.RESOURCE][which];
                data[gameName].players[player].hand[CONST.RESOURCE][which] = 0;
            }
        }
        let resourceName = ['Wool', 'Wheat', 'Wood', 'Brick', 'Ore'];
        socket.broadcast.to(gameName).emit('notification', `${playerName} played a ${resourceName[which]} card`);
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    socket.on('devcard:plenty', (which, res) => {
        data[gameName].players[playerName].hand[CONST.RESOURCE][which[0]] += 1;
        data[gameName].players[playerName].hand[CONST.RESOURCE][which[1]] += 1;
        let resourceName = ['Wool', 'Wheat', 'Wood', 'Brick', 'Ore'];
        socket.broadcast.to(gameName).emit('notification', `${playerName} took a ${resourceName[which[0]]} and a ${resourceName[which[1]]}`);
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });

    //Robber events
    socket.on('robber:start', (x, res) => {
        for(let player in data[gameName].players) {
            data[gameName].players[player].response.robber = false;
        }
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    socket.on('robber:move', (pos, res) => {
        data[gameName].robber = pos;
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    socket.on('robber:steal', (target, res) => {
        let r;
        do {
            r = Math.floor((Math.random() * 10) % 5);
        } while(data[gameName].players[target].hand[CONST.RESOURCE][r] < 1);
        data[gameName].players[target].hand[CONST.RESOURCE][r]--;
        data[gameName].players[playerName].hand[CONST.RESOURCE][r]++;
        socket.broadcast.to(gameName).emit('notification', `${playerName} steals from ${target}`);
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    socket.on('robber:discard', (discards, res) => {
        discards.forEach((c) => {
            data[gameName].players[playerName].hand[CONST.RESOURCE][c]--;
        });
        data[gameName].players[playerName].response.robber = true;
        let done = true;
        Object.keys(data[gameName].players).forEach((player) => {
            if(!data[gameName].players[player].response.robber) {
                done = false;
            }
        });
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        socket.broadcast.to(gameName).emit('robber:progress', [data[gameName], done]);
        res(null, [data[gameName], done]);
    });

    //Trade events
    socket.on('trade:storage', (offer, res) => {
        for(let c = 0; c < 5; c++) {
            data[gameName].players[playerName].hand[CONST.RESOURCE][c] += offer.get[c];
            data[gameName].players[playerName].hand[CONST.RESOURCE][c] -= offer.give[c];
        }
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    socket.on('trade:offer', (offer, res) => {
        for(let player in data[gameName].players) {
            data[gameName].players[player].response.trade = null;
        }
        offer.player = playerName;
        data[gameName].trade = offer;
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, [data[gameName], 'trade']);
    });
    socket.on('trade:respond', (offer, res) => {
        data[gameName].players[playerName].response.trade = offer;
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    socket.on('trade:accept', (name, res) => {
        let offer;
        for(let player in data[gameName].players) {
            if(player === name) {
                offer = data[gameName].players[player].response.trade;
                if(offer.response && offer.response === true) {
                    offer = data[gameName].trade;
                }
            }
            data[gameName].players[player].response.trade = null;
        }
        data[gameName].trade = null;
        for(let c = 0; c < 5; c++) {
            data[gameName].players[name].hand[CONST.RESOURCE][c] -= offer.get[c];
            data[gameName].players[name].hand[CONST.RESOURCE][c] += offer.give[c];
            data[gameName].players[playerName].hand[CONST.RESOURCE][c] += offer.get[c];
            data[gameName].players[playerName].hand[CONST.RESOURCE][c] -= offer.give[c];
        }
        socket.broadcast.to(gameName).emit('notification', `${playerName} trades with ${name}`);
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    socket.on('trade:reject', (x, res) => {
        for(let player in data[gameName].players) {
            data[gameName].players[player].response.trade = null;
        }
        data[gameName].trade = null;
        socket.broadcast.to(gameName).emit('notification', `${playerName} does not accept any trade`);
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });

    //End game
    socket.on('disconnect', () => {
        if(data[gameName] !== undefined && data[gameName].players[playerName] !== undefined) {
            //Disconnect the player
            data[gameName].players[playerName].connected = false;
            //Remove the game from the memory if all players are gone
            let online = false;
            Object.keys(data[gameName].players).forEach((player) => {
                if(data[gameName].players[player].connected) {
                    online = true;
                }
            });
            if(!online) {
                delete data[gameName];
            }
        }
    });


    //Chat
    socket.on('chat:post', (msg) => {
        let swears = /\b(shit|fuck|bitch|ass|hell|crap|dick)\b/gi;
        let replacements = [
            "bubblegum", "puff", "strudel", "clouds",
            "the entire population of France", "emu",
            "goose", "jello", "piccolo", "spaceship",
            "pentagon", "dandelion", "happy meal" ];

        io.to(gameName).emit('chat:message', {
            body: msg.replace(swears, replacements[Math.floor(Math.random() * replacements.length)]),
            author: playerName,
            time: Date.now()
        });
    });
});
