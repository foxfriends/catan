'use strict';

const CONST = require('./const');
let adjacent = require('./adjacent');

module.exports = (gen, socket, player) => {
    let Robber = {};
    Robber.discard = () => {
    };
    Robber.discard.hide = () => {
    };

    Robber.wait = () => {
        socket.once('robber:progress', gen.next);
    };

    Robber.move = (data) => {
        for(let i = 0; i < data.tiles.length; i++) {
            for(let j = 0; j < data.tiles[i].length; j++) {
                if(data.robber[0] != i || data.robber[1] != j) {
                    let rob = document.getElementsByClassName('tile_row')[i].getElementsByClassName('tile')[j].getElementsByClassName('robber')[0];
                    rob.style.opacity = 0.5;
                    rob.style.cursor = 'pointer';
                    rob.onclick = () => {
                        data.robber = [i, j];
                        Robber.move.hide(data);
                        socket.emit('robber:move', [i, j], gen.next);
                    };
                }
            }
        }
    };
    Robber.move.hide = (data) => {
        for(let i = 0; i < data.tiles.length; i++) {
            for(let j = 0; j < data.tiles[i].length; j++) {
                let rob = document.getElementsByClassName('tile_row')[i].getElementsByClassName('tile')[j].getElementsByClassName('robber')[0];
                if(data.robber[0] != i || data.robber[1] != j) {
                    rob.style.opacity = 0;
                } else {
                    rob.style.opacity = 1;
                }
                rob.style.cursor = 'default';
                rob.onclick = undefined;
            }
        }
    };
    Robber.steal = (data) => {
        let adj = adjacent(data.robber[0], data.robber[1], 'tile', 'house');
        adj.forEach((target) => {
            if(data.houses[target[0]][target[1]][0] !== 0) {
                let house = document.getElementsByClassName('house_row')[target[0]].getElementsByClassName('house')[target[1]];
                house.style.cursor = 'pointer';
                house.style.border = '3px solid #AAA';
                house.onclick = () => {
                    socket.emit('robber-steal', {
                        d: data.houses[target[0]][target[1]][1],
                        n: data.players[player].turn
                    }, gen.next);
                };
            }
        });
    };
    Robber.steal.hide = (data) => {
        let adj = adjacent(data.robber[0], data.robber[1], 'tile', 'house');
        adj.forEach((target) => {
            let house = document.getElementsByClassName('house_row')[target[0]].getElementsByClassName('house')[target[1]];
            house.style.cursor = 'default';
            house.style.border = 'none';
            house.onclick = undefined;
        });
    };
    return Robber;
};
