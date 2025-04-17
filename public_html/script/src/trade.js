'use strict';

import {CONST} from './const.js';
import {default as $} from 'jquery';
import {adjacent} from './adjacent.js';

const GEN = Symbol(), SOCKET = Symbol(), PLAYER = Symbol();

export class Trade {
    constructor(g, s, p) {
        this[GEN] = g;
        this[SOCKET] = s;
        this[PLAYER] = p;
    }

    hideOverlay() {
        $('#request-overlay')
            .css('display', 'none');
        $('#request-form')
            .html('');
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

    storage(cards) {
        this[SOCKET].emit('trade:storage', cards, (err, res) => {
            this[GEN].next([err, res]);
            this.hideOverlay();
        });
    }
    offer(cards) {
        this[SOCKET].emit('trade:offer', cards, (err, res) => {
            this[GEN].next([err, res]);
        });
        $('#request-form')
            .html('<h1>Waiting for responses...</h1>');
    }
    offerShow(data) {
        let resourceNames = ['wool', 'wheat', 'wood', 'brick', 'ore'];
        let arrangeCards = () => {
            $('#to-keep,#to-give,#to-take').each(function() {
                let spacing = 50;
                while(spacing * $(this).children('.card').length > $(this).width()) {
                    spacing--;
                }
                $(this).children('.card').each(function(i) {
                    $(this).css('left', `${i * spacing}px`);
                });
            });
            if($('#to-give').children('.card').length >= 1 && $('#to-take').children('.card').length >= 1) {
                $('#trade-button')
                    .removeClass('not-clickable');
            } else {
                $('#trade-button')
                    .addClass('not-clickable');
            }

            //Storage validation
            let validCount = 0;
            let cards = [0,0,0,0,0];
            $('#to-give').children('.card')
                .each(function(i) {
                    cards[$(this).attr('data-card-type')]++;
                });
            let needed = [4,4,4,4,4];
            for(let i = 0; i < data.houses.length; i++) {
                for(let j = 0; j < data.houses[i].length; j++) {
                    if(data.houses[i][j][1] === this[PLAYER]) {
                        let port = adjacent(i, j, 'house', 'port');
                        if(port !== null) {
                            if(data.ports[port] === CONST.OTHER) {
                                for(let k = 0; k < 5; k++) {
                                    needed[k] = Math.min(3, needed[k]);
                                }
                            } else {
                                needed[data.ports[port]] = 2;
                            }
                        }
                    }
                }
            }
            for(let i = 0; i < 5; i++) {
                if(cards[i] % needed[i] === 0) {
                    validCount += cards[i] / needed[i];
                } else {
                    validCount = false;
                    break;
                }
            }
            if(validCount && validCount === $('#to-take').children('.card').length) {
                $('#storage-button')
                    .removeClass('not-clickable');
            } else {
                $('#storage-button')
                    .addClass('not-clickable');
            }
        };
        let addToTake = (res) => () => {
            $('#to-take')
                .append($('<div></div>')
                    .addClass(`card ${resourceNames[res]}`)
                    .attr('data-card-type', res)
                    .css('cursor', 'pointer')
                    .click(function() {
                        $(this).remove();
                        arrangeCards();
                    })
                );
            arrangeCards();
        };

        $('#request-overlay').css('display', 'block');
        $('#request-form')
            .append($('<h2></h2>')
                .text('Trade')
            )
            .append($('<p></p>')
                .text('To give')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'to-give')
            )
            .append($('<p></p>')
                .text('Your cards')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'to-keep')
            )
            .append($('<p></p>')
                .text('To take')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'to-take')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'to-choose')
                .append($('<div></div>')
                    .addClass('resource-container')
                    .append($('<div></div>')
                        .addClass('card wool')
                        .css('cursor', 'pointer')
                        .click(addToTake(CONST.WOOL))
                    )
                    .append($('<div></div>')
                        .addClass('card wheat')
                        .css('cursor', 'pointer')
                        .click(addToTake(CONST.WHEAT))
                    )
                    .append($('<div></div>')
                        .addClass('card wood')
                        .css('cursor', 'pointer')
                        .click(addToTake(CONST.WOOD))
                    )
                    .append($('<div></div>')
                        .addClass('card brick')
                        .css('cursor', 'pointer')
                        .click(addToTake(CONST.BRICK))
                    )
                    .append($('<div></div>')
                        .addClass('card ore')
                        .css('cursor', 'pointer')
                        .click(addToTake(CONST.ORE))
                    )
                )
            )
            .append($('<button></button>')
                .text('Trade')
                .attr('id', 'trade-button')
                .click(() => {
                    let cards = {
                        give: [0,0,0,0,0],
                        get: [0,0,0,0,0]
                    };
                    $('#to-give').children('.card')
                        .each(function(i) {
                            cards.give[$(this).attr('data-card-type')]++;
                        });
                    $('#to-take').children('.card')
                        .each(function(i) {
                            cards.get[$(this).attr('data-card-type')]++;
                        });
                    this.offer(cards);
                })
            )
            .append($('<button></button>')
                .text('Trade with storage')
                .attr('id', 'storage-button')
                .click(() => {
                    let cards = {
                        give: [0,0,0,0,0],
                        get: [0,0,0,0,0]
                    };
                    $('#to-give').children('.card')
                        .each(function(i) {
                            cards.give[$(this).attr('data-card-type')]++;
                        });
                    $('#to-take').children('.card')
                        .each(function(i) {
                            cards.get[$(this).attr('data-card-type')]++;
                        });
                    this.storage(cards);
                })
            )
            .append($('<button></button>')
                .text('Cancel')
                .click(() => {
                    this.hideOverlay();
                    this[GEN].next([null, data]);
                })
            );

            let hand = new Array(...data.players[this[PLAYER]].hand[CONST.RESOURCE]);
            let give = $('#to-give');
            let keep = $('#to-keep');

            let moveToGive, moveToKeep;
            moveToKeep = function() {
                $(this).detach()
                    .appendTo(keep)
                    .off('click')
                    .click(moveToGive);
                arrangeCards();
            };
            moveToGive = function() {
                $(this).detach()
                    .appendTo(give)
                    .off('click')
                    .click(moveToKeep);
                arrangeCards();
            };
            for(let i = 0; i < 5; i++) {
                for(let j = 0; j < hand[i]; j++) {
                    keep
                        .append($('<div></div>')
                            .addClass(`card ${resourceNames[i]}`)
                            .css('cursor', 'pointer')
                            .attr('data-card-type', i)
                            .click(moveToGive)
                        );
                }
            }
            arrangeCards();
    }

    respond(offer) {
        this[SOCKET].emit('trade:respond', offer, (err, res) => {
            this[GEN].next([err, res]);
        });
        this.hideOverlay();
    }
    counterOfferShow(data) {
        let resourceNames = ['wool', 'wheat', 'wood', 'brick', 'ore'];
        let arrangeCards = () => {
            $('#to-keep,#to-give,#to-take').each(function() {
                let spacing = 50;
                while(spacing * $(this).children('.card').length > $(this).width()) {
                    spacing--;
                }
                $(this).children('.card').each(function(i) {
                    $(this).css('left', `${i * spacing}px`);
                });
            });
            if($('#to-give').children('.card').length >= 1 && $('#to-take').children('.card').length >= 1) {
                $('#trade-button')
                    .removeClass('not-clickable');
            } else {
                $('#trade-button')
                    .addClass('not-clickable');
            }
        };

        let addToTake = (res) => () => {
            $('#to-take')
                .append($('<div></div>')
                    .addClass(`card ${resourceNames[res]}`)
                    .attr('data-card-type', res)
                    .css('cursor', 'pointer')
                    .click(function() {
                        $(this).remove();
                        arrangeCards();
                    })
                );
            arrangeCards();
        };

        $('#request-overlay').css('display', 'block');
        $('#request-form')
            .html('')
            .css('display', 'block')
            .append($('<h2></h2>')
                .text('Trade')
            )
            .append($('<p></p>')
                .text('To give')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'to-give')
            )
            .append($('<p></p>')
                .text('Your cards')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'to-keep')
            )
            .append($('<p></p>')
                .text('To take')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'to-take')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'to-choose')
                .append($('<div></div>')
                    .addClass('resource-container')
                    .append($('<div></div>')
                        .addClass('card wool')
                        .css('cursor', 'pointer')
                        .click(addToTake(CONST.WOOL))
                    )
                    .append($('<div></div>')
                        .addClass('card wheat')
                        .css('cursor', 'pointer')
                        .click(addToTake(CONST.WHEAT))
                    )
                    .append($('<div></div>')
                        .addClass('card wood')
                        .css('cursor', 'pointer')
                        .click(addToTake(CONST.WOOD))
                    )
                    .append($('<div></div>')
                        .addClass('card brick')
                        .css('cursor', 'pointer')
                        .click(addToTake(CONST.BRICK))
                    )
                    .append($('<div></div>')
                        .addClass('card ore')
                        .css('cursor', 'pointer')
                        .click(addToTake(CONST.ORE))
                    )
                )
            )
            .append($('<button></button>')
                .text('Send offer')
                .attr('id', 'trade-button')
                .click(() => {
                    let cards = {
                        give: [0,0,0,0,0],
                        get: [0,0,0,0,0]
                    };
                    $('#to-give').children('.card')
                        .each(function(i) {
                            cards.get[$(this).attr('data-card-type')]++;
                        });
                    $('#to-take').children('.card')
                        .each(function(i) {
                            cards.give[$(this).attr('data-card-type')]++;
                        });
                    this.respond(cards);
                })
            )
            .append($('<button></button>')
                .text('Cancel (reject)')
                .click(() => {
                    this.respond({response: false});
                })
            );

            let hand = new Array(...data.players[this[PLAYER]].hand[CONST.RESOURCE]);
            let give = $('#to-give');
            let keep = $('#to-keep');
            let take = $('#to-take');

            let moveToGive, moveToKeep;
            moveToKeep = function() {
                $(this).detach()
                    .appendTo(keep)
                    .off('click')
                    .click(moveToGive);
                arrangeCards();
            };
            moveToGive = function() {
                $(this).detach()
                    .appendTo(give)
                    .off('click')
                    .click(moveToKeep);
                arrangeCards();
            };
            for(let i = 0; i < 5; i++) {
                for(let j = 0; j < data.trade.get[i]; j++) {
                    if(hand[i]) {
                        give
                            .append($('<div></div>')
                                .addClass(`card ${resourceNames[i]}`)
                                .css('cursor', 'pointer')
                                .attr('data-card-type', i)
                                .click(moveToKeep)
                            );
                        hand[i]--;
                    }
                }
            }
            for(let i = 0; i < 5; i++) {
                for(let j = 0; j < data.trade.give[i]; j++) {
                    take
                        .append($('<div></div>')
                            .addClass(`card ${resourceNames[i]}`)
                            .css('cursor', 'pointer')
                            .attr('data-card-type', i)
                            .click(function() {
                                $(this).remove();
                                arrangeCards();
                            })
                        );
                }
            }
            for(let i = 0; i < hand.length; i++) {
                for(let j = 0; j < hand[i]; j++) {
                    keep
                        .append($('<div></div>')
                            .addClass(`card ${resourceNames[i]}`)
                            .css('cursor', 'pointer')
                            .attr('data-card-type', i)
                            .click(moveToGive)
                        );
                }
            }
            arrangeCards();
    }
    counter(data) {
        let arrangeCards = () => {
            $('#to-give,#to-take').each(function() {
                let spacing = 50;
                while(spacing * $(this).children('.card').length > $(this).width()) {
                    spacing--;
                }
                $(this).children('.card').each(function(i) {
                    $(this).css('left', `${i * spacing}px`);
                });
            });
        };
        $('#request-overlay').css('display', 'block');
        $('#request-form')
            .append($('<h2></h2>')
                .text(`Trade offer from ${data.trade.player}`)
            )
            .append($('<p></p>')
                .text('You give')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'to-give')
            )
            .append($('<p></p>')
                .text('You get')
            )
            .append($('<hr>'))
            .append($('<div></div>')
                .addClass('card-container')
                .attr('id', 'to-take')
            )
            .append($('<button></button>')
                .text('Accept')
                .attr('id', 'accept-button')
                .click(() => {
                    this.respond({response: true});
                })
            )
            .append($('<button></button>')
                .text('Reject')
                .click(() => {
                    this.respond({response: false});
                })
            )
            .append($('<button></button>')
                .text('Make a counter offer')
                .click(() => {
                    this.counterOfferShow(data);
                })
            );
            let take = $('#to-take');
            let give = $('#to-give');
            let resourceNames = ['wool', 'wheat', 'wood', 'brick', 'ore'];
            for(let i = 0; i < 5; i++) {
                if(data.trade.get[i] > data.players[this[PLAYER]].hand[CONST.RESOURCE][i]) {
                    $('#accept-button')
                        .addClass('not-clickable');
                }
                for(let j = 0; j < data.trade.get[i]; j++) {
                    give
                        .append($('<div></div>')
                            .addClass(`card ${resourceNames[i]}`)
                        );
                }
                for(let j = 0; j < data.trade.give[i]; j++) {
                    take
                        .append($('<div></div>')
                            .addClass(`card ${resourceNames[i]}`)
                        );
                }
            }
            arrangeCards();
    }
    reject() {
        this[SOCKET].emit('trade:reject', null, (err, res) => {
            this[GEN].next([err, res]);
        });
        this.hideOverlay();
    }
    accept(name) {
        this[SOCKET].emit('trade:accept', name, (err, res) => {
            this[GEN].next([err, res]);
        });
        this.hideOverlay();
    }

    offersShow(data) {
        let resourceNames = ['wool', 'wheat', 'wood', 'brick', 'ore'];
        $('#request-overlay').css('display', 'block');
        let form = $('#request-form')
            .html('')
            .append($('<h2></h2>')
                .text('Choose an offer')
            );
        for(let name in data.players) {
            if(name !== this[PLAYER]) {
                if(data.players[name].response.trade.response === false) {
                    form
                        .append($('<div></div>')
                            .addClass('trade-offer')
                            .append($('<h2></h2>')
                                .text(`${name} rejected your offer`)
                            )
                        );
                } else if(data.players[name].response.trade.response === true) {
                    form
                        .append($('<div></div>')
                            .addClass('trade-offer')
                            .append($('<h2></h2>')
                                .text(`${name} accepted your offer`)
                            )
                            .append($('<div></div>')
                                .addClass('trade-left')
                                .append($('<p></p>')
                                    .text('Give')
                                )
                                .append($('<div></div>')
                                    .addClass('card-container small')
                                    .attr('id', `for-${name}`)
                                )
                                .append($('<p></p>')
                                    .text('Get')
                                )
                                .append($('<div></div>')
                                    .addClass('card-container small')
                                    .attr('id', `from-${name}`)
                                )
                            )
                            .append($('<button></button>')
                                .text('Accept')
                                .click(() => {
                                    this.accept(name);
                                })
                            )
                        );
                        let give = $(`#for-${name}`);
                        let get = $(`#from-${name}`);
                        for(let i = 0; i < 5; i++) {
                            for(let j = 0; j < data.trade.give[i]; j++) {
                                give
                                    .append($('<div></div>')
                                    .addClass(`card ${resourceNames[i]}`)
                                );
                            }
                            for(let j = 0; j < data.trade.get[i]; j++) {
                                get
                                    .append($('<div></div>')
                                    .addClass(`card ${resourceNames[i]}`)
                                );
                            }
                        }
                } else {
                    form
                        .append($('<div></div>')
                            .addClass('trade-offer')
                            .append($('<h2></h2>')
                                .text(`${name} offers:`)
                            )
                            .append($('<div></div>')
                                .addClass('trade-left')
                                .append($('<p></p>')
                                    .text('Give')
                                )
                                .append($('<div></div>')
                                    .addClass('card-container small')
                                    .attr('id', `for-${name}`)
                                )
                                .append($('<p></p>')
                                    .text('Get')
                                )
                                .append($('<div></div>')
                                    .addClass('card-container small')
                                    .attr('id', `from-${name}`)
                                )
                            )
                            .append($('<button></button>')
                                .text('Accept')
                                .click(() => {
                                    this.accept(name);
                                })
                            )
                        );
                        let give = $(`#for-${name}`);
                        let get = $(`#from-${name}`);
                        for(let i = 0; i < 5; i++) {
                            for(let j = 0; j < data.players[name].response.trade.give[i]; j++) {
                                give
                                    .append($('<div></div>')
                                    .addClass(`card ${resourceNames[i]}`)
                                );
                            }
                            for(let j = 0; j < data.players[name].response.trade.get[i]; j++) {
                                get
                                    .append($('<div></div>')
                                    .addClass(`card ${resourceNames[i]}`)
                                );
                            }
                        }
                }
            }
        }
        form.append($('<button></button>')
            .text('Accept none')
            .click(() => {
                this.reject();
            })
        );
        $('.card-container').each(function() {
            let spacing = 25;
            while(spacing * $(this).children('.card').length > $(this).width()) {
                spacing--;
            }
            $(this).children('.card').each(function(i) {
                $(this).css('left', `${i * spacing}px`);
            });
        });
    }
}
