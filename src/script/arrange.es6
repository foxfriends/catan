'use strict';
const CONST = require('./const');
module.exports = (data, your_name) => {
    let i, j;
    for(i = 0; i < data.tiles.length; i++) {
        for(j = 0; j < data.tiles[i].length; j++) {
            let tile = document.getElementsByClassName("tile_row")[i].getElementsByClassName(
                "tile")[j];
            tile.style.left = 200 + (200 * j + 100 * Math.abs(i - 2)) +
                "px";
            tile.style.top = (174 * i) + "px";
            let type = "";
            switch(data.tiles[i][j][0]) {
            case CONST.PASTURE:
                type = "pasture";
                break;
            case CONST.FIELD:
                type = "field";
                break;
            case CONST.FOREST:
                type = "forest";
                break;
            case CONST.QUARRY:
                type = "quarry";
                break;
            case CONST.MOUNTAIN:
                type = "mountain";
                break;
            case CONST.DESERT:
                type = "desert";
                break;
            case CONST.WATER:
                type = "water";
                break;
            }
            tile.className = "tile " + type;
            let show = 'no';
            if(i == data.robber[0] && j == data.robber[1]) {
                show = 'yes';
            }

            let number = '';
            let robber_img = '<img src="/image/robber.png" class="robber">';
            if(data.tiles[i][j][1] !== 7) {
                let red = "";
                if(data.tiles[i][j][1] === 6 || data.tiles[i][j][1] === 8) {
                    red = " red";
                }
                number =
                    `<span class='number ${red}'>${data.tiles[i][j][1]}</span>`;
            }
            tile.innerHTML = `${number}${robber_img}`;
            tile.getElementsByClassName('robber')[0].style.opacity = (data.robber[
                0] == i && data.robber[1] == j) ? 1 : 0;
            tile.getElementsByClassName('robber')[0].onclick = undefined;
            tile.getElementsByClassName('robber')[0].style.cursor = "default";
        }
    }
    for(i = 0; i < data.roads.length; i++) {
        for(j = 0; j < data.roads[i].length; j++) {
            let road = document.getElementsByClassName("road_row")[i].getElementsByClassName(
                "road")[j];
            if(i & 1) {
                road.style.left = 150 + (200 * j + 100 * Math.abs((i - 1) /
                    2 - 2)) + "px";
                road.style.top = (174 * (i - 1) / 2 + 231 / 2) + "px";
            } else {
                road.style.left = 150 + (100 * j + 100 * Math.abs((i - 1) /
                    2 - 2)) + "px";
                road.style.top = (174 * i / 2 + 231 / 12) + "px";
            }
            if(data.roads[i][j] !== -1) {
                road.style.backgroundColor = data.players[data.roads[i][j]]
                    .color;
                road.style.opacity = 1;
            } else {
                road.style.opacity = 0;
            }
            road.style.cursor = "default";
            road.onclick = undefined;
        }
    }
    for(i = 0; i < data.houses.length; i++) {
        for(j = 0; j < data.houses[i].length; j++) {
            let house = document.getElementsByClassName("house_row")[i].getElementsByClassName(
                "house")[j];
            house.style.left = (100 + 100 * j + 100 * Math.abs(i - 3) - 16 +
                100 * (i >= 3)) + "px";
            if(i < 3) {
                house.style.top = (174 * i + (231 / 6 + 16) * ((j + 1) % 2)) -
                    16 + "px";
            } else {
                house.style.top = (174 * i + (231 / 6 + 16) * (j % 2)) - 16 +
                    "px";
            }
            if(data.houses[i][j][0] !== 0) {
                house.style.backgroundColor = data.players[data.houses[i][j]
                    [1]].color;
                house.style.opacity = 1;
            } else {
                house.style.opacity = 0;
            }
            house.style.cursor = "default";
            house.style.border = "none";
            house.onclick = undefined;
        }
    }
    let colors = {
        "red": "RGBA(255, 150, 150, 0.5)",
        "orange": "RGBA(255, 127, 0, 0.5)",
        "blue": "RGBA(0, 255, 255, 0.5)",
        "white": "RGBA(255, 255, 255, 0.5)"
    };
    let n;
    for(i = 0, n = 0; i < data.players.length; i++) {
        let player;
        if(data.players[i].name != your_name) {
            player = document.getElementsByClassName("player")[n++];
            player.getElementsByClassName("cards")[0].innerHTML =
                `<img src='image/wool.png' width='20'>` +
                `<img src='image/wheat.png' width='20'>` +
                `<img src='image/wood.png' width='20'>` +
                `<img src='image/brick.png' width='20'>` +
                `<img src='image/ore.png' width='20'>` +
                data.hands[i][0].reduce((x, y) => x + y, 0);
        } else {
            player = document.getElementsByClassName("player me")[0];
            player.getElementsByClassName("cards")[0].innerHTML =
                `<img src='image/wool.png' width='20'> ${data.hands[i][0][CONST.WOOL]}` +
                `<img src='image/wheat.png' width='20'> ${data.hands[i][0][CONST.WHEAT]}` +
                `<img src='image/wood.png' width='20'> ${data.hands[i][0][CONST.WOOD]}` +
                `<img src='image/brick.png' width='20'> ${data.hands[i][0][CONST.BRICK]}` +
                `<img src='image/ore.png' width='20'> ${data.hands[i][0][CONST.ORE]}`;
        }
        if(i === data.turn) {
            player.style.border = "2px solid white";
        } else {
            player.style.border = "none";
        }
        player.getElementsByClassName("name")[0].innerHTML = data.players[i]
            .name;
        player.style.backgroundColor = colors[data.players[i].color];

        document.getElementById("buy-dev-card").style.display = "none";
        document.getElementById("play-dev-card").style.display = "none";
        document.getElementById("init-trade").style.display = "none";
        document.getElementById("end-turn").style.display = "none";
        // Points
        // Prizes
    }
    document.getElementById("yellowdie").src = `/image/ydie${data.dice[0]}.png`;
    document.getElementById("reddie").src = `/image/rdie${data.dice[1]}.png`;
};
