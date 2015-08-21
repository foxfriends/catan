'use strict';

import {CONST} from './const.es6';
import {adjacent} from './adjacent.es6';

const GEN = Symbol(), SOCKET = Symbol(), PLAYER = Symbol();

export class Robber {
    constructor(g, s, p) {
        this[GEN] = g;
        this[SOCKET] = s;
        this[PLAYER] = p;
    }

    start() {
        this[SOCKET].emit('robber:start', null, this[GEN].next);
    }

    discard(discarded) {
        this[SOCKET].emit('robber:discard', [discarded, this[PLAYER]], this[GEN].next);
    }
    discardShow(discarded, data) {
    }
    discardHide(data) {
    }

    wait() {
        this[SOCKET].once('robber:progress', this[GEN].next);
    }
    move(i, j, data) {
        data.robber = [i, j];
        this.moveHide(data);
        this[SOCKET].emit('robber:move', [i, j], this[GEN].next);
    }
    moveShow(data) {
        for(let i = 0; i < data.tiles.length; i++) {
            for(let j = 0; j < data.tiles[i].length; j++) {
                if(data.robber[0] != i || data.robber[1] != j) {
                    let rob = document.getElementsByClassName('tile_row')[i].getElementsByClassName('tile')[j].getElementsByClassName('robber')[0];
                    rob.style.opacity = 0.5;
                    rob.style.cursor = 'pointer';
                    rob.onclick = () => {
                        this.move(i, j, data);
                    };
                }
            }
        }
    }
    moveHide(data) {
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
    }
    steal(target, data) {
        this[SOCKET].emit('robber-steal', target, this[GEN].next);
        this.stealHide(data);
    }
    stealShow(data) {
        let adj = adjacent(data.robber[0], data.robber[1], 'tile', 'house');
        adj.forEach((target) => {
            if(data.houses[target[0]][target[1]][0] !== 0 && data.houses[target[0]][target[1]][1] != data.players[this[PLAYER]].turn) {
                let p;
                for(p in data.players) {
                    if(data.players[p].turn == data.houses[target[0]][target[1]][1]) {
                        break;
                    }
                }
                if(data.playerss[p].hand[CONST.RESOURCE].reduce((p, c) => p + c, 0)) {
                    let house = document.getElementsByClassName('house_row')[target[0]].getElementsByClassName('house')[target[1]];
                    house.style.cursor = 'pointer';
                    house.style.border = '3px solid #AAA';
                    house.onclick = () => {
                        this.steal(p, data);
                    };
                }
            }
        });
    }
    stealHide(data) {
        let adj = adjacent(data.robber[0], data.robber[1], 'tile', 'house');
        adj.forEach((target) => {
            let house = document.getElementsByClassName('house_row')[target[0]].getElementsByClassName('house')[target[1]];
            house.style.cursor = 'default';
            house.style.border = 'none';
            house.onclick = undefined;
        });
    }
}
