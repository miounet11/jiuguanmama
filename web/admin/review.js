// 玩法审核流程（演示版）
async function loadPending(){
  const res = await fetch('../api/modes.json');
  const modes = await res.json();
  const pending = modes.filter(m=>m.status==='pending');
  renderReviewList(pending);
}

function renderReviewList(modes){
  const list = document.getElementById('review-list');
  list.innerHTML = '';
  if(modes.length===0){list.innerHTML='<p>暂无待审核玩法</p>';return;}
  modes.forEach(m=>{
    const div = document.createElement('div');
    div.className = 'mode-admin-card';
    div.innerHTML = `<h3>${m.name}</h3><p>${m.description}</p><div class='actions'><button onclick='approveMode("${m.id}")'>通过</button><button onclick='rejectMode("${m.id}")'>驳回</button></div>`;
    list.appendChild(div);
  });
}

window.approveMode = function(id){
  alert('审核通过（演示，实际需后端）');
}
window.rejectMode = function(id){
  alert('已驳回（演示，实际需后端）');
}

window.addEventListener('load',loadPending);
