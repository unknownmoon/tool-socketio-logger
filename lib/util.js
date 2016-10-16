const fs = require('fs');
const path = require('path');
const inspect = require('util').inspect;
const argv = require('minimist')(process.argv.slice(2));

const GLOBAL = {};
GLOBAL.argv = argv;

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

function leftPadding(string, pad, precision) {
    const padding = Array(precision).fill(pad).join('');
    return (padding + string).slice(0 - precision);
}

function getTimeStr(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = leftPadding(date.getMonth() + 1, '0', 2);
    const day = leftPadding(date.getDate() + 1, '0', 2);
    const hrs = leftPadding(date.getHours(), '0', 2);
    const mins = leftPadding(date.getMinutes(), '0', 2);
    const secs = leftPadding(date.getSeconds() + 1, '0', 2);
    const ms = leftPadding(date.getMilliseconds() + 1, '0', 3);

    return `${year}-${month}-${day} ${hrs}:${mins}:${secs}.${ms}`;
}

function randomInsertToArray(elm, arr) {
    arr = arr || []; // create a new Array when empty Array is provided.
    const loc = Math.floor(arr.length * Math.random());
    arr.splice(loc, 0, elm);
    return arr;
}

function isSameColorFamily(color1, color2) {
    const l1 = color1.toLowerCase();
    const l2 = color2.toLowerCase();

    return _.includes(l1, l2) || _.includes(l2, l1);
}

module.exports = {
    readFile,
    inspect: __inspect,
    leftPadding,
    getTimeStr,
    randomInsertToArray,
    GLOBAL,
    isSameColorFamily
}