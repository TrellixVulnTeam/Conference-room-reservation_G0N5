'use strict';
const async = require('async');

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').DialogflowApp;
const functions = require('firebase-functions');

const NAME_ACTION = "plan";
const DATE_ARG = "date";
let timeMin = null;
let timeMax = null;
let flag = null;
let schejule = new Array();
let response_schejule = new Array();
let spacetime = "";
let check = "";
let count = 0;
let response_timeMin_date

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

exports.plan = functions.https.onRequest((request, response) => {
    const app = new App({request, response});
    let actionMap = new Map();

    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Google Calendar API.
      async.series([
        function(callback) {
          authorize(JSON.parse(content), listEvents);
          setTimeout(callback, 1000);
        }, function(callback) {
          actionMap.set(NAME_ACTION, combining_time);
          app.handleRequest(actionMap);
          return console.log('処理終了');
        }
      ], function(err, results) {
        if (err) {
          return console.log('err[' + err + ']');
        }
      });
    })

    //oAuth認証
    function authorize(credentials, callback) {
      const {client_secret, client_id, redirect_uris} = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
          client_id, client_secret, redirect_uris[0]);

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getAccessToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
      });
    }

    function getAccessToken(oAuth2Client, callback) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log('Authorize this app by visiting this url:', authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) return console.error('Error retrieving access token', err);
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) console.error(err);
            console.log('Token stored to', TOKEN_PATH);
          });
          callback(oAuth2Client);
        });
      });
    }

    /**
     * Lists the next 10 events on the user's primary calendar.
     * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
     */
    function listEvents(auth) {
      const calendar = google.calendar({version: 'v3', auth});
      const calendarID = 'reservation@mikilab.doshisha.ac.jp';
      let res = '処理が終わって結果を返したい場合は resolve()の中で返す。'
      timeMin = app.getArgument(DATE_ARG) + 'T00:00:00+09:00';
      timeMax = app.getArgument(DATE_ARG) + 'T23:59:59+09:00';
      let before_start;
      let before_end;
      let start;
      let end;
      response_timeMin_date = timeMin.slice(0,10).replace('-', '年').replace('-', '月') + '日';
      let response_timeMax_date = timeMax.slice(0,10).replace('-', '年').replace('-', '月') + '日';
      let response_timeMin = timeMin.slice(11,16).replace(':', '時') + '分';
      let response_timeMax = timeMax.slice(11,16).replace(':', '時') + '分';
      let response_before_start;
      let response_before_end;
      let response_start;
      let response_end;

      calendar.events.list({
        calendarId: calendarID,
        timeMin: timeMin,
        timeMax: timeMax,
        singleEvents: true,
        orderBy: 'startTime',
        timeZone: 'Asia/Tokyo',
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const events = res.data.items;
        if (events.length) {
          events.map((event, i) => {
            if ( (events[i].start.dateTime || events[i].start.date).match(/T/) && (events[i].end.dateTime || events[i].end.date).match(/T/)) {
              start = events[i].start.dateTime || events[i].start.date; //開始時間
              end = events[i].end.dateTime || events[i].end.date; //終了時間
              if(i === 0){
                if(events.length === 1){
                  if(timeMin !== start){
                    response_start = start.slice(11,16).replace(':', '時') + '分';
                    response_end = end.slice(11,16).replace(':', '時') + '分';
                    schejule.push(`${timeMin}から${start}まで\n`);
                    response_schejule.push(`${response_timeMin}から${response_start}までと\n`);
                    console.log(`${schejule[count]}`);
                    count++;
                    schejule.push(`${end}から${timeMax}まで\n`);
                    response_schejule.push(`${response_end}から${response_timeMax}までと\n`);
                    count++;
                  }
                }
                else{
                    if(timeMin !== start){
                      response_start = start.slice(11,16).replace(':', '時') + '分';
                      schejule.push(`${timeMin}から${start}まで\n`);
                      response_schejule.push(`${response_timeMin}から${response_start}までと\n`);
                      console.log(`${schejule[count]}`);
                      count++;
                    }
                }
              }
              else if(i === events.length - 1){
                before_start = events[i-1].start.dateTime || events[i-1].start.date;
                before_end = events[i-1].end.dateTime || events[i-1].end.date;
                response_before_start = before_start.slice(11,16).replace(':', '時') + '分';
                response_before_end = before_end.slice(11,16).replace(':', '時') + '分';
                if(before_end !== start){
                  schejule.push(`${before_end}から${start}まで\n`);
                  response_schejule.push(`${response_before_end}から${response_start}までと\n`);
                  console.log(`${schejule[count]}`);
                  count++;
                }
                if(end !== timeMax){
                  schejule.push(`${end}から${timeMax}までと\n`);
                  response_schejule.push(`${response_end}から${response_timeMax}までと\n`);
                  console.log(`${schejule[count]}`);
                  count++;
                }
              }
              else{
                if((events[i-1].end.dateTime || events[i-1].end.date).match(/T/)){
                  before_end = events[i-1].end.dateTime || events[i-1].end.date;
                }
                else{ before_end = timeMin; }

                if(before_end !== start){
                  response_before_end = before_end.slice(11,16).replace(':', '時') + '分';
                  schejule.push(`${before_end}から${start}までと\n`);
                  response_schejule.push(`${response_before_end}から${response_start}までと\n`);
                  console.log(`${schejule[count]}`);
                  count++;
                }
              }
            }
          });
        } else {
            console.log('その日は全日予定が空いています');
        }
      });
   }

   function combining_time(app) {
     for (var i = 0; i < response_schejule.length; i++) {
       if( i === response_schejule.length-1){
         response_schejule[i] = response_schejule[i].replace('までと','まで');
       }
       spacetime += response_schejule[i];
     }
     if(spacetime === check){ app.tell(`その日は全日予定が空いています`);}
     else { app.tell(`${response_timeMin_date}で空いている時間は\n${spacetime}です．`); }
     for (i = 0; i < schejule.length; i++) {
       schejule[i] = "";
       response_schejule[i] = "";
     }
     spacetime = "";
   }
});
