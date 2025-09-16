// 玩法市场首页搜索与筛选功能
let allModes = [];

async function loadModes(){
  const res = await fetch('api/modes.json');
  allModes = await res.json();
  renderModes(allModes);
  populateCategoryFilter(allModes);
}

function renderModes(modes){
  const container = document.getElementById('modes-list');
  container.innerHTML='';
  modes.forEach(m=>{
    const div = document.createElement('div');
    div.className='mode-card';
    div.innerHTML = `<i class="fas fa-gamepad" style="color:var(--accent); font-size:1.5rem; margin-bottom:0.5rem;"></i><h3>${escapeHtml(m.name)}${m.price?'<span class="paid">付费</span>':''}</h3><p>${escapeHtml(m.description)}</p><p><strong>类别：</strong>${escapeHtml(m.category)}</p><a href='mode.html?id=${m.id}'>详情</a>`;
    container.appendChild(div);
  })
}

function escapeHtml(str){
  if(!str) return '';
  return str.replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

function searchModes(){
  const kw = document.getElementById('search-input').value.trim().toLowerCase();
  const cat = document.getElementById('category-filter').value;
  let filtered = allModes.filter(m=>
    (!kw || m.name.toLowerCase().includes(kw) || m.description.toLowerCase().includes(kw)) &&
    (!cat || m.category===cat)
  );
  renderModes(filtered);
}

function populateCategoryFilter(modes){
  const sel = document.getElementById('category-filter');
  const cats = Array.from(new Set(modes.map(m=>m.category)));
  sel.innerHTML = '<option value="">全部</option>' + cats.map(c=>`<option value="${c}">${c}</option>`).join('');
}

document.getElementById('search-input').addEventListener('input',searchModes);
document.getElementById('category-filter').addEventListener('change',searchModes);
window.addEventListener('load',loadModes);
