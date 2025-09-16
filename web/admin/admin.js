// 管理后台核心逻辑（演示版，实际需后端支持）
async function loadModes(){
  const res = await fetch('../api/modes.json');
  const modes = await res.json();
  renderAdminList(modes);
}

function renderAdminList(modes){
  const list = document.getElementById('modes-admin-list');
  list.innerHTML = '';
  modes.forEach(m=>{
    const div = document.createElement('div');
    div.className = 'mode-admin-card';
    div.innerHTML = `<h3>${m.name}</h3><p>${m.description}</p><div class='actions'><button onclick='editMode("${m.id}")'>编辑</button><button onclick='deleteMode("${m.id}")'>删除</button></div>`;
    list.appendChild(div);
  });
}

window.addMode = function(){
  alert('新增玩法功能演示，实际需后端支持');
}
window.editMode = function(id){
  window.location.href = 'edit.html?id=' + encodeURIComponent(id);
}
window.deleteMode = function(id){
  if(confirm('确定要删除玩法 '+id+' 吗？')){
    alert('删除成功（演示，实际需后端）');
  }
}

document.getElementById('add-mode-btn').addEventListener('click',addMode);
window.addEventListener('load',loadModes);
