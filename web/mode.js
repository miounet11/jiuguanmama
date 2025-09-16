// 玩法详情页逻辑
function getQueryParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

async function loadMode(){
  const id = getQueryParam('id');
  const res = await fetch('api/modes.json');
  const modes = await res.json();
  const mode = modes.find(m=>m.id===id);
  if(!mode){document.getElementById('mode-detail').innerHTML='<p>玩法未找到</p>';return;}
  document.getElementById('mode-title').textContent=mode.name;
  document.getElementById('mode-detail').innerHTML = `
    <img src='img/${mode.image}' alt='${mode.name}' style='max-width:320px;border-radius:8px;margin-bottom:12px;'>
    <h2>${mode.name}</h2>
    <p><strong>类别：</strong>${mode.category}</p>
    <p>${mode.description}</p>
    <h3>规则</h3>
    <ul>${mode.rules.map(r=>`<li>${r}</li>`).join('')}</ul>
    <h3>示例</h3>
    <pre>${JSON.stringify(mode.example,null,2)}</pre>
  `;
  loadComments(id);
}

async function loadComments(modeId){
  const res = await fetch('api/comments.json');
  const comments = await res.json();
  const list = document.getElementById('comments-list');
  list.innerHTML = comments.filter(c=>c.modeId===modeId).map(c=>`<div><strong>${c.user}</strong>：${c.content} <span style='color:#888'>${c.time}</span></div>`).join('') || '<p>暂无评论</p>';
}

document.getElementById('comment-form').addEventListener('submit',function(e){
  e.preventDefault();
  alert('评论提交成功（演示，实际需后端）');
  document.getElementById('comment-content').value='';
});

window.addEventListener('load',loadMode);
