'use strict';
require('babel/polyfill');
require('../../style/main.scss');

import {default as io} from 'socket.io-client';
let socket = io();

import {CONST} from './const.es6';
import {Build} from './build.es6';
import {Robber} from './build.es6';
import {Trade} from './trade.es6';
import {DevCard} from './devcard.es6';
import {Catan} from './catan.es6';
import {arrange} from './arrange.es6';

let run = (function* () {
    let catan = new Catan(run, socket);
    let game, player, data;
    while(!game) {
        //Keep going until accepted into a game
        [game, player] = yield catan.chooseGameForm();
        let [err, msg] = yield socket.emit('game:join', [game, player], (...params) => run.next(params));
        if(err !== null) {
            //If there was an error, tell the player and reject them
            catan.error(msg);
            game = undefined;
        } else {
            //Accepted into a game
            data = msg;
            while(data.players[player].color === '') {
                //Keep going until an unchosen colour is selected
                data = yield catan.chooseColorShow(data);
            }
            arrange(data, player);
        }
    }

    //Initialize other functions with the static data
    let build = new Build(run, socket, player);
    let robber = new Robber(run, socket, player);
    let trade = new Trade(run, socket, player);
    let devcard = new DevCard(run, socket, player);

    while(data.gameState == CONST.OPEN) {
        //While waiting for more players, keep updating the display
        if(data.players[player].turn === 0 && Object.keys(data.players).length >= 3) {
            //The first player gets a button to start the game once enough players join
            catan.startButton();
        }
        data = yield catan.awaitData();
    }
    while(data.gameState == CONST.SETUP) {
        //During setup phase, players take turns building
        if(data.turn == data.players[player].turn) {
            let house;
            [,[data, house]] = yield build.house.show(data);
            arrange(data, player);
            yield build.road.show(data, house);
            [, data] = yield catan.turn();
            arrange(data, player);
        } else {
            //Other players wait, while updating the view
            data = yield catan.awaitData();
        }
    }
    while(data.gameState == CONST.PLAY) {
        //Playing phase
        if(data.turn == data.players[player].turn) {
            //On your turn, do a lot
            if(!data.rolled) {
                if(data.players[player].hand[CONST.DEVELOPMENT][CONST.KNIGHT]) {
                    if(yield catan.playKnight.show()) {
                        data = yield robber.move.show(data);
                        arrange(data, player);
                        data = yield robber.steal.show(data);
                        arrange(data, player);
                    }
                }
                catan.roll();
                data = yield catan.awaitData();
                if(data.dice[0] + data.dice[1] == 7) {
                    data = yield robber.start();
                    let done = false;
                    let cardCount = data.players[player].hand[CONST.RESOURCE].reduce((p, c) => p + c, 0);
                    let discarded = [];
                    if(cardCount >= 8) {
                        let discardCount = Math.floor(cardCount / 2);
                        let toDiscard = discardCount - 0;
                        while(toDiscard) {
                            discarded.concat(yield robber.discard.show(toDiscard, data));
                            toDiscard = discardCount - discarded.length;
                        }
                    }
                    [data, done] = yield robber.discard(discarded);
                    arrange(data, player);
                    while(!done) {
                        [data, done] = yield robber.wait();
                    }
                    arrange(data, player);
                    data = yield robber.move.show(data);
                    arrange(data, player);
                    yield robber.steal.show(data);
                    arrange(data, player);
                }
            }
            //All of these should call nex with an array [data, extra]
            build.house.show(data);
            build.road.show(data);
            build.city.show(data);
            devcard.buy.show(data);

            devcard.play.show(data);
            trade.button.show(data);
            catan.turn.show();

            let extra;
            [data, extra] = yield;
            switch(extra) {
                case 'trade':
                    yield trade.offer();
                    let responses = [];
                    while(responses.length < Object.keys(data.players).length - 1) {
                        responses.push(yield trade.awaitResponses());
                    }
                    let which = yield trade.displayOffers(responses);
                    if(which === false) {
                        yield trade.reject();
                    } else {
                        data = yield trade.accept([responses, which]);
                        arrange(data, player);
                    }
                    break;
                case 'yearofplenty':
                    data = yield devcard.yearOfPlenty();
                    arrange(data, player);
                    break;
                case 'monopoly':
                    data = yield devcard.monopoly();
                    arrange(data, player);
                    break;
                case 'roadbuilding':
                    [data] = yield build.road.show(data, true);
                    arrange(data, player);
                    [data] = yield build.road.show(data, true);
                    arrange(data, player);
                    break;
                case 'done':
                    data = yield catan.turn();
                    break;
            }
        } else {
            //When not your turn, just wait for news
            if(data.rolled) {
                data = yield catan.awaitData();
                //If the dice have been rolled, wait for trades for input
                if(data.trade != []) {
                    trade.respond(yield trade.counter());
                }
            } else {
                data = yield catan.awaitData();
                //If dice haven't been rolled, wait for robbers for input
                if(data.players[player].response.robber === false) {
                    if(data.dice[0] + data.dice[1] == 7) {
                        let cardCount = data.players[player].hand[CONST.RESOURCE].reduce((p, c) => p + c, 0);
                        let discarded = [];
                        if(cardCount >= 8) {
                            let discardCount = Math.floor(cardCount / 2);
                            let toDiscard = discardCount - 0;
                            while(toDiscard) {
                                discarded.concat(yield robber.discard.show(discarded, data));
                                toDiscard = discardCount - discarded.length;
                            }
                        }
                        [data] = yield robber.discard(discarded);
                        arrange(data, player);
                    }
                }
            }
        }
    }
})();
run.next();
