'use strict';
let express = require('express');
let app = express();

let server = app.listen(8888, () => {
    console.log('Server started at 8888');
});

let io = require('socket.io')(server);

let game = require('./game');
let data = [];

let {CONST} = require('./public_html/script/src/const');
let adjacent = require('./public_html/script/src/adjacent');

app.use('', express.static('public_html'));

io.on('connection', (socket) => {
    let playerName, gameName;
    socket.on('error', (err) => {
        console.trace(err);
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
                        [0,0,0,0,0]
                    ],
                    connected: true
                };
            } else {
                socket.leave(gameName);
                res(1, `${gameName} is full. Please choose a different game`);
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
        res(null, data[gameName]);
    });
    socket.on('game:start', () => {
        if(data[gameName].gameState == CONST.OPEN) {
            data[socket.gmae].gameState = CONST.SETUP;
        }
        let turns = Object.keys(data[gameName].players).length == 4 ? [0, 1, 2, 3] : [0, 1, 2];
        data[gameName].players.map((player) => {
            player.turn = turns.splice((Math.random() * 10) % turns.length, 1);
        });
        data[gameName].turn = 0;
        io.to(gameName).emit('game:data', data[gameName]);
    });
    socket.on('game:turn', (x, res) => {
        if(data[gameName].gameState == CONST.SETUP) {
            if(data[gameName].turnCount < Object.keys(data[gameName].players).length) {
                data[gameName].turn++;
            } else {
                data[gameName].turn--;
            }
        } else {
            data[gameName].turn = (data[gameName].turn + 1) % Object.keys(data[gameName].players).length;
        }
        data[gameName].turnCount++;
        data[gameName].rolled = false;
        io.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });

    //Building events
    socket.on('build:house', ([i, j], res) => {
        data[gameName].houses[i][j][0] = 1;
        data[gameName].houses[i][j][1] = data[gameName].players[playerName].turn;
        if(data[gameName].gameState != CONST.SETUP) {
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WOOL] -= 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WOOD] -= 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WHEAT] -= 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.BRICK] -= 1;
        }
        io.to(gameName).emit('game:data', data[gameName]);
        res(null, [[data[gameName], [i, j]]]);
    });
    socket.on('build:road', ([i, j, free], res) => {
        data[gameName].roads[i][j] = data[gameName].players[playerName].turn;
        if(!free) {
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WOOD] -= 1;
            data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.BRICK] -= 1;
        }
        io.to(gameName).emit('game:data', data[gameName]);
        res(null, [[data[gameName], [i, j]]]);
    });
    socket.on('build:city', ([i, j], res) => {
        data[gameName].houses[i][j][0] = 2;
        data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.ROCK] -= 3;
        data[gameName].players[playerName].hand[CONST.RESOURCE][CONST.WHEAT] -= 2;
        io.to(gameName).emit('game:data', data[gameName]);
        res(null, [[data[gameName], [i, j]]]);
    });

    //Robber events
    socket.on('robber:start', (x, res) => {
        data[gameName].players.map((player) => {
            player.response = {robber: false};
            return player;
        });
        io.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    socket.on('robber:move', (pos, res) => {
        data[gameName].robber = pos;
        io.to(gameName).emit('game:data', data[gameName]);
    });
    socket.on('robber:steal', (target, res) => {
        let r;
        while(!data[gameName].players[target].hand[CONST.RESOURCE][(r = (Math.random() * 10) % 5)]);
        data[gameName].players[target].hand[CONST.RESOURCE][r]--;
        data[gameName].players[playerName].hand[CONST.RESOURCE][r]++;
        io.to(gameName).emit('game:data', data[gameName]);
    });
    socket.on('robber:discard', (discards, res) => {
        discards.forEach((c) => {
            data[gameName].players[playerName].hand[CONST.RESOURCE][c]--;
        });
        data[gameName].players[playerName].response = {robber: true};
        io.to(gameName).emit('game:data', data[gameName]);
        res(null, data[gameName]);
    });
    //  ------------------
    socket.on('disconnect', () => {
        if(data[gameName] !== undefined) {
            data[gameName].population--;
            if(data[gameName].songs_playing > 0) {
                data[gameName].songs_playing--;
            }
            if(data[gameName].population === 0) {
                game.save(gameName, data[gameName]);
                delete data[gameName];
            }
        }
    });

    socket.on('add song', (song) => {
        data[gameName].songs.push(song);
        console.log('Song received');
        if(data[gameName].songs_playing === 0) {
            io.to(gameName).emit('play song', data[gameName].songs[0]);
            data[gameName].songs_playing = data[gameName].population;
            data[gameName].songs.splice(0, 1);
            console.log('Song sent');
        }
    });
    socket.on('request song', () => {
        if(data[gameName].songs_playing > 0) {
            data[gameName].songs_playing--;
        }
        if(data[gameName].songs_playing === 0) {
            if(data[gameName].songs.length !== 0) {
                console.log('Song sent');
                io.to(gameName).emit('play song', data[gameName].songs[0]);
                data[gameName].songs_playing = data[gameName].population;
                data[gameName].songs.splice(0, 1);
            }
        }
    });

    socket.on('roll', () => {
        let dice = [Math.floor(Math.random() * 1000) % 6 + 1,
            Math.floor(Math.random() * 1000) % 6 + 1
        ];
        let d = data[gameName];
        d.rolled = true;
        d.dice = dice;
        if(dice[0] + dice[1] == 7) {
            data[gameName].robber_clear = 0;
            io.to(gameName).emit('robber-start', dice);
        } else {
            for(let i = 0; i < d.tiles.length; i++) {
                for(let j = 0; j < d.tiles[i].length; j++) {
                    if(d.tiles[i][j][1] == dice[0] + dice[1]) {
                        let adj = adjacent(i, j, 'tile', 'house');
                        adj.forEach((house) => {
                            if(d.houses[house[0]][house[1]][0] > 0) {
                                d.hands[d.houses[house[0]][house[1]][1]][0][d.tiles[i][j][0]] += d.houses[house[0]][house[1]][0];
                            }
                        });
                    }
                }
            }
            io.to(gameName).emit('roll-back', d);
        }
    });
    socket.on('robber-clear', (d) => {
        if(d && d.discards) {
            for(let i = 0; i < 5; i++) {
                data[gameName].hands[d.n][0][i] -= d.discards[i];
            }
        }
        io.to(gameName).emit('new data');
        data[gameName].robber_clear++;
        if(data[gameName].robber_clear == data[gameName].players.length) {
            io.to(gameName).emit('robber-choose');
        }
    });
    socket.on('robber-move', (d) => {
        data[gameName].robber = d;
        socket.broadcast.to(gameName).emit('new data', data[gameName]);
    });
    socket.on('robber-steal', ({
        d, n
    }) => {
        let x = Math.floor(Math.random() * 1000) % data[gameName].hands[d].reduce((p, c) => p + c, 0);
        let r = 0;
        while(x >= data[gameName].hands[d][r]) {
            x -= data[gameName].hands[d][r];
            r++;
        }
        data[gameName].hands[d][r]--;
        data[gameName].hands[n][r]++;
        socket.broadcast.to(gameName).emit('new data', data[gameName]);
    });
});
