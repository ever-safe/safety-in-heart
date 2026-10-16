/* ============ 通用 ============ */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

function go(page, openId){
  $$('.page').forEach(p => p.classList.remove('active'));
  $('#page-' + page).classList.add('active');
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.go === page));
  window.scrollTo({top:0});
  if(page === 'science' && openId){
    $$('.sci-item').forEach(it => it.classList.toggle('open', it.dataset.id === openId));
    requestAnimationFrame(()=>{
      const el = $('.sci-item[data-id="'+openId+'"]');
      if(el) el.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-go]');
  if(t){ go(t.dataset.go, t.dataset.open); }
});

/* ============ 首页：论述轮播 ============ */
(function quotes(){
  let idx = 0;
  const text = $('#quoteText'), from = $('#quoteFrom'), dots = $('#quoteDots');
  QUOTES.forEach((_, i) => {
    const d = document.createElement('i');
    d.onclick = () => { idx = i; render(); };
    dots.appendChild(d);
  });
  function render(){
    text.textContent = QUOTES[idx].t;
    from.textContent = QUOTES[idx].f;
    $$('#quoteDots i').forEach((d,i)=>d.classList.toggle('on', i===idx));
  }
  render();
  setInterval(()=>{ idx = (idx+1) % QUOTES.length; render(); }, 5000);
})();

/* ============ 应急科普 ============ */
(function science(){
  const wrap = $('#scienceList');
  SCIENCE.forEach(s => {
    const item = document.createElement('div');
    item.className = 'sci-item';
    item.dataset.id = s.id;
    item.innerHTML =
      '<div class="sci-head"><span class="sci-ico" style="background:'+s.color+'"><svg viewBox="0 0 24 24">'+s.icon+'</svg></span>'+
      '<span class="sci-head-name"><h3>'+s.name+'</h3><span>'+s.sub+'</span></span>'+
      '<span class="sci-arrow">▾</span></div>'+
      '<div class="sci-body"><div class="sci-body-inner"><span class="sci-tagline">口诀：'+s.tagline+'</span>'+
      s.tips.map(tip =>
        '<div class="sci-tip '+tip.type+'"><i></i><div><b>'+tip.t+'</b><em>'+tip.d+'</em></div></div>'
      ).join('') + '</div></div>';
    item.querySelector('.sci-head').onclick = () => item.classList.toggle('open');
    wrap.appendChild(item);
  });
})();

/* ============ 隐患排查 ============ */
(function hazard(){
  const tabs = $('#sceneTabs'), optsBox = $('#sceneOptions'), result = $('#sceneResult');
  let cur = 0, picked = new Set(), submitted = false;

  SCENES.forEach((s, i) => {
    const b = document.createElement('button');
    b.className = 'scene-tab' + (i===0 ? ' on' : '');
    b.textContent = s.name;
    b.onclick = () => { cur = i; load(); };
    tabs.appendChild(b);
  });

  function load(){
    picked = new Set(); submitted = false;
    $$('.scene-tab').forEach((b,i)=>b.classList.toggle('on', i===cur));
    const s = SCENES[cur];
    $('#sceneTitle').textContent = s.name;
    $('#sceneDesc').textContent = s.desc;
    result.hidden = true; result.className = 'scene-result';
    $('#sceneReset').hidden = true;
    $('#sceneSubmit').hidden = false;
    optsBox.innerHTML = '';
    s.opts.forEach((o, i) => {
      const d = document.createElement('div');
      d.className = 'scene-opt';
      d.innerHTML = '<span class="box">✓</span><span>'+o.t+'</span>';
      d.onclick = () => {
        if(submitted) return;
        if(picked.has(i)){ picked.delete(i); d.classList.remove('picked'); }
        else{ picked.add(i); d.classList.add('picked'); }
      };
      optsBox.appendChild(d);
    });
  }

  $('#sceneSubmit').onclick = () => {
    const s = SCENES[cur];
    const els = $$('.scene-opt');
    let rightCnt = 0, totalHazard = 0, wrongPick = 0;
    s.opts.forEach((o, i) => {
      const isPicked = picked.has(i);
      if(o.hazard){
        totalHazard++;
        if(isPicked){ rightCnt++; els[i].classList.add('right'); els[i].querySelector('.box').textContent='✓'; }
        else{ els[i].classList.add('miss'); els[i].querySelector('.box').textContent='!'; }
      }else if(isPicked){
        wrongPick++; els[i].classList.add('wrongpick'); els[i].querySelector('.box').textContent='✕';
      }
      els[i].onclick = null;
      const sm = document.createElement('small');
      sm.textContent = (o.hazard ? '隐患：' : '安全做法：') + o.why;
      els[i].appendChild(sm);
    });
    submitted = true;
    result.hidden = false;
    const perfect = rightCnt === totalHazard && wrongPick === 0;
    if(perfect){
      result.classList.add('good');
      result.innerHTML = '<b>排查到位！</b> 本场景 '+totalHazard+' 处隐患全部准确识别，且无误判。隐患险于明火，防范胜于救灾。';
    }else{
      result.classList.add('soso');
      result.innerHTML = '<b>排查结果：</b>共 '+totalHazard+' 处隐患，你找出 '+rightCnt+' 处'+
        (totalHazard-rightCnt>0 ? '，<b>漏选 '+(totalHazard-rightCnt)+' 处</b>' : '')+
        (wrongPick>0 ? '，误判 '+wrongPick+' 项安全做法为隐患' : '')+'。请对照下方讲解再学习一遍。';
    }
    $('#sceneSubmit').hidden = true;
    $('#sceneReset').hidden = false;
    result.scrollIntoView({behavior:'smooth', block:'nearest'});
  };

  $('#sceneReset').onclick = load;
  load();
})();

/* ============ 在线答题 ============ */
(function quiz(){
  const QUIZ_NUM = 10;
  let list = [], idx = 0, rightCnt = 0, wrongList = [], answered = false;
  const bestKey = 'safety_quiz_best';

  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }
  function best(){ return parseInt(localStorage.getItem(bestKey) || '0', 10); }
  function refreshBest(){
    const b = best();
    $('#home-best').textContent = b ? '最佳成绩 '+b+' 分' : '随机10题闯关';
    $('#quizBestTip').textContent = b ? '本机历史最佳成绩：'+b+' 分' : '';
  }

  function start(){
    list = shuffle(QUIZ).slice(0, QUIZ_NUM);
    idx = 0; rightCnt = 0; wrongList = [];
    $('#quizStart').hidden = true;
    $('#quizResult').hidden = true;
    $('#quizPlay').hidden = false;
    $('#reviewCard').hidden = true;
    renderQ();
  }

  function renderQ(){
    answered = false;
    const q = list[idx];
    $('#quizProgressText').textContent = (idx+1)+'/'+QUIZ_NUM;
    $('#quizProgressBar').style.width = ((idx)/QUIZ_NUM*100)+'%';
    $('#quizType').textContent = q.cat + ' · ' + q.type;
    $('#quizNo').textContent = '第 '+(idx+1)+' 题';
    $('#quizQuestion').textContent = q.q;
    $('#quizExplain').hidden = true;
    const box = $('#quizOptions');
    box.innerHTML = '';
    const keys = ['A','B','C','D'];
    q.opts.forEach((op, i) => {
      const b = document.createElement('button');
      b.className = 'quiz-option';
      b.innerHTML = '<span class="key">'+keys[i]+'</span><span>'+op+'</span>';
      b.onclick = () => choose(i, b);
      box.appendChild(b);
    });
  }

  function choose(i, btn){
    if(answered) return;
    answered = true;
    const q = list[idx];
    const btns = $$('.quiz-option');
    btns.forEach(b => b.disabled = true);
    btns[q.a].classList.add('correct');
    const ok = i === q.a;
    if(ok){ rightCnt++; }
    else{
      btn.classList.add('wrong');
      wrongList.push({q:q.q, mine:q.opts[i], right:q.opts[q.a], e:q.e});
    }
    const ex = $('#quizExplain');
    ex.hidden = false;
    $('#quizExplainTitle').textContent = ok ? '回答正确' : '回答错误';
    $('#quizExplainTitle').className = ok ? 'ok' : 'bad';
    $('#quizExplainText').textContent = q.e;
    $('#quizNext').textContent = idx === QUIZ_NUM-1 ? '查看成绩' : '下一题';
    ex.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  $('#quizNext').onclick = () => {
    if(idx < QUIZ_NUM-1){ idx++; renderQ(); }
    else{ finish(); }
  };

  function finish(){
    $('#quizPlay').hidden = true;
    $('#quizResult').hidden = false;
    const score = rightCnt * 10;
    if(score > best()) localStorage.setItem(bestKey, String(score));
    refreshBest();
    $('#resultScore').textContent = score;
    $('#resultRight').textContent = rightCnt;
    $('#resultWrong').textContent = QUIZ_NUM - rightCnt;
    let level, comment, color;
    if(score >= 90){ level='应急安全达人'; comment='安全知识功底扎实！把技能带给更多人，你就是身边的“安全宣传员”。'; color='#c8202f'; }
    else if(score >= 80){ level='安全小能手'; comment='基础很扎实，再把错题对应的处置要领复习一遍就更稳了。'; color='#e2a13c'; }
    else if(score >= 60){ level='及格 · 继续加油'; comment='已具备基本安全意识，建议回到“科普”和“隐患排查”模块巩固后再战。'; color='#2f6fc0'; }
    else{ level='需要补课'; comment='别担心，先认真学一遍“应急科普”，再从隐患场景练起，一定会进步。'; color='#6b7480'; }
    $('#resultLevel').textContent = level;
    $('#resultComment').textContent = comment;
    const C = 2*Math.PI*56;
    $('#resultRing').setAttribute('stroke', color);
    $('#resultRing').style.strokeDasharray = '0 '+C;
    requestAnimationFrame(()=>{
      $('#resultRing').style.strokeDasharray = (C*score/100)+' '+C;
    });
    const review = $('#reviewCard');
    if(wrongList.length){
      review.hidden = false;
      $('#reviewList').innerHTML = wrongList.map(w =>
        '<div class="review-item"><div class="q">'+w.q+'</div>'+
        '<div class="a"><em>'+w.mine+'</em><b>'+w.right+'</b></div>'+
        '<span class="e">解析：'+w.e+'</span></div>').join('');
    }else{
      review.hidden = false;
      $('#reviewList').innerHTML = '<div class="review-item"><div class="q" style="color:#1f9d57">全部答对，零错题，太棒了！</div></div>';
    }
    window.scrollTo({top:0});
  }

  $('#quizBegin').onclick = start;
  $('#quizAgain').onclick = start;
  $('#quizReview').onclick = () => {
    $('#reviewCard').scrollIntoView({behavior:'smooth', block:'start'});
  };
  refreshBest();
})();

/* ============ 守夜人 ============ */
(function watch(){
  $('#watchGrid').innerHTML = WATCH.map(w =>
    '<div class="watch-item"><span class="w-ico" style="background:'+w.color+'"><svg viewBox="0 0 24 24">'+w.icon+'</svg></span>'+
    '<h4>'+w.name+'</h4><p>'+w.desc+'</p></div>').join('');
})();
