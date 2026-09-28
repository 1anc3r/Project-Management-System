<template>
  <router-view />
</template>

<script setup>
// 说明：App 层不再套 keep-alive。
// 此处渲染的是布局组件 MainLayout，其组件名与 cachedViews 中的业务路由名永不匹配，
// 该层缓存实际不生效；且一旦 cachedViews 出现 "MainLayout"，会把整个布局缓存下来，
// 与 MainLayout 内部基于标签页的缓存冲突。页面缓存统一由 MainLayout 的 router-view 负责。
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Element Plus 样式覆盖 */
.el-menu {
  border-right: none !important;
}

.el-table .cell {
  white-space: nowrap;
}

.el-dialog__body {
  padding: 20px;
}
</style>
