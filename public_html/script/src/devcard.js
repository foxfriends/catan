'use strict';

import {CONST} from './const.js';
import {default as $} from 'jquery';
import {showAlert} from './alert.js';
const GEN = Symbol(), SOCKET = Symbol(), PLAYER = Symbol();

export class DevCard {
    constructor(g, s, p) {
        this[GEN] = g;
        this[SOCKET] = s;
        this[PLAYER] = p;
    }

    formHide() {
        $('#request-overlay')
            .css('display', 'none');
        $('#request-form')
            .html('');
    }

    buy(data) {
        this[SOCKET].emit('devcard:buy', null, (err, res) => {
            showAlert(`Got a ${res[1]} card.`, 'success');
            this[GEN].next([err, res]);
        });
    }
    buyShow(data) {
        if( data.players[this[PLAYER]].hand[CONST.RESOURCE][CONST.ORE] > 0 &&
            data.players[this[PLAYER]].hand[CONST.RESOURCE][CONST.WHEAT] > 0 &&
            data.players[this[PLAYER]].hand[CONST.RESOURCE][CONST.WOOL] > 0 &&
            data.devCards.length > 0) {
            $('#buy-dev-card')
                .css('display', 'block')
                .off('click')
                .click(() => {
                    $('#buy-dev-card')
                        .off('click');
                    this.buy(data);
                });
        }
    }

    play(data, type) {
        this[SOCKET].emit('devcard:play', type, (err, res) => {
            this[GEN].next([null, [res, type]]);
        });
        this.formHide();
    }
    playButtonShow(data) {
        if( data.players[this[PLAYER]].hand[CONST.DEVELOPMENT][CONST.READY][CONST.MONOPOLY] > 0 ||
            data.players[this[PLAYER]].hand[CONST.DEVELOPMENT][CONST.READY][CONST.ROAD_BUILDING] > 0 ||
            data.players[this[PLAYER]].hand[CONST.DEVELOPMENT][CONST.READY][CONST.YEAR_OF_PLENTY] > 0) {
            $('#play-dev-card')
                .css('display', 'block')
                .off('click')
                .click(() => {
                    this.playShow(data);
                });
        }
    }
    playShow(data) {
        let cont;
        $('#request-overlay').css('display', 'block');
        $('#request-form')
            .append($('<h2></h2>')
                .text('Play a development card')
            )
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'devcard-list')
                .append((cont = $('<div></div>')
                    .addClass('devcard-container')
                ))
            )
            .append($('<button></button>')
                .text('Cancel')
                .click(() => {
                    this.formHide();
                }));
        if(data.players[this[PLAYER]].hand[CONST.DEVELOPMENT][CONST.READY][CONST.MONOPOLY]) {
            cont
                .append($('<div></div>')
                    .addClass('devcard monopoly')
                    .css('cursor', 'pointer')
                    .click(() => {
                        data.players[this[PLAYER]].hand[CONST.DEVELOPMENT][CONST.READY][CONST.MONOPOLY] -= 1;
                        this.play(data, CONST.MONOPOLY);
                    })
                );
        }
        if(data.players[this[PLAYER]].hand[CONST.DEVELOPMENT][CONST.READY][CONST.ROAD_BUILDING]) {
            cont
                .append($('<div></div>')
                    .addClass('devcard road-building')
                    .css('cursor', 'pointer')
                    .click(() => {
                        data.players[this[PLAYER]].hand[CONST.DEVELOPMENT][CONST.READY][CONST.ROAD_BUILDING] -= 1;
                        this.play(data, CONST.ROAD_BUILDING);
                    })
                );
        }
        if(data.players[this[PLAYER]].hand[CONST.DEVELOPMENT][CONST.READY][CONST.YEAR_OF_PLENTY]) {
            cont
                .append($('<div></div>')
                    .addClass('devcard year-of-plenty')
                    .css('cursor', 'pointer')
                    .click(() => {
                        data.players[this[PLAYER]].hand[CONST.DEVELOPMENT][CONST.READY][CONST.YEAR_OF_PLENTY] -= 1;
                        this.play(data, CONST.YEAR_OF_PLENTY);
                    })
                );
        }
    }

    playKnightShow(data) {
        if(data.players[this[PLAYER]].hand[CONST.DEVELOPMENT][CONST.READY][CONST.KNIGHT] > 0) {
            $('#request-overlay').css('display', 'block');
            $('#request-form')
                .append($('<h2></h2>')
                    .text('Play the knight card?')
                )
                .append($('<button></button>')
                    .text('Yes')
                    .click(() => {
                        this.formHide();
                        this[SOCKET].emit('devcard:play', CONST.KNIGHT, (err, res) => {
                            this[GEN].next([err, [res, true]]);
                        });
                        data.players[this[PLAYER]].hand[CONST.DEVELOPMENT][CONST.READY][CONST.KNIGHT] -= 1;
                    })
                )
                .append($('<button></button>')
                    .text('No')
                    .click(() => {
                        this.formHide();
                        this[GEN].next([null, [data, false]]);
                    })
                );
        } else {
            window.setTimeout(() => {
                this[GEN].next([null, [data, false]]);
            }, 0);
        }
    }

    monopoly() {
        $('#request-overlay').css('display', 'block');
        $('#request-form')
            .append($('<h2></h2>')
                .text('Take all of which resource?')
            )
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'resource-list')
                .append($('<div></div>')
                    .addClass('resource-container')
                    .append($('<div></div>')
                        .addClass('card wool')
                        .css('cursor', 'pointer')
                        .click(() => {
                            this.formHide();
                            this[SOCKET].emit('devcard:monopoly', CONST.WOOL, (err, res) => {
                                this[GEN].next([err, res]);
                            });
                        })
                    )
                    .append($('<div></div>')
                        .addClass('card wheat')
                        .css('cursor', 'pointer')
                        .click(() => {
                            this.formHide();
                            this[SOCKET].emit('devcard:monopoly', CONST.WHEAT, (err, res) => {
                                this[GEN].next([err, res]);
                            });
                        })
                    )
                    .append($('<div></div>')
                        .addClass('card wood')
                        .css('cursor', 'pointer')
                        .click(() => {
                            this.formHide();
                            this[SOCKET].emit('devcard:monopoly', CONST.WOOD, (err, res) => {
                                this[GEN].next([err, res]);
                            });
                        })
                    )
                    .append($('<div></div>')
                        .addClass('card brick')
                        .css('cursor', 'pointer')
                        .click(() => {
                            this.formHide();
                            this[SOCKET].emit('devcard:monopoly', CONST.BRICK, (err, res) => {
                                this[GEN].next([err, res]);
                            });
                        })
                    )
                    .append($('<div></div>')
                        .addClass('card ore')
                        .css('cursor', 'pointer')
                        .click(() => {
                            this.formHide();
                            this[SOCKET].emit('devcard:monopoly', CONST.ORE, (err, res) => {
                                this[GEN].next([err, res]);
                            });
                        })
                    )
                )
            );
    }

    yearOfPlenty() {
        let addResource = (type) => {
            $('#to-take')
                .append($('<div></div>')
                    .attr('data-card-type', type)
                    .addClass(`card ${['wool','wheat','wood','brick','ore'][type]}`)
                    .click(function() {
                        $(this).remove();
                    }));
        };
        $('#request-overlay').css('display', 'block');
        $('#request-form')
            .append($('<h2></h2>')
                .text('Choose 2 resources')
            )
            .append($('<p></p>')
                .text('Chosen')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .append($('<div></div>')
                    .addClass('resource-container')
                    .attr('id', 'to-take')
                )
            )
            .append($('<p></p>')
                .text('Pick')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'resource-list')
                .append($('<div></div>')
                    .addClass('resource-container')
                    .append($('<div></div>')
                        .addClass('card wool')
                        .css('cursor', 'pointer')
                        .click(() => addResource(CONST.WOOL))
                    )
                    .append($('<div></div>')
                        .addClass('card wheat')
                        .css('cursor', 'pointer')
                        .click(() => addResource(CONST.WHEAT))
                    )
                    .append($('<div></div>')
                        .addClass('card wood')
                        .css('cursor', 'pointer')
                        .click(() => addResource(CONST.WOOD))
                    )
                    .append($('<div></div>')
                        .addClass('card brick')
                        .css('cursor', 'pointer')
                        .click(() => addResource(CONST.BRICK))
                    )
                    .append($('<div></div>')
                        .addClass('card ore')
                        .css('cursor', 'pointer')
                        .click(() => addResource(CONST.ORE))
                    )
                )
            )
            .append($('<button></button>')
                .text('Submit')
                .click(() => {
                    let cards = $('#to-take').children('.card');
                    if(cards.length == 2) {
                        let a = cards.eq(0).attr('data-card-type'),
                            b = cards.eq(1).attr('data-card-type');
                        this.formHide();
                        this[SOCKET].emit('devcard:plenty', [a, b], (err, res) => {
                            this[GEN].next([err, res]);
                        });
                    } else {
                        showAlert('Choose two cards', 'error');
                    }
                }));
    }
}
