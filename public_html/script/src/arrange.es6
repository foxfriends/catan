'use strict';
import {CONST} from './const.es6';
import {default as $} from 'jquery';

export let arrange = (data, your_name) => {
    let i, j;
    for(i = 0; i < data.tiles.length; i++) {
        for(j = 0; j < data.tiles[i].length; j++) {
            $('.tile_row').eq(i).children('.tile').eq(j)
                .css({
                        left: `${200 + (200 * j + 100 * Math.abs(i - 2))}px`,
                        top: `${174 * i}px`}
                    )
                .attr('class', `tile ${['pasture','field','forest','quarry','mountain','desert','water'][data.tiles[i][j][0]]}`)
                .html('')
                .append(data.tiles[i][j][1] === 7 ? '' : $('<span></span>')
                    .addClass(`number ${[6,8].indexOf(data.tiles[i][j][1]) !== -1 ? 'red' : ''}`)
                    .text(data.tiles[i][j][1])
                )
                .append($('<img>')
                    .attr('src', '/image/robber.png')
                    .addClass('robber')
                    .css({
                        opacity: (data.robber[0] === i && data.robber[1] === j) ? 1 : 0,
                        cursor: 'default'
                    })
                    .off('click')
                );
        }
    }
    for(i = 0; i < data.roads.length; i++) {
        for(j = 0; j < data.roads[i].length; j++) {
            let road = document.getElementsByClassName('road_row')[i].getElementsByClassName('road')[j];
            $('.road_row').eq(i).children('.road').eq(j)
                .css(
                    //Position
                    i & 1 ? {
                        left: `${150 + (200 * j + 100 * Math.abs((i - 1) / 2 - 2))}px`,
                        top: `${174 * (i - 1) / 2 + 231 / 2}px`
                    } : {
                        left: `${150 + (100 * j + 100 * Math.abs((i - 1) / 2 - 2))}px`,
                        top: `${174 * i / 2 + 231 / 12}px`
                    }
                )
                .css(
                    //Color
                    data.roads[i][j] !== -1 ? {
                        'background-color': data.players[data.roads[i][j]].color,
                        opacity: 1
                    } : {
                        opacity: 0
                    }
                )
                .css({
                    'pointer-events': 'none',
                    cursor: 'default'
                })
                .off('click');
        }
    }
    for(i = 0; i < data.houses.length; i++) {
        for(j = 0; j < data.houses[i].length; j++) {
            let house = $('.house_row').eq(i).children('.house').eq(j)
                .css({
                    //Position
                    left: `${(100 + 100 * j + 100 * Math.abs(i - 3) - 16 + 100 * (i >= 3))}px`,
                    top: i < 3 ?
                        `${(174 * i + (231 / 6 + 16) * ((j + 1) % 2)) - 16}px` :
                        `${(174 * i + (231 / 6 + 16) * (j % 2)) - 16}px`
                    })
                .css(
                    //Color
                    data.houses[i][j][0] !== 0 ? {
                        'background-color': data.players[data.houses[i][j][1]].color,
                        color: data.players[data.houses[i][j][1]].color,
                        opacity: 1
                    } : {
                        opacity: 0
                    }
                )
                .css({
                    'pointer-events': 'none',
                    cursor: 'default',
                    border: 'none'
                })
                .off('click');
            if(data.houses[i][j][0] === 2) {
                house.addClass('city');
            } else {
                house.removeClass('city');
            }
        }
    }
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
                `<img src='image/wool.png' width='20'>` +
                `<img src='image/wheat.png' width='20'>` +
                `<img src='image/wood.png' width='20'>` +
                `<img src='image/brick.png' width='20'>` +
                `<img src='image/ore.png' width='20'>` +
                data.players[name].hand[CONST.RESOURCE].reduce((x, y) => x + y, 0)
            );
        } else {
            player = $('.player.me');
            player.children('.cards').html(
                `<img src='image/wool.png' width='20'> ${data.players[name].hand[CONST.RESOURCE][CONST.WOOL]}` +
                `<img src='image/wheat.png' width='20'> ${data.players[name].hand[CONST.RESOURCE][CONST.WHEAT]}` +
                `<img src='image/wood.png' width='20'> ${data.players[name].hand[CONST.RESOURCE][CONST.WOOD]}` +
                `<img src='image/brick.png' width='20'> ${data.players[name].hand[CONST.RESOURCE][CONST.BRICK]}` +
                `<img src='image/ore.png' width='20'> ${data.players[name].hand[CONST.RESOURCE][CONST.ORE]}`
            );
        }
        player
            .css({
                border: data.players[name].turn === data.turn ? '2px solid white' : 'none',
                'background-color': colors[data.players[name].color]
            })
            .children('.name').text(name);
        $('#buy-dev-card,#play-dev-card,#init-trade,#end-turn').css('display', 'none');
        // Points
        // Prizes
    });
    $('#yellowdie').attr('src', `/image/ydie${data.dice[0]}.png`);
    $('#reddie').attr('src', `/image/rdie${data.dice[1]}.png`);
};
