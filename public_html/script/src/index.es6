'use strict';
require('babel/polyfill');
require('../../style/src/main.scss');

import {default as io} from 'socket.io-client';
let socket = io();
socket.on('error', (e) => {
    console.error(e);
    showAlert(e, 'error');
});

import {CONST} from './const.es6';
import {Build} from './build.es6';
import {Robber} from './robber.es6';
import {Trade} from './trade.es6';
import {DevCard} from './devcard.es6';
import {Catan} from './catan.es6';
import {arrange} from './arrange.es6';
import {showAlert} from './alert.es6';

let robberDiscarding = function*(data, player, robber) {
    let cardCount = data.players[player].hand[CONST.RESOURCE].reduce((p, c) => p + c, 0);
    let discarded = [];
    if(cardCount >= 8) {
        while(discarded.length < Math.floor(cardCount / 2)) {
            discarded = yield robber.discardShow(discarded, data);
        }
    }
    let done;
    [, [data, done]] = yield robber.discard(discarded);
    arrange(data, player);
    return [data, done];
};

let run = (function* () {
    let catan = new Catan(run, socket);
    socket.on('game:won', catan.end);
    let game, player, data;
    while(!game) {
        //Keep going until accepted into a game
        [game, player] = yield catan.chooseGameFormShow();
        let [err, msg] = yield socket.emit('game:join', [game, player], (...params) => run.next(params));
        if(err !== null) {
            //If there was an error, tell the player and reject them
            showAlert(msg, 'error');
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

    while(data.gameState === CONST.OPEN) {
        //While waiting for more players, keep updating the display
        if(data.players[player].turn === 0 && Object.keys(data.players).length >= 3) {
            //The first player gets a button to start the game once enough players join
            catan.startButtonShow();
        }
        data = yield catan.awaitData();
    }
    while(data.gameState === CONST.SETUP) {
        //During setup phase, players take turns building
        if(data.turn === data.players[player].turn) {
            let house;
            [, [data, house]] = yield build.houseShow(data);
            arrange(data, player);
            yield build.roadShow(data, house);
            [, data] = yield catan.turn();
            arrange(data, player);
        } else {
            //Other players wait, while updating the view
            data = yield catan.awaitData();
        }
    }
    while(data.gameState === CONST.PLAY) {
        //Playing phase
        if(data.turn === data.players[player].turn) {
            //On your turn, do a lot
            if(!data.rolled) {
                if(data.players[player].hand[CONST.DEVELOPMENT][CONST.READY][CONST.KNIGHT] > 0) {
                    let playKnight = false;
                    [, [data, playKnight]] = yield devcard.playKnightShow(data);
                    if(playKnight) {
                        [, data] = yield robber.moveShow(data);
                        arrange(data, player);
                        [, data] = yield robber.stealShow(data);
                        arrange(data, player);
                    }
                }
                [,data] = yield catan.roll();
                arrange(data, player);
            }
            if(data.dice[0] + data.dice[1] === 7 && !data.players[player].response.robber) {
                if(data.players[player].response.robber === null) {
                    [, data] = yield robber.start();
                }
                arrange(data, player);
                let done = false;
                if(data.players[player].response.robber === false) {
                    [data, done] = yield* robberDiscarding(data, player, robber);
                    arrange(data, player);
                }
                while(!done) {
                    [data, done] = yield robber.wait();
                    arrange(data, player);
                }
                [, data] = yield robber.moveShow(data);
                arrange(data, player);
                [, data] = yield robber.stealShow(data);
                arrange(data, player);
            }
            //All of these should call nex with an array [data, extra]
            build.houseShow(data);
            build.roadShow(data);
            build.cityShow(data);
            devcard.buyShow(data);
            devcard.playButtonShow(data);
            trade.buttonShow(data);
            catan.turnEndShow();

            let err, d, extra;
            [err, [d, extra]] = yield;
            if(err !== null) {
                showAlert(err, 'error');
            }
            if(d !== null) {
                data = d;
            }
            arrange(data, player);
            switch(extra) {
                case 'trade':
                    [, data] = yield trade.offerShow(data);
                    if(data.trade !== null) {
                        let done = false;
                        while(!done) {
                            data = yield catan.awaitData();
                            done = true;
                            for(let name in data.players) {
                                if(player !== name && data.players[name].response.trade === null) {
                                    done = false;
                                }
                            }
                        }
                        [, data] = yield trade.offersShow(data);
                    }
                    arrange(data, player);
                    break;
                case CONST.YEAR_OF_PLENTY:
                    [, data] = yield devcard.yearOfPlenty();
                    arrange(data, player);
                    break;
                case CONST.MONOPOLY:
                    [, data] = yield devcard.monopoly();
                    arrange(data, player);
                    break;
                case CONST.ROAD_BUILDING:
                    try {
                        let err;
                        [err, [data]] = yield build.roadShow(data, true);
                        arrange(data, player);
                        if(err) {
                            throw err;
                        }
                        [err,[data]] = yield build.roadShow(data, true);
                        arrange(data, player);
                        if(err) {
                            throw err;
                        }
                    } catch(e) {
                        showAlert(e, 'error');
                    }
                    break;
                case 'done':
                    [, data] = yield catan.turn();
                    break;
            }
        } else {
            //Wait until input is needed for robbers or trades
            arrange(data, player);
            if(data.players[player].response.robber === false) {
                [data] = yield* robberDiscarding(data, player, robber);
                arrange(data, player);
            }
            if(data.trade !== null && data.players[player].response.trade === null) {
                [, data] = yield trade.counter(data);
            }
            data = yield catan.awaitData();
        }
    }
})();
run.next();
