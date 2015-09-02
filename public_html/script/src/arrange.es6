'use strict';
import {CONST} from './const.es6';
import {default as $} from 'jquery';

export let arrange = (data, your_name) => {
    $('.tile_row').each(function(i) {
        $(this).children('.tile').each(function(j) {
            $(this).css({
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
        $('#buy-dev-card,#play-dev-card,#init-trade,#end-turn').css('display', 'none').off('click');
        // Points
        // Prizes
    });
    $('#yellowdie').attr('src', `/image/ydie${data.dice[0]}.png`);
    $('#reddie').attr('src', `/image/rdie${data.dice[1]}.png`);
};
