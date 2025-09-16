// 载入本地 modes.json 并渲染
async function loadModes(){
  try{
    const res = await fetch('modes.json');
    const modes = await res.json();
    renderModes(modes);
    populateSelect(modes);
  }catch(e){
    console.error('加载玩法失败',e);
    document.getElementById('modes-list').innerHTML='<p>无法加载玩法数据（请确保有 modes.json）</p>'
  }
}

function renderModes(modes){
  const container = document.getElementById('modes-list');
  container.innerHTML='';
  modes.forEach(m=>{
    const div = document.createElement('div');
    div.className='mode-card';
    div.innerHTML = `<i class="fas fa-gamepad" style="color:var(--accent); font-size:1.5rem; margin-bottom:0.5rem;"></i><h3>${escapeHtml(m.name)}</h3><p>${escapeHtml(m.description)}</p><p><strong>类别：</strong>${escapeHtml(m.category)}</p>`;
    container.appendChild(div);
  })
}

function populateSelect(modes){
  const sel = document.getElementById('mode-select');
  sel.innerHTML='';
  modes.forEach(m=>{
    const opt = document.createElement('option');opt.value=m.id;opt.textContent=m.name;sel.appendChild(opt)
  })
}

function escapeHtml(str){
  if(!str) return '';
  return str.replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

function startPlay(){
  const sel = document.getElementById('mode-select');
  const id = sel.value;
  fetch('modes.json').then(r=>r.json()).then(modes=>{
    const m = modes.find(x=>x.id===id);
    const out = document.getElementById('play-output');
    if(!m){out.textContent='玩法未找到';return}
    out.textContent = `试玩：${m.name}\n\n描述：${m.description}\n\n规则：\n` + m.rules.map((r,i)=>`${i+1}. ${r}`).join('\n');
  })
}

function exportMode(){
  const sel = document.getElementById('mode-select');
  const id = sel.value;
  fetch('modes.json').then(r=>r.json()).then(modes=>{
    const m = modes.find(x=>x.id===id);
    if(!m){alert('玩法未找到');return}
    const blob = new Blob([JSON.stringify(m,null,2)],{type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');a.href=url;a.download=`mode-${m.id}.json`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  })
}

document.getElementById('start-btn').addEventListener('click',startPlay);
document.getElementById('export-btn').addEventListener('click',exportMode);
window.addEventListener('load',loadModes);

document.querySelector('.theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const icon = document.querySelector('.theme-toggle i');
  icon.classList.toggle('fa-moon');
  icon.classList.toggle('fa-sun');
});
