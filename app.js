const healthItems = [
  {id:'comfort', icon:'⌂', tone:'good', title:'快適性', sub:'室温 24.1℃ / 湿度 48% / CO₂ 620ppm', status:'良好', note:'快適', detail:'リビングを中心に、温湿度・CO₂とも快適な範囲です。現在の運転を維持してください。'},
  {id:'air', icon:'◌', tone:'good', title:'空気の健康度', sub:'VOC 低 / ニオイ 良好', status:'良好', note:'安定', detail:'VOCとニオイの変化は小さく、空気環境は安定しています。'},
  {id:'mold', icon:'△', tone:'warn', title:'カビ・結露リスク', sub:'北側収納でリスク上昇', status:'注意', note:'換気推奨', detail:'北側収納の湿度が上昇しています。30分間の換気、または除湿運転をおすすめします。'},
  {id:'pest', icon:'✣', tone:'good', title:'害虫リスク', sub:'侵入リスク 低', status:'良好', note:'低リスク', detail:'直近24時間で害虫の検知はありません。温湿度条件から見た発生リスクも低い状態です。'},
  {id:'house', icon:'⌁', tone:'alert', title:'住宅劣化リスク', sub:'床下の湿度が上昇傾向', status:'注意', note:'点検候補', detail:'床下の湿度が通常より高めです。傾向が続く場合は専門業者による点検をおすすめします。'},
  {id:'energy', icon:'↯', tone:'good', title:'エネルギー効率', sub:'今月の消費電力 −12%', status:'良好', note:'省エネ', detail:'先月同時期より消費電力が12%少ないペースです。空調運転も効率的です。'},
];

const list = document.getElementById('healthList');
healthItems.forEach(item => {
  const row = document.createElement('div');
  row.className = 'health-row';
  row.dataset.id = item.id;
  row.innerHTML = `
    <div class="health-icon icon-${item.tone}">${item.icon}</div>
    <div><div class="health-title">${item.title}</div><div class="health-sub">${item.sub}</div></div>
    <div class="status"><strong class="${item.tone}">${item.status}</strong><small>${item.note}</small></div>
    <div class="chev">›</div>`;
  row.addEventListener('click',()=>openSheet(item.id));
  list.appendChild(row);
});

const sheet = document.getElementById('bottomSheet');
const backdrop = document.getElementById('modalBackdrop');
const sheetContent = document.getElementById('sheetContent');
const close = document.getElementById('sheetClose');

function openSheet(id){
  const item = healthItems.find(x=>x.id===id) || healthItems[0];
  sheetContent.innerHTML = `
    <div class="sheet-kicker">AIホームドクター診断</div>
    <h2 class="sheet-title">${item.title}</h2>
    <span class="pill sheet-status ${item.tone}">${item.status}</span>
    <div class="sheet-text">${item.detail}</div>
    <div class="sheet-box"><strong>おすすめアクション</strong><p>${actionFor(item.id)}</p></div>`;
  backdrop.hidden = false; sheet.hidden = false;
}
function actionFor(id){
  return ({comfort:'現在の設定を維持してください。',air:'必要に応じて短時間の換気を行ってください。',mold:'北側収納を30分換気。改善しない場合は除湿運転を推奨します。',pest:'特別な対応は不要です。引き続き見守ります。',house:'床下湿度を継続監視し、3日以上高い場合は点検を検討してください。',energy:'現在の省エネ運転を継続してください。'})[id];
}
function closeSheet(){sheet.hidden=true;backdrop.hidden=true}
close.addEventListener('click',closeSheet);backdrop.addEventListener('click',closeSheet);
document.querySelector('[data-open="mold"]').addEventListener('click',()=>openSheet('mold'));
