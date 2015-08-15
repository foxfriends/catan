'use strict';
require('babel/polyfill');
let io = require('socket.io-client');
let socket = io();

const CONST = require('./const');

let run = (function* () {
    let Catan = require('./catan')(this, socket);
    let game, player, data;
    while(!game) {
        //Keep going until accepted into a game
        [game, player] = yield Catan.chooseGameForm();
        let [err, msg] = yield socket.emit('game:join', [game, player], this.next);
        if(err !== null) {
            //If there was an error, tell the player and reject them
            Catan.error(msg);
            game = undefined;
        } else {
            //Accepted into a game
            data = msg;
            while(!data.players[player].color) {
                //Keep going until an unchosen colour is selected
                [err, data] = yield Catan.chooseColor(data);
            }
            Catan.arrange(data);
        }
    }
    //Initialize other functions with the static data
    let Build = require('./build')(this, socket, player);
    let Robber = require('./robber')(this, socket, player);
    let Trade = require('./trade')(this, socket, player);
    let DevCard = require('./devcard')(this, socket, player);
    while(data.gameState == CONST.OPEN) {
        //While waiting for more players, keep updating the display
        if(data.players[player].turn === 0 && Object.keys(data.players).length >= 3) {
            //The first player gets a button to start the game once enough players join
            Catan.startButton();
        }
        data = yield Catan.awaitData();
    }
    while(data.gameState == CONST.SETUP) {
        //During setup phase, players take turns building
        if(data.turn == data.players[player].turn) {
            let house;
            [data, house] = yield Build.house.show(data);
            Catan.arrange(data);
            yield Build.road.show(data, house);
            data = yield Catan.turn();
        } else {
            //Other players wait, while updating the view
            data = yield Catan.awaitData();
        }
    }
    while(data.gameState == CONST.PLAY) {
        //Playing phase
        if(data.turn == data.players[player].turn) {
            //On your turn, do a lot
            if(!data.rolled) {
                if(data.players[player].hand[CONST.DEVELOPMENT][CONST.KNIGHT]) {
                    if(yield Catan.playKnight.show()) {
                        data = yield Robber.move(data);
                        Catan.arrange(data);
                        data = yield Robber.steal(data);
                        Catan.arrange(data);
                    }
                }
                Catan.roll();
                data = yield Catan.awaitData();
                if(data.dice[0] + data.dice[1] == 7) {
                    let cardCount = data.players[player].hand.reduce((p, c) => p + c, 0);
                    let discarded = [];
                    if(cardCount >= 8) {
                        let toDiscard = Math.floor(cardCount / 2);
                        while(toDiscard) {
                            discarded.concat(yield Robber.discard(data, toDiscard));
                            toDiscard -= discarded.length;
                        }
                    }
                    let done;
                    [data, done] = yield socket.emit('robber:discard', [discarded, player], this.next);
                    while(!done) {
                        [data, done] = yield Robber.wait();
                    }
                    Catan.arrange(data);
                    data = yield Robber.move(data);
                    Catan.arrange(data);
                    yield Robber.steal(data);
                    Catan.arrange(data);
                }
            }
            //All of these should call nex with an array [data, extra]
            Build.house.show(data);
            Build.road.show(data);
            Build.city.show(data);
            DevCard.buy.show(data);

            DevCard.play.show(data);
            Trade.button.show(data);
            Catan.turn.show();

            let extra;
            [data, extra] = yield;
            switch(extra) {
                case 'trade':
                    yield Trade.offer();
                    let responses = [];
                    while(responses.length < Object.keys(data.players).length - 1) {
                        responses.push(yield Trade.awaitResponses());
                    }
                    let which = yield Trade.displayOffers(responses);
                    if(which === false) {
                        yield Trade.reject();
                    } else {
                        data = yield Trade.accept([responses, which]);
                        Catan.arrange(data);
                    }
                    break;
                case 'yearofplenty':
                    data = yield DevCard.yearOfPlenty();
                    Catan.arrange(data);
                    break;
                case 'monopoly':
                    data = yield DevCard.monopoly();
                    Catan.arrange(data);
                    break;
                case 'roadbuilding':
                    [data] = yield Build.road.show(data, true);
                    Catan.arrange(data);
                    [data] = yield Build.road.show(data, true);
                    Catan.arrange(data);
                    break;
                case 'done':
                    data = yield Catan.turn();
                    break;
            }
        } else {
            //When not your turn, just wait for news
            if(data.rolled) {
                data = yield Catan.awaitData();
                //If the dice have been rolled, wait for trades for input
                if(data.trade != []) {
                    Trade.respond(yield Trade.counter());
                }
            } else {
                data = yield Catan.awaitData();
                //If dice haven't been rolled, wait for robbers for input
                if(data.rolled) {
                    if(data.dice[0] + data.dice[1] == 7) {
                        let cardCount = data.players[player].hand.reduce((p, c) => p + c, 0);
                        let discarded = [];
                        if(cardCount >= 8) {
                            let toDiscard = Math.floor(cardCount / 2);
                            while(toDiscard) {
                                discarded.concat(yield Robber.discard(data, toDiscard));
                                toDiscard -= discarded.length;
                            }
                        }
                        [data] = yield socket.emit('robber:discard', [discarded, player], this.next);
                        Catan.arrange(data);
                    }
                }
            }
        }
    }
})();
run.next();
