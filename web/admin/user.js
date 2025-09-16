// 用户登录/注册演示（实际需后端支持）
document.getElementById('login-form').addEventListener('submit',function(e){
  e.preventDefault();
  alert('登录成功（演示，实际需后端验证）');
  window.location.href='index.html';
});
document.getElementById('register-form').addEventListener('submit',function(e){
  e.preventDefault();
  alert('注册成功（演示，实际需后端验证）');
  window.location.href='index.html';
});
