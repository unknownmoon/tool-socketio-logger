const http = require('http');
const socketio = require('socket.io');
const url = require('url');
const qs = require('querystring');
const _ = require('lodash');
const chalk = require('chalk');
const os = require('os');

const clientScript = require('./client-script');
const _u = require('./util');
const _cr = require('./colourful-render');

function Logger(opts) {
    this.PORT = opts.port || 9528;
}

Logger.prototype.start = function startLogger() {

    let app = http.createServer(apiHander);
    const io = socketio(app);

    app.listen(this.PORT, function() {
        const port = app.address().port;

        const addrs = _.reduce(os.networkInterfaces(), function(result, interfacesInfo, interfaceName) {
            const interfaces = _.reduce(interfacesInfo, function(interfaces, interfaceInfo) {
                if (interfaceInfo.family === 'IPv4') {
                    interfaces.push(`${interfaceInfo.address}:${port}`);
                }
                return interfaces;
            }, []);

            result = result.concat(interfaces);

            return result;
        }, []);

        console.log(`[${_u.getTimeStr(Date.now())}][logger] Service is available on: `);
        _.each(addrs, function(addr) {
            console.log(addr);
        });
        console.log('\n'); // more spacing..
    });
    io.on('connection', ioConnectionHandler);

    return;
}

function apiHander(req, res) {
    // get socket API: /api/v0/socket-inject
    //      sample: /api/v0/socket-inject?func=__debug&func=__log
    const parsedURL = url.parse(req.url);
    if (req.method === 'GET' && isGetSocketAPI(parsedURL)) {
        // parse the query, get the function names
        const parsedQuery = qs.parse(parsedURL.query);
        // get host info
        const host = req.headers.host;
        res.writeHead(200);
        res.end(clientScript.genScript({
            host,
            func: [].concat(parsedQuery.func || '__debug'),
            'from': parsedQuery['from'] === undefined ? parsedQuery['from'] : '' + parsedQuery['from']
        }));

    } else {
        res.writeHead(404);
        res.end('404 Not Found');
    }
}

function isGetSocketAPI(parsedURL) {
    return parsedURL.pathname === '/api/v0/socket-inject';
}

function ioConnectionHandler(socket) {
    let renders = [];

    socket.emit('who r u');
    socket.on('setup', function(data) {
        // colourful hightlight the `from`
        let render = _cr.getRender(socket.id);
        let who = data['from'] ? data['from'] : socket.id;
        let time = _u.getTimeStr(data.time || Date.now());
        console.log(chalk.underline(`[${time}][${chalk.bold(render(who))}] on setup: `));
        render.destroy();

        if (data && _.isArray(data.func)) {
            _.each(data.func, function(funcName) {
                let render = _cr.getRender(socket.id);
                renders.push(render);
                setupSocketHandler(funcName, socket, render);
                console.log(`function ${render(funcName)} has been registered.`);
            });
        }
    });

    socket.on('disconnect', function() {

        // TODO
        // if (renders.length > 0) {
        //     // single destroy should have destroy all renders;
        //     renders[0].destroy();
        // }

        _.each(renders, function(render) {
            render.destroy();
        });
    });
}

function setupSocketHandler(funcName, socket, renderFn) {
    socket.on(funcName, function(data) {
        const msg = data.msg;
        const time = data.time || Date.now();
        const who = data['from'] || socket.id;
        let parsedMsg;

        try {
            parsedMsg = JSON.parse(msg);
        } catch (e) {
            parsedMsg = msg;
        }
        console.log(renderFn(`[${_u.getTimeStr(time)}][${who}][${funcName}]:`));
        if (typeof parsedMsg === 'object') {
            _u.inspect(parsedMsg);
        } else {
            console.log(renderFn(parsedMsg));
        }
    });
}

module.exports = Logger;