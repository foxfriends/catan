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
                    }
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
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
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
                    if(data[gameName].tiles[i][j][1] == dice[0] + dice[1]) {
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
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, [data[gameName], [i, j]]);
    });
    socket.on('build:city', ([i, j], res) => {
        data[gameName].houses[i][j][0] = 2;
        data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.ROCK] -= 3;
        data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WHEAT] -= 2;
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, [data[gameName], [i, j]]);
    });

    //Development cards
    socket.on('devcard:buy', (x, res) => {
        let c;
        if(data[gameName].devCards.length > 0) {
            data[gameName].devCards.splice(0, 1);
            data[gameName].players[playerName].hand[CONST.DEVELOPMENT][CONST.BOUGHT][c] += 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.ORE] -= 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WOOL] -= 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WHEAT] -= 1;
        }
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(c !== undefined ? null : 'There are no more dev cards', [data[gameName], c !== undefined ? ['Knight','VP','Monopoly','Road Building','Year Of Plenty'][c] : '']);
    });
    socket.on('devcard:play', (which, res) => {
        data[gameName].players[playerName].hand[CONST.DEVELOPMENT][CONST.READY][which] -= 1;
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
        socket.broadcast.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    socket.on('devcard:plenty', (which, res) => {
        data[gameName].players[playerName].hand[CONST.RESOURCE][which[0]] += 1;
        data[gameName].players[playerName].hand[CONST.RESOURCE][which[1]] += 1;
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

    //End game
    socket.on('disconnect', () => {
        if(data[gameName] !== undefined) {
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

    //  ------------------
    //
    // socket.on('add song', (song) => {
    //     data[gameName].songs.push(song);
    //     console.log('Song received');
    //     if(data[gameName].songs_playing === 0) {
    //         io.to(gameName).emit('play song', data[gameName].songs[0]);
    //         data[gameName].songs_playing = data[gameName].population;
    //         data[gameName].songs.splice(0, 1);
    //         console.log('Song sent');
    //     }
    // });
    // socket.on('request song', () => {
    //     if(data[gameName].songs_playing > 0) {
    //         data[gameName].songs_playing--;
    //     }
    //     if(data[gameName].songs_playing === 0) {
    //         if(data[gameName].songs.length !== 0) {
    //             console.log('Song sent');
    //             io.to(gameName).emit('play song', data[gameName].songs[0]);
    //             data[gameName].songs_playing = data[gameName].population;
    //             data[gameName].songs.splice(0, 1);
    //         }
    //     }
    // });
    //
    // socket.on('robber-clear', (d) => {
    //     if(d && d.discards) {
    //         for(let i = 0; i < 5; i++) {
    //             data[gameName].hands[d.n][0][i] -= d.discards[i];
    //         }
    //     }
    //     io.to(gameName).emit('new data');
    //     data[gameName].robber_clear++;
    //     if(data[gameName].robber_clear == data[gameName].players.length) {
    //         io.to(gameName).emit('robber-choose');
    //     }
    // });
    // socket.on('robber-move', (d) => {
    //     data[gameName].robber = d;
    //     socket.broadcast.to(gameName).emit('new data', data[gameName]);
    // });
    // socket.on('robber-steal', ({
    //     d, n
    // }) => {
    //     let x = Math.floor(Math.random() * 1000) % data[gameName].hands[d].reduce((p, c) => p + c, 0);
    //     let r = 0;
    //     while(x >= data[gameName].hands[d][r]) {
    //         x -= data[gameName].hands[d][r];
    //         r++;
    //     }
    //     data[gameName].hands[d][r]--;
    //     data[gameName].hands[n][r]++;
    //     socket.broadcast.to(gameName).emit('new data', data[gameName]);
    // });
});
