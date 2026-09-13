// Fixed demo timeline. All averages, highlights and notifications share this data.
const CLIMATE_END = Date.UTC(2026, 8, 13);
const DAY_MS = 86400000;
const HUMIDITY_EPISODE = { start: '2026-08-20', end: '2026-09-09', device: 0 };
const CLIMATE_PERIODS = ['24時間', '7日間', '1カ月', '1年'];
const climateEvents = [
  {date:'2026-09-09', time:'21:00', days:21, title:'高湿度が3週間継続・害虫とカビに注意', detail:'キッチン下で日平均湿度70%以上が8/20〜9/9の21日間続きました。高湿度の継続により、害虫・カビの発生リスクが高まった想定です。'},
  {date:'2026-09-02', time:'21:00', days:14, title:'高湿度が2週間継続・リスク上昇を通知', detail:'キッチン下で8/20から14日間、日平均湿度70%以上が続きました。周辺の湿気や通気の状態を確認するタイミングです。'}
];

function dailyClimate(deviceIndex) {
  const d = devices[deviceIndex];
  return Array.from({length:365}, (_, i) => {
    const timestamp = CLIMATE_END - (364-i)*DAY_MS;
    const date = new Date(timestamp).toISOString().slice(0,10);
    const season = Math.cos((timestamp-Date.UTC(2026,7,1))/DAY_MS*2*Math.PI/365);
    let humidity = Math.round(57 + season*5 + Math.sin(i*.62+deviceIndex)*4 + [0,5,1,-9][deviceIndex]);
    if (deviceIndex === 0 && date >= HUMIDITY_EPISODE.start && date <= HUMIDITY_EPISODE.end) humidity = 76 + i%5;
    if (i===364) humidity=d.humidity;
    const temp = i===364 ? d.temp : Math.round((22+season*5+Math.sin(i*.4)*.6+[.8,-.5,1.4,-1][deviceIndex])*10)/10;
    return {date, timestamp, humidity, temp};
  });
}

function climateData(deviceIndex, period) {
  if (period==='24時間') {
    const d=devices[deviceIndex];
    return Array.from({length:25},(_,i)=>({
      timestamp:CLIMATE_END+9*3600000-(24-i)*3600000,
      date:new Date(CLIMATE_END+9*3600000-(24-i)*3600000).toISOString().slice(0,10),
      humidity:i===24?d.humidity:Math.round(d.humidity-2+Math.sin(i*.4)*3),
      temp:i===24?d.temp:Math.round((d.temp-1+Math.sin(i*.3)*1.4)*10)/10
    }));
  }
  const length=period==='7日間'?7:period==='1カ月'?31:365;
  return dailyClimate(deviceIndex).slice(-length);
}
function climateStats(data) {
  let longest=0, run=0;
  const hourly=data.length>1 && data[1].timestamp-data[0].timestamp<DAY_MS;
  data.forEach((d,i)=>{run=d.humidity>=70?(hourly?(i>0 && data[i-1].humidity>=70?run+1:0):run+1):0;longest=Math.max(longest,run);});
  return {average:Math.round(data.reduce((n,d)=>n+d.humidity,0)/data.length),max:Math.max(...data.map(d=>d.humidity)),longest};
}
function climateDate(date){const d=new Date(date);return `${d.getUTCMonth()+1}/${d.getUTCDate()}`;}
function climateChart(data, period, deviceIndex) {
  const x=i=>48+i/(data.length-1)*510;
  const yH=v=>224-(v-30)/60*162;
  const yT=v=>224-(v-5)/30*162;
  const episode=deviceIndex===0 && period!=='24時間';
  const indices=data.map((d,i)=>episode && d.date>=HUMIDITY_EPISODE.start && d.date<=HUMIDITY_EPISODE.end?i:-1).filter(i=>i>=0);
  const left=indices.length?x(indices[0]):0, right=indices.length?x(indices.at(-1)):0;
  const ticks=period==='1年'?[0,73,146,219,292,364]:Array.from({length:period==='7日間'?7:5},(_,i)=>Math.round(i*(data.length-1)/(period==='7日間'?6:4)));
  const desc=indices.length?'。オレンジの帯は8月20日から9月9日の高湿度継続期間。9月2日に2週間、9月9日に3週間のリスク上昇通知。':'';
  return `<svg class="chart climate-chart" viewBox="0 0 610 275" role="img" aria-label="${period}の温湿度グラフ。温度は左軸5〜35℃、湿度は右軸30〜90%。${desc}">
    ${indices.length?`<rect x="${left}" y="58" width="${Math.max(right-left,3)}" height="166" fill="#f8dca5" opacity=".48"/>`:''}
    ${[0,1,2,3].map(i=>`<path class="grid" d="M48 ${62+i*54}H558"/><text x="15" y="${66+i*54}">${35-i*10}</text><text x="570" y="${66+i*54}">${90-i*20}</text>`).join('')}
    <text x="14" y="44">℃</text><text x="576" y="44">%</text>
    <path d="M48 ${yH(70)}H558" stroke="#ce8937" stroke-dasharray="6 4"/><text x="552" y="${yH(70)-6}" text-anchor="end">湿度70%の目安</text>
    <polyline class="temperature" points="${data.map((d,i)=>`${x(i)},${yT(d.temp)}`).join(' ')}"/>
    <polyline class="humidity" points="${data.map((d,i)=>`${x(i)},${yH(d.humidity)}`).join(' ')}"/>
    ${episode?climateEvents.filter(e=>data.some(d=>d.date===e.date)).map((e,i)=>{const index=data.findIndex(d=>d.date===e.date);const px=x(index);return `<path d="M${px} ${yH(data[index].humidity)}V${18+i*18}" stroke="#bd663f" stroke-dasharray="3 3"/><circle cx="${px}" cy="${yH(data[index].humidity)}" r="5" fill="#bf6543"/><text x="${Math.min(px,552)}" y="${14+i*18}" text-anchor="end" class="event-chart-label">${climateDate(e.date)} ${e.days===21?'3週間':'2週間'}継続・通知</text>`;}).join(''):''}
    ${ticks.map(i=>`<text x="${x(i)}" y="251" text-anchor="middle">${period==='24時間'?new Date(data[i].timestamp).getUTCHours()+'時':climateDate(data[i].date)}</text>`).join('')}
  </svg>`;
}

function climateScreen(d, select) {
  const period=state.period, data=climateData(state.device,period), stats=climateStats(data);
  const longView=period==='1カ月'||period==='1年';
  const relevant=state.device===0 && period!=='24時間';
  const visibleEvents=relevant?climateEvents.filter(e=>data.some(d=>d.date===e.date)):[];
  const dateRange=period==='24時間'?'9/12 09:00〜9/13 09:00':`${data[0].date.replaceAll('-','/')}〜2026/09/13`;
  return head('ENVIRONMENT','温湿度とリスク',select)+`
    <div class="panel climate-panel"><div class="climate-heading"><h2>${icon('temp')} 温湿度の推移</h2><div class="segmented climate-periods" aria-label="表示期間">${CLIMATE_PERIODS.map(p=>`<button data-period="${p}" class="${period===p?'selected':''}" aria-pressed="${period===p}">${p}</button>`).join('')}</div></div>
    <p class="climate-range">${dateRange} · ${period==='24時間'?'1時間ごとの値':'日平均値'}</p>
    ${climateChart(data,period,state.device)}
    <div class="legend climate-legend"><span><i class="dot"></i>温度（左軸）</span><span><i class="dot amber"></i>湿度（右軸）</span>${relevant?'<span><i class="episode-dot"></i>高湿度継続期間</span>':''}</div>
    <div class="grid3">${metric('期間平均湿度',stats.average+'%')+metric('期間最大湿度',stats.max+'%')+metric('70%以上の最長継続',stats.longest+(period==='24時間'?'時間':'日'))}</div>
    <p class="screen-note">デモ基準：日平均湿度70%以上の継続をリスクの目安として表示。リスク評価はサンプルです。</p></div>
    ${relevant?`<section class="panel humidity-story"><h2>${icon('alert')} 高湿度が続いた期間に注目</h2><p><strong>キッチン下 / 8月20日〜9月9日</strong><br>日平均湿度76〜80%が21日間続いたサンプルです。9/2に2週間、9/9に3週間の継続を検知し、害虫・カビの発生リスク上昇を通知しました。</p><div class="risk-milestones"><span>8/20<br><strong>高湿度が開始</strong></span><span>9/2<br><strong>2週間・注意</strong></span><span>9/9<br><strong>3週間・リスク上昇</strong></span></div>${!longView?'<button class="secondary" data-period="1カ月">1カ月で継続期間全体を見る →</button>':''}<a class="secondary" href="#mini/alerts">通知履歴を見る →</a><p class="screen-note">9/10以降は湿度が低下。過去のリスク上昇通知と現在の状態は別に表示しています。</p></section>`:`<p class="tip"><strong>${icon('drop')} 長期の変化もチェック</strong>短期の上下だけでなく、高湿度が続く期間を確認できます。<button class="secondary" data-climate-event="month">キッチン下の3週間継続デモを見る →</button></p>`}
    <div class="panel"><h2>この表示期間のリスク評価</h2>${[['害虫',relevant?'高':period!=='24時間' && stats.longest>=14?'高':'低'],['カビ',relevant?'高':period!=='24時間' && stats.longest>=14?'高':'低']].map(([n,r])=>`<div class="list-row"><span class="circle-icon">${icon(n==='害虫'?'bug':'drop')}</span><div class="grow"><strong>${n}の発生リスク</strong><p>${relevant?'高湿度継続による過去のリスク上昇を含む':'表示期間の湿度継続状況から表示するデモ評価'}</p></div>${badge(r)}</div>`).join('')}<p class="screen-note">現在値：${d.temp}℃ / ${d.humidity}%。グラフは${period==='24時間'?'時間ごと':'日平均'}のサンプル値です。</p></div>
    ${visibleEvents.length?`<div class="panel"><h2>グラフ内の通知イベント</h2>${visibleEvents.map(e=>`<div class="list-row"><span class="circle-icon">${icon('alert')}</span><div><small>${e.date} ${e.time}</small><p>${e.title}</p></div></div>`).join('')}</div>`:''}`;
}
function humidityNotifications() {
  return `<h2 class="section-title">高湿度の継続による通知履歴</h2>${climateEvents.map(e=>`<article class="panel notice ${state.read?'':'unread'}"><div class="row"><small>${e.date.replaceAll('-','/')} ${e.time}</small>${state.read?'':badge('未読')}</div><h2>${e.title}</h2><p>${e.detail}</p><button class="secondary" data-climate-event="${e.date}">キッチン下の1カ月グラフを見る →</button></article>`).join('')}`;
}
