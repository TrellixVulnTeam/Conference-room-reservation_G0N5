let timeMin = '2018-11-30T00:00:00+09:00までと';
let date = timeMin.slice(0,9).replace('-', '年').replace('-', '月') + '日';
// date = date.replace('-', '月') + '日';
let time = timeMin.slice(11,16).replace(':', '時') + '分';
let aaa = timeMin.replace('までと', 'まで');
console.log(`${aaa}`);
console.log(`${date}`);
console.log(`${time}`);
