<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="tabStore.systemCachedViews">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup>
// 系统管理布局组件：仅作为子路由的容器
// 子页面（用户/日志/字典）是嵌套路由，MainLayout 层缓存的是本容器，
// 因此子页面的缓存必须由这里的 keep-alive 负责，名单取自 tabStore.systemCachedViews
import { useTabStore } from '@/stores/tabs'

defineOptions({ name: 'System' })

const tabStore = useTabStore()
</script>
