'use strict';

import {CONST} from './const.js';
import {adjacent} from './adjacent.js';
import {default as $} from 'jquery';

const GEN = Symbol(), SOCKET = Symbol(), PLAYER = Symbol();

export class Build {
    constructor(g, s, p) {
        this[GEN] = g;
        this[SOCKET] = s;
        this[PLAYER] = p;
    }

    house(i, j, data) {
        this[SOCKET].emit('build:house', [i, j], (err, res) => {
            this[GEN].next([err, res]);
        });
        data.houses[i][j] = [1, this[PLAYER]];
        this.houseHide(data);
    }
    houseShow(data) {
        //Count houses, don't show if there are 5
        for(let i = 0, c = 0; i < data.houses.length; i++) {
            for(let j = 0; j < data.houses[i].length; j++) {
                if(data.houses[i][j][0] === 1 && data.houses[i][j][1] === this[PLAYER]) {
                    if(++c === 5) {
                        return;
                    }
                }
            }
        }
        for(let i = 0; i < data.houses.length; i++) {
            for(let j = 0; j < data.houses[i].length; j++) {
                //Check if each house should be buildable
                if(data.houses[i][j][0] === 0) { //If the house is not already built
                    //Count available resources
                    let hand = data.players[this[PLAYER]].hand[CONST.RESOURCE];
                    let hasResources = (hand[CONST.WOOL] && hand[CONST.WOOD] && hand[CONST.BRICK] && hand[CONST.WHEAT]);
                    let adj_road = adjacent(i, j, 'house', 'road');
                    let adj_house = adjacent(i, j, 'house', 'house');
                    //Check for the adjacent roads
                    let n;
                    for(n = 0; n < adj_road.length; n++) {
                        if(data.roads[adj_road[n][0]][adj_road[n][1]] === this[PLAYER]) {
                            break;
                        }
                    }
                    //Allow if the player has resources and there is a road nearby
                    //Or if in setup mode a house can be built anywhere
                    if(data.gameState === CONST.SETUP || (n !== adj_road.length && hasResources)) {
                        //Check for adjacent houses
                        for(n = 0; n < adj_house.length; n++) {
                            if(data.houses[adj_house[n][0]][adj_house[n][1]][0]) {
                                break;
                            }
                        }
                        //Don't allow if there is a house too close
                        if(n === adj_house.length) {
                            $('.house_row').eq(i).children('.house').eq(j)
                                .addClass('buildable')
                                .off('click')
                                .click(() => {
                                    this.house(i, j, data);
                                });
                        }
                    }
                }
            }
        }
    }
    houseHide(data) {
        for(let i = 0; i < data.houses.length; i++) {
            for(let j = 0; j < data.houses[i].length; j++) {
                //Hide each house that's not built and remove the onclick handler
                let house = $('.house_row').eq(i).children('.house').eq(j)
                    .off('click')
                    .removeClass('buildable');
            }
        }
    }

    road(i, j, free, data) {
        this[SOCKET].emit('build:road', [i, j, free], (err, res) => {
            this[GEN].next([err, res]);
        });
        data.roads[i][j] = this[PLAYER];
        this.roadHide(data);
    }
    roadShow(data, options) {
        let intersection, free;
        if(Array.isArray(options)) {
            //If options is an array, it is setup phase
            intersection = options;
            free = true;
        } else {
            //Otherwise, the only option is if it is free
            free = !!options;
        }
        //Count roads, don't show if there are 15
        for(let i = 0, c = 0; i < data.roads.length; i++) {
            for(let j = 0; j < data.roads[i].length; j++) {
                if(data.roads[i][j] === this[PLAYER]) {
                    if(++c === 15) {
                        if(free) {
                            //Continue automatically if it's road building played
                            window.setTimeout(() => {
                                this[GEN].next(['You have too many roads', [data, null]]);
                            }, 0);
                        }
                        return;
                    }
                }
            }
        }
        let hand = data.players[this[PLAYER]].hand[CONST.RESOURCE];
        if(free || (hand[CONST.WOOD] && hand[CONST.BRICK])) {
            //If the player has enough resources
            if(intersection) {
                //If an intersection is being forced, only allow houses around there
                let roads = adjacent(intersection[0], intersection[1], "house", "road");
                for(let [i, j] of roads) {
                    if(data.roads[i][j] === -1) {
                        $('.road_row').eq(i).children('.road').eq(j)
                            .addClass('buildable')
                            .off('click')
                            .click(() => {
                                this.road(i, j, free, data);
                            });
                    }
                }
            } else {
                for(let i = 0; i < data.roads.length; i++) {
                    for(let j = 0; j < data.roads[i].length; j++) {
                        //Otherwise, get all roads that aren't yet built
                        if(data.roads[i][j] === -1) {
                            let roads = adjacent(i, j, "road", "road");
                            let n;
                            for(n = 0; n < roads.length; n++) {
                                if(data.roads[roads[n][0]][roads[n][1]] === this[PLAYER]) {
                                    break;
                                }
                            }
                            if(n !== roads.length) {
                                $('.road_row').eq(i).children('.road').eq(j)
                                    .addClass('buildable')
                                    .off('click')
                                    .click(() => {
                                        this.road(i, j, free, data);
                                    });
                            }
                        }
                    }
                }
            }
        }
    }
    roadHide(data) {
        for(let i = 0; i < data.roads.length; i++) {
            for(let j = 0; j < data.roads[j].length; j++) {
                //Hide each road that's not built and remove the onclick handler
                let road = $('.road_row').eq(i).children('.road').eq(j)
                    .off('click')
                    .removeClass('buildable');
            }
        }
    }

    city(i, j, data) {
        this[SOCKET].emit('build:city', [i, j], (err, res) => {
            this[GEN].next([err, res]);
        });
        data.houses[i][j][0] = 2;
        this.cityHide(data);
    }
    cityShow(data) {
        //Count houses, don't show if there are 5
        for(let i = 0, c = 0; i < data.houses.length; i++) {
            for(let j = 0; j < data.houses[i].length; j++) {
                if(data.houses[i][j][0] === 2 && data.houses[i][j][1] === this[PLAYER]) {
                    if(++c === 4) {
                        return;
                    }
                }
            }
        }
        if(data.players[this[PLAYER]].hand[CONST.RESOURCE][CONST.ORE] >= 3 && data.players[this[PLAYER]].hand[CONST.RESOURCE][CONST.WHEAT] >= 2) {
            for(let i = 0; i < data.houses.length; i++) {
                for(let j = 0; j < data.houses[i].length; j++) {
                    if(data.houses[i][j][0] === 1 && data.houses[i][j][1] === this[PLAYER]) {
                        $(".house_row").eq(i).children(".house").eq(j)
                            .addClass('buildable city')
                            .click(() => {
                                this.city(i, j, data);
                            });
                    }
                }
            }
        }
    }
    cityHide(data) {
        for(let i = 0; i < data.houses.length; i++) {
            for(let j = 0; j < data.houses[i].length; j++) {
                $(".house_row").eq(i).children(".house").eq(j)
                    .off('click')
                    .removeClass('buildable');
            }
        }
    }
}
