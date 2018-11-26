const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Calendar API.
  authorize(JSON.parse(content), listEvents);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
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

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
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
  // var calendarID = '655147675926-96q8617upo9emvlerck9s5o58h7apref.apps.googleusercontent.com';
  const timeMin = '2018-11-26T00:00:00+09:00';
  const timeMax = '2018-11-27T00:00:00+09:00';
  // const timeMin = '2018-11-26';
  // const timeMax = '2018-11-27';
  calendar.events.list({
    calendarId: 'smurano@mikilab.doshisha.ac.jp',
    // timeMin: (new Date()).toISOString(),
    // maxResults: 10
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
        const start = events[i].start.dateTime || events[i].start.date; //開始時間
        const end = events[i].end.dateTime || events[i].end.date; //終了時間
        if(i == 0){
          if(timeMin != start){ console.log(`${timeMin} - ${start}`); }
        }
        else if(i == events.length - 1){
          const before_start = events[i-1].start.dateTime || events[i-1].start.date;
          const before_end = events[i-1].end.dateTime || events[i-1].end.date;
          if(before_end != start){ console.log(`${before_end} - ${start}`); }
          if(end != timeMax){ console.log(`${end} - ${timeMax}`); }
        }
        else{
          const before_end = events[i-1].end.dateTime || events[i-1].end.date;
          if(before_end != start){ console.log(`${before_end} - ${start}`); }
        }
      });
    } else {
        console.log('その日の予定は空いています');
    }
  });
}
