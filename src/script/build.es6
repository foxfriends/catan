'use strict';

const CONST = require('./const');
let adjacent = require('./adjacent');

module.exports = (gen, socket, player) => {
    let Build = {};
    Build.house = (i, j, data) => {
        socket.emit('build:house', [i, j, player], gen.next);
        Build.house.hide(data);
    };
    Build.house.show = (data) => {
        for(let i = 0; i < data.houses.length; i++) {
            for(let j = 0; j < data.houses.length; j++) {
                //Check if each house should be buildable
                let house = document.getElementsByClassName('house_row')[i].getElementsByClassName('house')[j];
                if(data.houses[i][j][0] === 0) { //If the house is not already built
                    //Count available resources
                    let hand = data.players[player].hand[CONST.RESOURCE];
                    let hasResources = (hand[CONST.WOOL] && hand[CONST.WOOD] && hand[CONST.BRICK] && hand[CONST.WHEAT]);
                    let adj_road = adjacent(i, j, 'house', 'road');
                    let adj_house = adjacent(i, j, 'house', 'house');
                    //Check for the adjacent roads
                    let n;
                    for(n = 0; n < adj_road.length; n++) {
                        if(data.roads[adj_road[n][0]][adj_road[n][1]] == data.players[player].turn) {
                            break;
                        }
                    }
                    //Allow if the player has resources and there is a road nearby
                    //Or if in setup mode a house can be built anywhere
                    if(data.gameState == CONST.SETUP || (n != adj_road.length && hasResources)) {
                        //Check for adjacent houses
                        for(n = 0; n < adj_house.length; n++) {
                            if(data.houses[adj_house[n][0]][adj_house[n][1]][0]) {
                                break;
                            }
                        }
                        //Don't allow if there is a house too close
                        if(n == adj_house.length) {
                            house.style.backgroundColor = 'black';
                            house.style.opacity = 0.5;
                            house.style.cursor = 'pointer';
                            house.onclick = () => {Build.house(i, j, data);};
                        }
                    }
                }
            }
        }
    };
    Build.house.hide = (data) => {
        for(let i = 0; i < data.houses.length; i++) {
            for(let j = 0; j < data.houses.length; j++) {
                //Hide each house that's not built and remove the onclick handler
                let house = document.getElementsByClassName('house_row')[i].getElementsByClassName('house')[j];
                if(data.houses[i][j][0] === 0) {
                    house.style.opacity = 0;
                    house.style.cursor = 'default';
                }
                house.onclick = undefined;
            }
        }
    };

    Build.road = (i, j, free, data) => {
        socket.emit('build:road', [i, j, player, free], gen.next);
        Build.road.hide(data);
    };
    Build.road.show = (data, options) => {
        let intersection, free;
        if(Array.isArray(options)) {
            //If options is an array, it is setup phase
            intersection = options;
            free = true;
        } else {
            //Otherwise, the only option is if it is free
            free = !!options;
        }
        let hand = data.players[player].hand[CONST.RESOURCE];
        if(free || (hand[CONST.WOOD] && hand[CONST.BRICK])) {
            //If the player has enough resources
            if(intersection) {
                //If an intersection is being forced, only allow houses around there
                let roads = adjacent(intersection[0], intersection[1], "house", "road");
                for(let [i, j] of roads) {
                    let road = document.getElementsByClassName("road_row")[i].getElementsByClassName("road")[j];
                    if(data.roads[i][j] == -1) {
                        road.style.backgroundColor = "black";
                        road.style.opacity = 0.5;
                        road.style.cursor = "pointer";
                        road.onclick = () => {Build.road(i, j, free, data);};
                    }
                }
            } else {
                for(let i = 0; i < data.roads.length; i++) {
                    for(let j = 0; j < data.roads[i].length; j++) {
                        //Otherwise, get all roads that aren't yet built
                        if(data.roads[i][j] == -1) {
                            let road = document.getElementsByClassName("road_row")[i].getElementsByClassName("road")[j];
                            let roads = adjacent(i, j, "road", "road");
                            let n;
                            for(n = 0; n < roads.length; n++) {
                                if(data.roads[roads[n][0]][roads[n][1]] != -1) {
                                    break;
                                }
                            }
                            if(n != roads.length) {
                                road.style.backgroundColor = "black";
                                road.style.opacity = 0.5;
                                road.style.cursor = "pointer";
                                road.onclick = () => {Build.road(i, j, data);};
                            }
                        }
                    }
                }
            }
        }
    };
    Build.road.hide = (data) => {
        for(let i = 0; i < data.roads.length; i++) {
            for(let j = 0; j < data.roads.length; j++) {
                //Hide each road that's not built and remove the onclick handler
                let road = document.getElementsByClassName('road_row')[i].getElementsByClassName('road')[j];
                if(data.roads[i][j] == -1) {
                    road.style.opacity = 0;
                    road.style.cursor = 'default';
                }
                road.onclick = undefined;
            }
        }
    };

    Build.city = (i, j, data) => {
        socket.emit('build:city', [i, j, player], gen.next);
        Build.city.hide(data);
    };
    Build.city.show = (data) => {
        if(data.players[player].hand[CONST.RESOURCE][CONST.ORE] >= 2 && data.players[player].hand[CONST.RESOURCE][CONST.WHEAT] >= 3) {
            for(let i = 0; i < data.houses.length; i++) {
                for(let j = 0; j < data.houses[i].length; j++) {
                    let house = document.getElementsByClassName("house_row")[i].getElementsByClassName("house")[j];
                    if(data.houses[i][j][0] == 1 && data.houses[i][j][1] == data.players[player].turn) {
                        house.style.backgroundColor = data.players[player].color;
                        house.style.opacity = 0.5;
                        house.style.cursor = "pointer";
                        house.onclick = Build.city(i, j, data);
                    }
                }
            }
        }
    };
    Build.city.hide = (data) => {
        for(let i = 0; i < data.houses.length; i++) {
            for(let j = 0; j < data.houses[i].length; j++) {
                let house = document.getElementsByClassName("house_row")[i].getElementsByClassName("house")[j];
                if(data.houses[i][j][0] == -1) {
                    house.style.opacity = 0;
                    house.style.cursor = "default";
                    house.onclick = undefined;
                }
            }
        }
    };
    return Build;
};
