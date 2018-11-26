'use strict';

process.env.DEBUG = 'actions-on-google:*';
// const App = require('actions-on-google').DialogflowApp;
const App = require('actions-on-google').DialogflowApp;
const functions = require('firebase-functions');

const NAME_ACTION = "plan";
// const YEAR_ARG = "year";
// const MONTH_ARG = "month";
const DATE_ARG = "date";
const MONTH_CONVERT_NUMBER = {
    "1": 1,
    "2": 4,
    "3": 4,
    "4": 0,
    "5": 2,
    "6": 5,
    "7": 0,
    "8": 3,
    "9": 6,
    "10": 1,
    "11": 4,
    "12": 6
};
const DAY_OF_WEEK = {
    0: "土",
    1: "日",
    2: "月",
    3: "火",
    4: "水",
    5: "木",
    6: "金"
}

exports.plan = functions.https.onRequest((request, response) => {
    const app = new App({request, response});

    function calcMojuro(app) {
        // let year = app.getArgument(YEAR_ARG);
        // let month = app.getArgument(MONTH_ARG);
        let date = app.getArgument(DATE_ARG);

        app.tell(""+date+"です．");
    }

    let actionMap = new Map();
    actionMap.set(NAME_ACTION, calcMojuro);

    app.handleRequest(actionMap);
});
