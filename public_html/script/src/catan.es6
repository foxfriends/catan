'use strict';

import {CONST} from './const.es6';
import {arrange} from './arrange.es6';
import {default as $} from 'jquery';

const GEN = Symbol(), SOCKET = Symbol(), PLAYER = Symbol();

export class Catan {
    constructor(g, s) {
        this[GEN] = g;
        this[SOCKET] = s;
    }
    awaitData() {
        this[SOCKET].once('game:data', (data) => {
            arrange(data, this[PLAYER]);
            this[GEN].next(data);
        });
    }

    chooseColor(color) {
        this[SOCKET].emit("game:color", color, (err, res) => {
            this[GEN].next(res);
        });
        this.chooseColorHide();
    }
    chooseColorShow(data) {
        let colors = ['red', 'orange', 'blue', 'white'];
        Object.keys(data.players).forEach((player) => {
            if(colors.indexOf(data.players[player].color) !== -1) {
                //Remove all already chosen colours
                colors.splice(colors.indexOf(data.players[player].color), 1);
            }
        });
        if(colors.length) {
            //Create the form out of what options are left
            let options;
            $('#request-overlay').css('display', 'block');
            $('#request-form')
                .append(options = $('<div></div>')
                    .css({
                        'margin': '0 auto',
                        'text-align': 'center'
                    })
                );
            colors.forEach((color) => {
                let div = $('<div></div>')
                        .attr('class', 'color_selector')
                        .css('background-color', color)
                        .click(() => {
                            this.chooseColor(color);
                        });
                options.append(div);
            });
        }
    }
    chooseColorHide() {
        $('#request-overlay')
            .css('display', 'none');
        $('#request-form')
            .html("");
    }

    chooseGameFormShow() {
        $('#start_form')
            .css('display', 'block')
            .submit((e) => {
                if($('#game_name').val() !== '' && $('#your_name').val() !== '') {
                    this.chooseGameFormHide();
                    this[PLAYER] = $('#your_name').val();
                    this[GEN].next([$('#game_name').val(), this[PLAYER]]);
                }
                e.preventDefault();
            });
    }
    chooseGameFormHide() {
        $('#start_form')
            .css('display', 'none')
            .off('submit');
    }

    startButtonShow() {
        $('#start_game')
            .css('display', 'block')
            .off('click') //Don't add multiple handlers
            .click(() => {
                this[SOCKET].emit('game:start');
                this.startButtonHide();
            });
    }
    startButtonHide() {
        $('#start_game')
            .css('display', 'none')
            .off('click');
    }

    roll() {
        this[SOCKET].emit('game:roll', null, (err, res) => {
            this[GEN].next([err, res]);
        });
    }
    turn() {
        this[SOCKET].emit('game:turn', null, (err, res) => {
            this[GEN].next([err, res]);
        });
    }
    turnEndShow() {
        $('#end-turn')
            .css('display', 'block')
            .off('click')
            .click(() => {
                this[GEN].next([null, [null, 'done']]);
            });
    }
}
