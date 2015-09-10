'use strict';
import {default as $} from 'jquery';

let container = $('#chatbox-container');
let msgContainer = $('#messages-container');
let messages = $('#chatbox-messages');
let input = $('#chatbox-input');

let chatting = false, timeout;

let close = () => {
    container
        .css('max-height', `${32 + $('.message').last().innerHeight()}px`);
    msgContainer
        .scrollTop(messages.height())
        .css('overflow', 'hidden');
};

let half = () => {
    container
        .css('max-height', '250px');
    msgContainer.scrollTop(messages.height())
        .css('overflow', 'auto');
};

let full = () => {
    container
        .css('max-height', '500px');
    msgContainer.scrollTop(messages.height())
        .css('overflow', 'auto');
};

let send = (socket) => {
    let msg = input.val();
    input.val('');
    if(msg.replace(/[\s]/g, '') !== '') {
        socket.emit('chat:post', msg);
    }
};

let add = (msg) => {
    let time = new Date(msg.time);
    let formattedTime = `${time.getHours() % 12 ? time.getHours() % 12 : 12}:${time.getMinutes() < 10 ? '0' + time.getMinutes() : time.getMinutes()} ${time.getHours() < 12 ? 'AM' : 'PM'}`;
    messages
        .append($('<article></article>')
            .addClass('message')
            .append($('<header></header>')
                .append($('<span></span>')
                    .addClass('chatbox-author')
                    .text(msg.author)
                )
                .append($('<span></span>')
                    .addClass('chatbox-timestamp')
                    .text(formattedTime)
                )
            )
            .append($('<p></p>')
                .text(msg.body)
            )
        );
    $('#messages-container').scrollTop(messages.height());
};

let disallow = () => {
    input
        .off('blur')
        .blur()
        .focus(function() {
            full();
            chatting = true;
        })
        .css('pointer-events', 'none');
};
disallow();

let allow = () => {
    input
        .off('focus')
        .focus()
        .blur(function() {
            close();
            chatting = false;
        })
        .css('pointer-events', 'default');
};

export let chat = (socket) => {
    socket.on('chat:message', (msg) => {
        add(msg);
        if(timeout) {
            window.clearTimeout(timeout);
            timeout = undefined;
        }
        if(!chatting) {
            half();
            timeout = window.setTimeout(close, 6000);
        }
    });
    return (e) => {
        let dont = false;
        $('.overlay').each(function() {
            if($(this).css('display') !== '' && $(this).css('display') !== 'none') {
                dont = true;
            }
        });
        if(dont) {
            return;
        }
        if(e.keyCode === 13) {
            if(chatting) {
                chatting = false;
                send(socket);
                disallow();
                half();
                if(timeout) {
                    window.clearTimeout(timeout);
                    timeout = undefined;
                }
                timeout = window.setTimeout(close, 6000);
            } else {
                chatting = true;
                full();
                allow();
                if(timeout) {
                    window.clearTimeout(timeout);
                    timeout = undefined;
                }
            }
        }
    };
};
