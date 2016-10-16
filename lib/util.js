const fs = require('fs');
const path = require('path');
const inspect = require('util').inspect;

function readFile(fileName, opts) {
    return new Promise(function(resolve, reject) {
        fs.readFile(fileName, opts, function(err, data) {
            if (err) {
                reject(err);
                return;
            } else {
                resolve(data);
            }
        });
    });
}

function __inspect(obj) {
    console.log(inspect(obj, { depth: 7, colors: true }));
}

module.exports = {
    readFile: readFile,
    inspect: __inspect
}