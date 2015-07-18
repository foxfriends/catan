'use strict';
let fs = require("fs");

let shuffle = (array) => {
    for(var i = array.length; i > 0; i--) {
        var r = Math.floor(Math.random() * i);
        var t = array[r];
        array[r] = array[i-1];
        array[i-1] = t;
    }
    return array;
};

class Game {
    exists(name) {
        try {
            fs.statSync(`games/${name}.game`);
            return true;
        } catch(e) {
            return false;
        }
    }
    new(name) {
        let tiles = shuffle([0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,4,4,4,5]);
        let numbers = shuffle([2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12]);
        for(var i = 0; i < tiles.length; i++) {
            if(tiles[i] != 5) {
                tiles[i] = [tiles[i], numbers[0]];
                numbers.splice(0,1);
            } else {
                tiles[i] = [5, 7];
            }
        }
        tiles = [
            [tiles[0], tiles[1], tiles[2]],
            [tiles[3], tiles[4], tiles[5], tiles[6]],
            [tiles[7], tiles[8], tiles[9], tiles[10], tiles[11]],
            [tiles[12], tiles[13], tiles[14], tiles[15]],
            [tiles[16], tiles[17], tiles[18]]
        ];
        let ports = shuffle([0,1,2,3,4,5,5,5,5]);
        let dev_cards = shuffle([0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,2,2,3,3,4,4]);

        console.log(`New game created: ${name}`);

        let data = {
            tiles: tiles,
            ports: ports,
            dev_cards: dev_cards,
            roads: [
                [-1,-1,-1,-1,-1,-1],
                [-1,-1,-1,-1],
                [-1,-1,-1,-1,-1,-1,-1,-1],
                [-1,-1,-1,-1,-1],
                [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
                [-1,-1,-1,-1,-1,-1],
                [-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
                [-1,-1,-1,-1,-1],
                [-1,-1,-1,-1,-1,-1,-1,-1],
                [-1,-1,-1,-1],
                [-1,-1,-1,-1,-1,-1]
            ],
            houses: [
                [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
                [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
                [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
                [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
                [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
                [[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]]
            ],
            hands: [
                [[0,0,0,0,0],[0,0,0,0,0]],
                [[0,0,0,0,0],[0,0,0,0,0]],
                [[0,0,0,0,0],[0,0,0,0,0]],
                [[0,0,0,0,0],[0,0,0,0,0]]
            ],
            trade: [0,0,0,0,0],
            players: [],
            game_started: false,
            turn: -1,
            dice: [1,1]
        };

        this.save(name, data);

        return data;
    }
    load(name) {
        return JSON.parse(fs.readFileSync(`./games/${name}.game`, 'utf8'));
    }
    save (file, data) {
        fs.writeFile(`./games/${file}.game`, JSON.stringify(data), (err) => {
            if(err) {
                console.log(err);
                return;
            }
            console.log(`Game was saved to './games/${file}.game'`);
        });
    }
}

module.exports = new Game();
