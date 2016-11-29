const fs = require('fs');
const path = require('path');
const _ = require('lodash');
const _u = require('./util');

let socketIOScript;

_u.readFile(path.join(__dirname, '..', 'node_modules', 'socket.io-client', 'dist', 'socket.io.min.js'), { encoding: 'utf8' })
    .then(function(fileContent) {
        socketIOScript = fileContent;
        return socketIOScript;
    }).catch(function(err) {
        console.error(err.stack);
        throw err;
    });

function genClientInjectScript(opts) {
    const host = opts.host || 'localhost';
    const func = opts.func;
    const funcSnippets = _.map(func, function(fnName) {
        return genFuncSnippets(fnName, opts);
    }).join(';');

    return `
        ${genSetupSnippets(host, func, opts)}

        ${funcSnippets}
    `;
}

function genSetupSnippets(host, func, opts = {}) {
    const who = opts['from'] ? '\'' + opts['from'] + '\'' : 'socket.id';
    return `
    var socket = io('${host}');
    socket.on('connect', function() {
        socket.emit('setup', {
            func: JSON.parse('${JSON.stringify(func)}'),
            'from': ${who},
            time: Date.now()
        });
    });
    `;
}

function genFuncSnippets(funcName, opts = {}) {
    const who = opts['from'] ? '\'' + opts['from'] + '\'' : 'socket.id';
    return `
        window['${funcName}'] = function (msgOrObj) {
            socket.emit('${funcName}', {
                'from': ${who},
                time: Date.now(),
                msg: JSON.stringify(msgOrObj)
            });
        };
    `;
}

module.exports = {
    genScript: function genScript(opts) {
        let clientInjectScript = genClientInjectScript(opts);

        return `
        ${socketIOScript}
        ;+function() {
            ${clientInjectScript}
        }();`;
    }
}