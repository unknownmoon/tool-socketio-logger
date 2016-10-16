const _ = require('lodash');
const chalk = require('chalk');

const _u = require('./util');

/////// TODO: style combination

// weight: [style list]
//  weight < 0, never use
//  weight > 0, the larger the number is, the lower weight it is. i.e. 1 > 2
const styleTable = {
    '-1': ['dim', 'inverse', '', 'black', 'white', 'gray', 'bgBlack', 'bgWhite'],
    '1': ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'],
    '20': ['bgRed', 'bgGreen', 'bgYellow', 'bgBlue', 'bgMagenta', 'bgCyan'],
    // '30': ['bold', 'italic', 'underline'] // required when having style combination
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
    styleWeight++;
    styleIndex[style] = styleWeight;
    weightTable['' + styleWeight] = _u.randomInsertToArray(style, weightTable['' + styleWeight]);

    return style;
}

function getStyleList(userID) {
    return [getStyle(userID)];
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
        styleWeight--;
        styleIndex[style] = styleWeight;

        // sync the style to weightTable
        weightTable['' + styleWeight] = _u.randomInsertToArray(style, weightTable['' + styleWeight]);
    }

    // remove from user record
    _.pull(usedStyleIndex[userID], style);
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
    renderFn.__styles = styles.join('_');

    renderFn.destroy = function() {
        destroyRender(userID, renderFn);
    };
    return renderFn;
}

function destroyRender(userID, fn) {
    // update the runtime style table
    console.log(`destroyRender: ${userID}`);
    releaseStyleList(userID);
}

let rtTable = initRuntimeStyleTable(styleTable);

module.exports = {
    getRender
}