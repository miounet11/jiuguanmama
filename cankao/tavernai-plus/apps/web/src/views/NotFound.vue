<template>
  <div class="not-found">
    <div class="container">
      <div class="error-code">404</div>
      <h1>页面未找到</h1>
      <p>抱歉，您访问的页面不存在或已被移除</p>
      <router-link to="/" class="btn btn-primary">
        返回首页
      </router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  text-align: center;
  color: white;
}

.error-code {
  font-size: 8rem;
  font-weight: bold;
  opacity: 0.8;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.btn {
  display: inline-block;
  padding: 1rem 2rem;
  background: white;
  color: #667eea;
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
  transition: transform 0.3s;
}

.btn:hover {
  transform: scale(1.05);
}
</style>
