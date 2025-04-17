'use strict';

import {CONST} from './const.js';
import {adjacent} from './adjacent.js';
import {default as $} from 'jquery';

const GEN = Symbol(), SOCKET = Symbol(), PLAYER = Symbol();

export class Robber {
    constructor(g, s, p) {
        this[GEN] = g;
        this[SOCKET] = s;
        this[PLAYER] = p;
    }

    start() {
        this[SOCKET].emit('robber:start', null, (err, res) => {
            this[GEN].next([err, res]);
        });
    }

    discard(discarded) {
        this[SOCKET].emit('robber:discard', discarded, (err, res) => {
            this[GEN].next([err, res]);
        });
    }
    discardShow(discarded, data) {
        $('#request-overlay').css('display', 'block');
        $('#request-form')
            .append($('<h2></h2>')
                .text('The robber takes half your cards!')
            )
            .append($('<p></p>')
                .text('To discard')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'to-discard')
            )
            .append($('<p></p>')
                .text('To keep')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'to-keep')
            )
            .append($('<button></button>')
                .text('Discard')
                .attr('id', 'discard-button')
                .click(() => {
                    discarded = [];
                    $('#to-discard').children('.card').each(function(i) {
                        discarded.push($(this).attr('data-card-type'));
                    });
                    this.discardHide();
                    this[GEN].next(discarded);
                })
            );
        let hand = new Array(...data.players[this[PLAYER]].hand[CONST.RESOURCE]);
        let resourceNames = ['wool', 'wheat', 'wood', 'brick', 'ore'];
        let discards = $('#to-discard');
        let keeps = $('#to-keep');

        let arrangeCards = () => {
            $('.card-container').each(function() {
                let spacing = 50;
                while(spacing * $(this).children('.card').length > $(this).width()) {
                    spacing--;
                }
                $(this).children('.card').each(function(i) {
                    $(this).css('left', `${i * spacing}px`);
                });
            });
            if($('#to-discard').children('.card').length >= $('#to-keep').children('.card').length - 1) {
                $('#discard-button')
                    .removeClass('not-clickable');
            } else {
                $('#discard-button')
                    .addClass('not-clickable');
            }
        };

        let moveToDiscard, moveToKeep;
        moveToKeep = function() {
            $(this).detach()
                .appendTo(keeps)
                .off('click')
                .click(moveToDiscard);
            arrangeCards();
        };
        moveToDiscard = function() {
            $(this).detach()
                .appendTo(discards)
                .off('click')
                .click(moveToKeep);
            arrangeCards();
        };
        discarded.forEach((cardType) => {
            discards
                .append($('<div></div>')
                    .addClass(`card ${resourceNames[cardType]}`)
                    .css('cursor', 'pointer')
                    .attr('data-card-type', cardType)
                    .click(moveToKeep)
                );
            hand[cardType]--;
        });
        for(let i = 0; i < hand.length; i++) {
            for(let j = 0; j < hand[i]; j++) {
                keeps
                    .append($('<div></div>')
                        .addClass(`card ${resourceNames[i]}`)
                        .css('cursor', 'pointer')
                        .attr('data-card-type', i)
                        .click(moveToDiscard)
                    );
            }
        }
        arrangeCards();
    }
    discardHide(data) {
        $('#request-overlay')
            .css('display', 'none');
        $('#request-form')
            .html('');
    }

    wait() {
        this[SOCKET].once('robber:progress', (res) => {
            this[GEN].next(res);
        });
    }
    move(i, j, data) {
        data.robber = [i, j];
        this.moveHide(data);
        this[SOCKET].emit('robber:move', [i, j], (err, res) => {
            this[GEN].next([err, res]);
        });
    }
    moveShow(data) {
        for(let i = 0; i < data.tiles.length; i++) {
            for(let j = 0; j < data.tiles[i].length; j++) {
                if(data.robber[0] !== i || data.robber[1] !== j) {
                    $('.tile_row').eq(i).children('.tile').eq(j).children('.robber')
                        .css({
                            opacity: 0.5,
                            cursor: 'pointer'
                        })
                        .click(() => {
                            this.move(i, j, data);
                        });
                }
            }
        }
    }
    moveHide(data) {
        for(let i = 0; i < data.tiles.length; i++) {
            for(let j = 0; j < data.tiles[i].length; j++) {
                $('.tile_row').eq(i).children('.tile').eq(j).children('.robber')
                    .css({
                        opacity: (data.robber[0] !== i || data.robber[1] !== j) ? 0 : 1,
                        cursor: 'default'
                    })
                    .off('click');
            }
        }
    }
    steal(target, data) {
        this[SOCKET].emit('robber:steal', target, (err, res) => {
            this[GEN].next([err, res]);
        });
        this.stealHide(data);
    }
    stealShow(data) {
        let adj = adjacent(data.robber[0], data.robber[1], 'tile', 'house');
        let skip = true;
        adj.forEach((target) => {
            if(data.houses[target[0]][target[1]][0] !== 0 && data.houses[target[0]][target[1]][1] !== this[PLAYER]) {
                if(data.players[data.houses[target[0]][target[1]][1]].hand[CONST.RESOURCE].reduce((p, c) => p + c, 0)) {
                    skip = false;
                    $('.house_row').eq(target[0]).children('.house').eq(target[1])
                        .addClass('targetable')
                        .click(() => {
                            this.steal(data.houses[target[0]][target[1]][1], data);
                        });
                }
            }
        });
        if(skip) {
            window.setTimeout(() => {
                this[GEN].next([null, data]);
            }, 0);
        }
    }
    stealHide(data) {
        let adj = adjacent(data.robber[0], data.robber[1], 'tile', 'house');
        adj.forEach((target) => {
            $('.house_row').eq(target[0]).children('.house').eq(target[1])
                .removeClass('targetable')
                .off('click');
        });
    }
}
