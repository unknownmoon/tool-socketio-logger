const _ = require('lodash');
const chalk = require('chalk');

const _u = require('./util');
const STYLE_DELIMITER = '_';

const argv = _u.GLOBAL.argv;

const COLOR_MODE_DARK = 'dark';
const COLOR_MODE_BRIGHT = 'bright';
const COLOR_MODE = argv ? argv.color === COLOR_MODE_DARK ? COLOR_MODE_DARK : COLOR_MODE_BRIGHT : COLOR_MODE_BRIGHT;

console.log(`Color Mode is set to ${COLOR_MODE}`);
console.log(`Use '--color ${COLOR_MODE_DARK}|${COLOR_MODE_BRIGHT}' to switch the color mode.\n`);

const COLOR_WEIGHT_LEVEL = 4;

function composeStyle() {
    let styles = Array.prototype.slice.apply(arguments);
    return styles.join(STYLE_DELIMITER);
}

function decomposeStyle(styleStr) {
    return styleStr.split(STYLE_DELIMITER);
}

const PURE_COLOUR_STYLES_DARK = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'black', 'gray']; // can be seen in white background easily
const PURE_COLOUR_STYLES_BRIGHT = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']; // can be seen in black background easily
const WITH_BG_COLOUR_STYLES_DARK = [
    'bgRed_green', 'bgRed_yellow', 'bgRed_cyan', 'bgRed_white',
    'bgGreen_red', 'bgGreen_blue', 'bgGreen_magenta', 'bgGreen_black', 'bgGreen_white',
    'bgYellow_red', 'bgYellow_blue', 'bgYellow_magenta', 'bgYellow_black',
    'bgBlue_green', 'bgBlue_yellow', 'bgBlue_cyan', 'bgBlue_white',
    'bgMagenta_yellow', 'bgMagenta_white',
    'bgCyan_blue', 'bgCyan_magenta', 'bgCyan_black',
    'bgWhite_red', 'bgWhite_blue', 'bgWhite_magenta', 'bgWhite_black', 'bgWhite_gray',
    'bgBlack_green', 'bgBlack_yellow', 'bgBlack_magenta', 'bgBlack_cyan', 'bgBlack_white'
]; // can be seen in white background easily
const WITH_BG_COLOUR_STYLES_BRIGHT = [
    'bgRed_green', 'bgRed_yellow', 'bgRed_blue', 'bgRed_cyan', 'bgRed_white',
    'bgGreen_black', 'bgGreen_white',
    'bgYellow_red', 'bgYellow_black',
    'bgBlue_black', 'bgBlue_white',
    'bgMagenta_yellow', 'bgMagenta_blue', 'bgMagenta_cyan', 'bgMagenta_white',
    'bgCyan_black', 'bgCyan_white',
    'bgWhite_red', 'bgWhite_magenta', 'bgWhite_black'
]; // can be seen in black background easily

const PURE_COLOUR_STYLES = COLOR_MODE === COLOR_MODE_DARK ? PURE_COLOUR_STYLES_BRIGHT : PURE_COLOUR_STYLES_DARK;
const WITH_BG_COLOUR_STYLES = COLOR_MODE === COLOR_MODE_DARK ? WITH_BG_COLOUR_STYLES_BRIGHT : WITH_BG_COLOUR_STYLES_DARK;
const COLOUR_STYLES = COLOR_MODE === COLOR_MODE_DARK ? _.union(PURE_COLOUR_STYLES_BRIGHT, WITH_BG_COLOUR_STYLES_BRIGHT) : _.union(PURE_COLOUR_STYLES_DARK, WITH_BG_COLOUR_STYLES_DARK);
const TEXT_STYLES = ['bold', 'italic', 'underline'];

const pureColorAndTextVariants = _.reduce(TEXT_STYLES, function(result, textStyle) {
    _.each(PURE_COLOUR_STYLES, function(colorStyle) {
        result.push(`${colorStyle}${STYLE_DELIMITER}${textStyle}`);
    });
    return result;
}, []);

const bgColorAndTextVariants = _.reduce(TEXT_STYLES, function(result, textStyle) {
    _.each(WITH_BG_COLOUR_STYLES, function(colorStyle) {
        result.push(`${colorStyle}${STYLE_DELIMITER}${textStyle}`);
    });
    return result;
}, []);

// weight: [style list]
//  weight < 0, never use
//  weight > 0, the larger the number is, the lower weight it is. i.e. 1 > 2
const styleTable = {
    '1': PURE_COLOUR_STYLES.slice(0),
    '2': pureColorAndTextVariants.slice(0),
    '3': WITH_BG_COLOUR_STYLES.slice(0),
    '4': bgColorAndTextVariants.slice(0)
};

function initRuntimeStyleTable(styleTable) {
    let rtTable = {
        weightTable: {
            // weight: styleArray
            // will be initialised soon
        },
        styleIndex: {
            // styleName: weight
            // will be initialised soon
        },
        usedStyleIndex: {
            // userID: usedStyle
            // will be updated on the fly
        }
    };

    rtTable.weightTable = initWeightTable(styleTable);
    rtTable.styleIndex = initStyleIndex(rtTable.weightTable);

    return rtTable;
}

function initWeightTable(styleTable) {
    return _.reduce(styleTable, function(result, styles, weight) {

        // skip the ones with weight < 0
        if (weight > 0) {
            result[weight] = shuffleArray(styles);
        }

        return result;
    }, {});
}

function initStyleIndex(weightTable) {
    return _.reduce(weightTable, function(result, styles, weight) {

        _.each(styles, function(style) {
            result[style] = parseInt(weight);
        });

        return result;
    }, {});
}

function shuffleArray(arr) {
    var shuffled = [];

    _.each(arr, function(item) {
        _u.randomInsertToArray(item, shuffled);
    });

    return shuffled;
}

function getHeaviestStyle(weightTable) {

    const firstStylePerWeight = _.reduce(weightTable, function(result, styles, weight) {
        if (_.isArray(styles) && styles.length > 0) {
            result[weight] = styles[0];
        }
        return result;
    }, {});

    const heaviestKey = _.min(_.keys(firstStylePerWeight));

    return firstStylePerWeight[heaviestKey];
}

function getStyle(userID) {
    const weightTable = rtTable.weightTable;
    const styleIndex = rtTable.styleIndex;
    const usedStyleIndex = rtTable.usedStyleIndex;

    // get the style of the first item of the array with heaviest weight
    const style = getHeaviestStyle(weightTable);
    let styleWeight = parseInt(styleIndex[style]); // should be a number;

    // record the used style
    usedStyleIndex[userID] = _.union(usedStyleIndex[userID], [style]);

    // reduce the weight of the used style
    _.pull(weightTable['' + styleWeight], style);
    styleWeight += COLOR_WEIGHT_LEVEL;
    styleIndex[style] = styleWeight;
    weightTable['' + styleWeight] = _u.randomInsertToArray(style, weightTable['' + styleWeight]);

    return style;
}

function getStyleList(userID) {
    return decomposeStyle(getStyle(userID));
    // get a style combination
    // update the runtime style table
    // return ['red', 'underline'];
}

function releaseStyle(userID, style) {
    const weightTable = rtTable.weightTable;
    const styleIndex = rtTable.styleIndex;
    const usedStyleIndex = rtTable.usedStyleIndex;

    let styleWeight = parseInt(styleIndex[style]); // ensure it's integer

    // skip if weight is already 1, since 1 is the heaviest
    if (styleWeight > 1) {
        // sync the style to weightTable
        _.pull(weightTable['' + styleWeight], style);

        // add the weight till 1
        styleWeight -= COLOR_WEIGHT_LEVEL;
        styleIndex[style] = styleWeight;

        // sync the style to weightTable
        weightTable['' + styleWeight] = _u.randomInsertToArray(style, weightTable['' + styleWeight]);
    }

    // remove from user record
    _.pull(usedStyleIndex[userID], style);

    if (usedStyleIndex[userID].length < 1) {
        delete usedStyleIndex[userID];
    }
}

function releaseStyleList(userID) {
    const weightTable = rtTable.weightTable;
    const styleIndex = rtTable.styleIndex;
    const usedStyleIndex = rtTable.usedStyleIndex;

    const userRecord = usedStyleIndex[userID];

    _.each(userRecord, function(style) {
        releaseStyle(userID, style);
    });
}

function getRender(userID) {
    const styles = getStyleList(userID);

    let renderFn = function render() {
        let _renderFn = _.reduce(styles, function(fn, style) {
            return fn[style];
        }, chalk);

        return _renderFn.apply(null, arguments);
    }

    renderFn.__userID = userID;
    renderFn.__styles = styles.join(STYLE_DELIMITER);

    renderFn.destroy = function() {
        destroyRender(userID, renderFn);
    };

    return renderFn;
}

function destroyRender(userID, fn) {
    releaseStyleList(userID);
}

let rtTable = initRuntimeStyleTable(styleTable);

module.exports = {
    getRender
}