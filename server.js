'use strict';
let express = require('express');
let app = express();
let server = app.listen(8888, () => {
    console.log('Server started at 8888');
});
let io = require('socket.io')(server);
let game = require('./script/game.es6');
let data = [];

let CONST = require('./const');
let adjacent = require('./script/adjacent.es6');
app.use('', express.static('public_html'));

io.on('connection', (socket) => {
    //Setup
    socket.on('game:join', ([game, player], res) => {
        socket.player = player;
        socket.game = game;
        console.log(
            `${socket.player} is attempting to join ${socket.game}`
        );
        socket.join(socket.game);
        if(data[socket.game] === undefined) {
            data[socket.game] = {};
            if(game.exists(socket.game)) {
                data[socket.game] = game.load(socket.game);
            } else {
                data[socket.game] = game.new(socket.game);
            }
        }
        let i;
        if(data[socket.game][socket.player] === undefined) {
            if(Object.keys(data[socket.game].players).length < 4 && data[socket.game].gameState === CONST.OPEN) {
                data[socket.game].players[socket.player] = {
                    turn: Object.keys(data[socket.game].players).length,
                    color: '',
                    hand: [
                        [0,0,0,0,0],
                        [0,0,0,0,0]
                    ],
                    connected: true
                };
            } else {
                socket.leave(socket.game);
                res(1, `${game} is full. Please choose a different game`);
                return;
            }
        }
        res(null, data[socket.game]);
        socket.broadcast.to(socket.game).emit('game:data', data[socket.game]);
    });
    socket.on('game:color', (color, res) => {
        let colors = [];
        data[socket.game].players.forEach(({color}) => {
            colors.push(color);
        });
        if(colors.indexOf(color) == -1) {
            data[socket.game].players[socket.player].color = color;
        }
        res(null, data[socket.game]);
    });

    //Game
    socket.on('game:start', () => {
        data[socket.game].game_started = true;
        for(let i = data[socket.game].players.length; i > 0; i--) {
            //Choose random player order
            let r = Math.floor(Math.random() * i);
            [data[socket.game].players[r], data[socket.game].players[i - 1]] = [data[socket.game].players[i - 1], data[socket.game].players[r]];
        }
        data[socket.game].turn = 0;
        io.to(socket.game).emit('new data', data[socket.game]);
    });
    socket.on('turn end', (d) => {
        data[socket.game] = d;
        if(data[socket.game].setup < data[socket.game].players.length * 2) {
            if(data[socket.game].setup < data[socket.game].players.length - 1) {
                data[socket.game].turn++;
            } else if(  data[socket.game].setup >= data[
                        socket.game].data.players.length &&
                        data[socket.game].setup != data[socket.game].players.length * 2 -1) {
                data[socket.game].turn--;
            }
            data[socket.game].setup++;
        } else {
            data[socket.game].turn = (data[socket.game].turn + 1) % data[socket.game].players.length;
        }
        data[socket.game].rolled = false;
        io.to(socket.game).emit('new data', data[socket.game]);
    });

    socket.on('disconnect', () => {
        if(data[socket.game] !== undefined) {
            data[socket.game].population--;
            if(data[socket.game].songs_playing > 0) {
                data[socket.game].songs_playing--;
            }
            if(data[socket.game].population === 0) {
                game.save(socket.game, data[socket.game]);
                delete data[socket.game];
            }
        }
    });

    socket.on('add song', (song) => {
        data[socket.game].songs.push(song);
        console.log('Song received');
        if(data[socket.game].songs_playing === 0) {
            io.to(socket.game).emit('play song', data[socket.game].songs[0]);
            data[socket.game].songs_playing = data[socket.game].population;
            data[socket.game].songs.splice(0, 1);
            console.log('Song sent');
        }
    });
    socket.on('request song', () => {
        if(data[socket.game].songs_playing > 0) {
            data[socket.game].songs_playing--;
        }
        if(data[socket.game].songs_playing === 0) {
            if(data[socket.game].songs.length !== 0) {
                console.log('Song sent');
                io.to(socket.game).emit('play song', data[socket.game].songs[0]);
                data[socket.game].songs_playing = data[socket.game].population;
                data[socket.game].songs.splice(0, 1);
            }
        }
    });

    socket.on('roll', () => {
        let dice = [Math.floor(Math.random() * 1000) % 6 + 1,
            Math.floor(Math.random() * 1000) % 6 + 1
        ];
        let d = data[socket.game];
        d.rolled = true;
        d.dice = dice;
        if(dice[0] + dice[1] == 7) {
            data[socket.game].robber_clear = 0;
            io.to(socket.game).emit('robber-start', dice);
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
            io.to(socket.game).emit('roll-back', d);
        }
    });
    socket.on('robber-clear', (d) => {
        if(d && d.discards) {
            for(let i = 0; i < 5; i++) {
                data[socket.game].hands[d.n][0][i] -= d.discards[i];
            }
        }
        io.to(socket.game).emit('new data');
        data[socket.game].robber_clear++;
        if(data[socket.game].robber_clear == data[socket.game].players.length) {
            io.to(socket.game).emit('robber-choose');
        }
    });
    socket.on('robber-move', (d) => {
        data[socket.game].robber = d;
        socket.broadcast.to(socket.game).emit('new data', data[socket.game]);
    });
    socket.on('robber-steal', ({
        d, n
    }) => {
        let x = Math.floor(Math.random() * 1000) % data[socket.game].hands[d].reduce((p, c) => p + c, 0);
        let r = 0;
        while(x >= data[socket.game].hands[d][r]) {
            x -= data[socket.game].hands[d][r];
            r++;
        }
        data[socket.game].hands[d][r]--;
        data[socket.game].hands[n][r]++;
        socket.broadcast.to(socket.game).emit('new data', data[socket.game]);
    });
});
