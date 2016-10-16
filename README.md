# tool-socketio-logger
A simple as-it-is message logger powered by socket.io

## How to use

### Get the server

#### NPM install from GitHub globally

```bash
npm i -g git+https://git@github.com/unknownmoon/tool-socketio-logger.git
```

1. run `tool-socketio-logger` to start with default color mode (`bright`);
1. run `tool-socketio-logger --color dark` to start with color mode `dark`, if you're using black background in your terminal
1. use `--port` or `-p` to specify the port your should like to use.

#### Using source code
1. check out the project
1. run `npm i` to initialise the project
1. run `npm start` to start with default color mode (`bright`)
1. run `npm run start-dark` to start with color mode `dark`, if you're using black background in your terminal

### Inject script to your HTML

The API is `/api/v0/socket-inject/`, while the query `func` is the global function to communicate with the logger.
In the example below, `__debug` and `__log` are registered to the logger, with differently coloured outputs.

```html
<script src="http://localhost:9528/api/v0/socket-inject?func=__debug&func=__log"></script>
<scirpt>
    // how to use the client logging functions
    __debug(location);
    __log(location);
</scirpt>
```