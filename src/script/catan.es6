'use strict';

const CONST = require('./const');

module.exports = (gen, socket) => {
    let player;
    let Catan = {};

    Catan.arrange = (data) => {
        require('./arrange')(data, player);
    };

    Catan.awaitData = () => {
        socket.once('game:data', (data) => {
            Catan.arrange(data, player);
            gen.next(data);
        });
    };

    Catan.chooseColor = (data) => {
        let colors = ['red', 'orange', 'blue', 'white'];
        data.players.forEach((x) => {
            if(colors.indexOf(x.color) != -1) {
                //Remove all already chosen colours
                colors.splice(colors.indexOf(x.color), 1);
            }
        });
        if(colors.length) {
            //Create the form out of what options are left
            let overlay = document.getElementById('request_form');
            overlay.style.display = "block";
            let options = document.createElement("div");
            options.style.margin = "0 auto";
            options.style.textAlign = "center";
            overlay.appendChild(options);
            colors.forEach((color) => {
                let div = document.createElement("div");
                div.className = "color_selector";
                div.style.backgroundColor = color;
                div.onclick = () => {
                    socket.emit("game:color", color, gen.next);
                    Catan.chooseColor.hide();
                };
                options.appendChild(div);
            });
        }
    };
    Catan.chooseColor.hide = () => {
        let overlay = document.getElementById('request_form');
        overlay.style.display = "none";
        overlay.innerHTML = "";
    };

    Catan.chooseGameForm = () => {
        let form = document.getElementById('start_form');
        form.style.display = 'block';
        form.getElementsByTagName('button')[0].onclick = () => {
            Catan.chooseGameForm.hide();
            gen.next([document.getElementById('game_name').value, player = document.getElementById('your_name').value]);
        };
    };
    Catan.chooseGameForm.hide =  () => {
        let form = document.getElementById('start_form');
        form.style.display = 'none';
    };

    Catan.error = alert;

    Catan.startButton = () => {
        let button = document.getElementById('start_button');
        button.style.display = 'block';
        button.onclick = () => {
            socket.emit('game:start');
            Catan.startButton.hide();
        };
    };
    Catan.startButton.hide = () => {
        let button = document.getElementById('start_button');
        button.style.display = 'none';
    };

    Catan.turn = () => {
        socket.emit('game:turn', gen.next);
    };

    return Catan;
};
