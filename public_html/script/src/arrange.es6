'use strict';
import {CONST} from './const.es6';
import {adjacent} from './adjacent.es6';
import {default as $} from 'jquery';

export let countVPs = (data, player, your_name) => {
    let vps = 0;
    data.houses.forEach((row) => {
        row.forEach((house) => {
            if(house[1] === player) {
                vps += house[0];
            }
        });
    });
    vps += data.players[player].longestRoad ? 2 : 0;
    vps += data.players[player].largestArmy ? 2 : 0;
    if(player === your_name) {
        vps += data.players[player].hand[CONST.DEVELOPMENT][CONST.READY][CONST.VP];
    }
    return vps;
};

let mystery = false;
export let setMystery = (v) => {
    mystery = v;
};

export let arrange = (data, your_name) => {
    $('.tile_row').each(function(i) {
        $(this).children('.tile').each(function(j) {
            let isAdjacent = false;
            adjacent(i, j, 'tile', 'house').forEach(([i,j]) => {
                if(data.houses[i][j][0] !== 0) {
                    isAdjacent = true;
                }
            });
            console.log(mystery, isAdjacent, data.gameState);
            let show = !mystery || (isAdjacent && data.gameState !== CONST.SETUP);
            $(this).css({
                    left: `${200 + (200 * j + 100 * Math.abs(i - 2))}px`,
                    top: `${174 * i}px`}
                )
            .attr('class', `tile ${['pasture','field','forest','quarry','mountain','desert','water'][show ? data.tiles[i][j][0] : 6]}`)
            .html('')
            .append((data.tiles[i][j][1] === 7 || !show) ? '' : $('<span></span>')
                .addClass(`number ${[6,8].indexOf(data.tiles[i][j][1]) !== -1 ? 'red' : ''}`)
                .text(data.tiles[i][j][1])
            )
            .append($('<img>')
                .attr('src', '/image/robber.png')
                .addClass('robber')
                .css({
                    opacity: (data.robber[0] === i && data.robber[1] === j && show) ? 1 : 0,
                    cursor: 'default'
                })
                .off('click')
            );
        });
    });

    let portPos = [
        [300, -174, 60], [700, -174, 120],
        [1000, 0, 120],
        [100, 174 * 1, 0],
        [1200, 174 * 2, 180],
        [100, 174 * 3, 0],
        [1000, 174 * 4, -120],
        [300, 174 * 5, -60],[700, 174 * 5, -120]
    ];
    $('.port').each(function(i) {
        $(this).css({
                left: `${portPos[i][0]}px`,
                top: `${portPos[i][1]}px`,
                transform: `rotate(${portPos[i][2]}deg)`
        })
        .attr('class', `port ${['pasture','field','forest','quarry','mountain','any'][data.ports[i]]}`)
        .html('');
    });

    $('.road_row').each(function(i) {
        $(this).children('.road').each(function(j) {
            $(this).css(
                //Position
                i & 1 ? {
                    left: `${150 + (200 * j + 100 * Math.abs((i - 1) / 2 - 2))}px`,
                    top: `${174 * (i - 1) / 2 + 231 / 2}px`
                } : {
                    left: `${150 + (100 * j + 100 * Math.abs((i - 1) / 2 - 2))}px`,
                    top: `${174 * i / 2 + 231 / 12}px`
                }
            )
            .removeClass('buildable')
            .off('click');
            if(data.roads[i][j] !== -1) {
                $(this).css('background-color', data.players[data.roads[i][j]].color);
            }
        });
    });

    $('.house_row').each(function(i) {
        $(this).children('.house').each(function(j) {
            $(this).css({
                    //Position
                    left: `${(100 + 100 * j + 100 * Math.abs(i - 3) - 16 + 100 * (i >= 3))}px`,
                    top: i < 3 ?
                        `${(174 * i + (231 / 6 + 16) * ((j + 1) % 2)) - 16}px` :
                        `${(174 * i + (231 / 6 + 16) * (j % 2)) - 16}px`
                    })
                    .removeClass('buildable')
                    .removeClass('targetable')
                    .off('click');
                if(data.houses[i][j][0] !== 0) {
                    $(this).css({
                        'background-color': data.players[data.houses[i][j][1]].color,
                        'border-bottom-color': data.players[data.houses[i][j][1]].color,
                        color: data.players[data.houses[i][j][1]].color,
                    });
                }
            if(data.houses[i][j][0] === 2) {
                $(this).addClass('city');
            } else {
                $(this).removeClass('city');
            }
        });
    });
    let colors = {
        'red': 'RGBA(255, 150, 150, 0.5)',
        'orange': 'RGBA(255, 127, 0, 0.5)',
        'blue': 'RGBA(0, 255, 255, 0.5)',
        'white': 'RGBA(255, 255, 255, 0.5)'
    };
    let n = 0;
    Object.keys(data.players).forEach((name) => {
        let player;
        if(name !== your_name) {
            player = $(`.player`).eq(n++);
            player.children('.cards').html(
                `<img src='image/any.png' width='20'>` +
                data.players[name].hand[CONST.RESOURCE].reduce((p, c) => p + c, 0) +
                `<img src='image/devcard.png' width='20'>` +
                data.players[name].hand[CONST.DEVELOPMENT].reduce((p, c) => p + c.reduce((p,c) => p + c, 0), 0)
            );
            player.children('.points').html(`Road length: ${data.players[name].longestRoadCount} Knights: ${data.players[name].knights} Total VPs: ${countVPs(data, name, your_name)}`);
        } else {
            player = $('.player.me');
            player.children('.cards').html(
                `<img src='image/wool.png' width='20'> ${data.players[name].hand[CONST.RESOURCE][CONST.WOOL]}` +
                `<img src='image/wheat.png' width='20'> ${data.players[name].hand[CONST.RESOURCE][CONST.WHEAT]}` +
                `<img src='image/wood.png' width='20'> ${data.players[name].hand[CONST.RESOURCE][CONST.WOOD]}` +
                `<img src='image/brick.png' width='20'> ${data.players[name].hand[CONST.RESOURCE][CONST.BRICK]}` +
                `<img src='image/ore.png' width='20'> ${data.players[name].hand[CONST.RESOURCE][CONST.ORE]}` +
                `<img src='image/knight.png' width='20'> ${data.players[name].hand[CONST.DEVELOPMENT][CONST.READY][CONST.KNIGHT] + data.players[name].hand[CONST.DEVELOPMENT][CONST.BOUGHT][CONST.KNIGHT]}` +
                `<img src='image/vp.png' width='20'> ${data.players[name].hand[CONST.DEVELOPMENT][CONST.READY][CONST.VP] + data.players[name].hand[CONST.DEVELOPMENT][CONST.BOUGHT][CONST.VP]}` +
                `<img src='image/monopoly.png' width='20'> ${data.players[name].hand[CONST.DEVELOPMENT][CONST.READY][CONST.MONOPOLY] + data.players[name].hand[CONST.DEVELOPMENT][CONST.BOUGHT][CONST.MONOPOLY]}` +
                `<img src='image/road_building.png' width='20'> ${data.players[name].hand[CONST.DEVELOPMENT][CONST.READY][CONST.ROAD_BUILDING] + data.players[name].hand[CONST.DEVELOPMENT][CONST.BOUGHT][CONST.ROAD_BUILDING]}` +
                `<img src='image/year_of_plenty.png' width='20'> ${data.players[name].hand[CONST.DEVELOPMENT][CONST.READY][CONST.YEAR_OF_PLENTY] + data.players[name].hand[CONST.DEVELOPMENT][CONST.BOUGHT][CONST.YEAR_OF_PLENTY]}`
            );
            player.children('.points').html(`Road length: ${data.players[name].longestRoadCount} Knights: ${data.players[name].knights} Total VPs: ${countVPs(data, name, your_name)}`);
        }
        player
            .css({
                border: data.players[name].turn === data.turn ? '2px solid white' : 'none',
                'background-color': colors[data.players[name].color]
            })
            .children('.name').text(name);
        if(data.dice[0] + data.dice[1] === 7 && !data.players[name].response.robber && data.rolled) {
            player.addClass('robber-trouble');
        } else {
            player.removeClass('robber-trouble');
        }
        $('#buy-dev-card,#play-dev-card,#init-trade,#end-turn').css('display', 'none').off('click');
        // Points
        // Prizes
    });
    $('#dev-cards-left').text(data.devCards.length);
    $('#yellowdie').attr('src', `/image/ydie${data.dice[0]}.png`);
    $('#reddie').attr('src', `/image/rdie${data.dice[1]}.png`);
};
