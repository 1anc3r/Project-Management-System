<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="tabStore.toolsCachedViews">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>

<script setup>
// 工具箱布局组件：仅作为子路由的容器
// 各测算工具是嵌套路由，MainLayout 层缓存的是本容器，
// 因此工具的缓存必须由这里的 keep-alive 负责，名单取自 tabStore.toolsCachedViews
import { useTabStore } from '@/stores/tabs'

defineOptions({ name: 'Tools' })

const tabStore = useTabStore()
</script>
