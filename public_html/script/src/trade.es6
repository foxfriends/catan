'use strict';

import {CONST} from './const.es6';
import {default as $} from 'jquery';

const GEN = Symbol(), SOCKET = Symbol(), PLAYER = Symbol();

export class Trade {
    constructor(g, s, p) {
        this[GEN] = g;
        this[SOCKET] = s;
        this[PLAYER] = p;
    }
    buttonShow(data) {
        if(data.players[this[PLAYER]].hand[CONST.RESOURCE].reduce((p, c) => p + c, 0) > 0) {
            $('#init-trade')
                .css('display', 'block')
                .off('click')
                .click(() => {
                    this[GEN].next([null, [data, 'trade']]);
                });
        }
    }
    buttonHide() {
        $('#init-trade')
            .css('display', 'block')
            .off('click');
    }

    offer(cards) {

    }
    offerShow(data) {

    }
    offenHide() {

    }
}
