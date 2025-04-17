'use strict';
import {default as $} from 'jquery';

let timeout;

let hideAlert = () => {
    $('#alert')
        .text('')
        .attr('class', '');
    window.clearTimeout(timeout);
    timeout = undefined;
};

export let showAlert = (msg, type) => {
    if(timeout) {
        window.clearTimeout(timeout);
    }
    $('#alert')
        .text(msg)
        .addClass(type);
    timeout = window.setTimeout(hideAlert, 6000);
};
