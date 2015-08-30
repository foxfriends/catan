'use strict';

const GEN = Symbol(), SOCKET = Symbol(), PLAYER = Symbol();

export class DevCard {
    constructor(g, s, p) {
        this[GEN] = g;
        this[SOCKET] = s;
        this[PLAYER] = p;
    }
    buyShow() {

    }
    playShow() {
        
    }
}
