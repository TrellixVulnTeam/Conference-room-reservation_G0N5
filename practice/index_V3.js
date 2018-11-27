'use strict';
const co = require('co');

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').DialogflowApp;
const functions = require('firebase-functions');

const NAME_ACTION = "plan";
const DATE_ARG = "date";
let timeMin = null;
let timeMax = null;
let flag = null;
let schejule = new Array();
let spacetime = "";
let count = 0;

const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = 'token.json';

exports.plan = functions.https.onRequest((request, response) => {
    const app = new App({request, response});
    let actionMap = new Map();
    timeMin = app.getArgument(DATE_ARG) + 'T00:00:00+09:00';
    timeMax = app.getArgument(DATE_ARG) + 'T23:59:59+09:00';

    co(function *() {
      // 1番目の処理。特にデータを受け取らないで動くものの場合
          // 変数の中で、yield を頭に付けて関数を動かす。
      let syori1 = yield func_1();
      // syori1の値を使って２番目の関数が処理をする
      let syori2 = yield func_2(syori1);
    });

    function func_1() {
    // promiseで包む
    return new Promise((resolve) => {
        console.log('何かしたい処理はPromiseでくるんだ中に書く');
        let res = '処理が終わって結果を返したい場合は resolve()の中で返す。'
        // Load client secrets from a local file.
        fs.readFile('credentials.json', (err, content) => {
          if (err) return console.log('Error loading client secret file:', err);
          // Authorize a client with credentials, then call the Google Calendar API.
          authorize(JSON.parse(content), listEvents);
        })
        // 関数の処理が終わったらresolve();する。
        resolve(res);
      });
    }

    function func_2(request) {
      // promiseで包む
      return new Promise((resolve) => {
          // 受け取ったrequestを処理してresponseを返す
          let response = 'Response: ' + request
          actionMap.set(NAME_ACTION, combining_time);
          app.handleRequest(actionMap);

          // 関数の処理が終わったらresolve();する。
          resolve(response);
      });
    }

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
      const calendarID = 'smurano@mikilab.doshisha.ac.jp';
      let res = '処理が終わって結果を返したい場合は resolve()の中で返す。'

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
            const start = events[i].start.dateTime || events[i].start.date; // 開始時間
            const end = events[i].end.dateTime || events[i].end.date; //終了時 間
            if(i === 0){
              if(timeMin !== start){ schejule.push(""+timeMin+"から"+start+"ま で"); console.log(`${schejule[count]}`); count++; }
            }
            else if(i === events.length - 1){
              const before_start = events[i-1].start.dateTime ||  events[i-1].start.date;
              const before_end = events[i-1].end.dateTime ||  events[i-1].end.date;
              if(before_end !== start){ schejule.push(""+before_end+"か ら"+start+"まで"); console.log(`${schejule[count]}`); count++; }
              if(end !== timeMax){ schejule.push(""+end+"から"+timeMax+"まで"); console.log(`${schejule[count]}`); count++; }
            }
            else{
              const before_end = events[i-1].end.dateTime || events[i-1].end.date;
              if(before_end !== start){  schejule.push(""+before_end+"から"+start+"まで"); console.log(`${schejule[count]}`); count++; }
            }
          });
        } else {
            console.log('その日の予定は空いています');
        }
      });
   }

   function combining_time(app) {
     for (var i = 0; i < schejule.length; i++) {
       spacetime += schejule[i];
     }
     app.tell(""+spacetime+"が空いています．");
     schejule = new Array();
     spacetime = "";
   }
});
