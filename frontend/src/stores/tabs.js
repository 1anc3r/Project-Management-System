import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTabStore = defineStore('tabs', () => {
  // State
  const visitedViews = ref([
    { name: 'Dashboard', path: '/dashboard', title: '数据概览', fullPath: '/dashboard' }
  ])
  const cachedViews = ref(['Dashboard'])
  // 嵌套路由（/system/*）由 system/index.vue 容器内的 keep-alive 负责缓存，
  // 因此单独维护一份子页面缓存名单，避免与顶层 cachedViews 混用
  const systemCachedViews = ref([])
  // 同理，/tools/* 的工具页面由 tools/index.vue 容器缓存
  const toolsCachedViews = ref([])
  const activeTab = ref('/dashboard')

  // Getters
  const tabsList = computed(() => visitedViews.value)

  // Actions
  const addView = (view) => {
    const existing = visitedViews.value.find(v => v.path === view.path)

    if (existing) {
      // 同一路由带不同 query 再次进入时，同步最新的 fullPath，避免点标签回退到旧筛选条件
      existing.fullPath = view.fullPath
      existing.title = view.meta?.title || existing.title
    } else {
      visitedViews.value.push({
        name: view.name,
        path: view.path,
        title: view.meta?.title || view.name,
        fullPath: view.fullPath
      })
      // 嵌套路由：MainLayout 缓存的是 system/index.vue、tools/index.vue 容器，
      // 子页面需由容器内的 keep-alive 缓存，故单独记入对应名单而不进 cachedViews
      if (view.name && view.path?.startsWith('/system')) {
        if (!systemCachedViews.value.includes(view.name)) {
          systemCachedViews.value.push(view.name)
        }
      } else if (view.name && view.path?.startsWith('/tools')) {
        if (!toolsCachedViews.value.includes(view.name)) {
          toolsCachedViews.value.push(view.name)
        }
      } else if (view.name && !cachedViews.value.includes(view.name)) {
        // 添加到缓存
        cachedViews.value.push(view.name)
      }
    }
    activeTab.value = view.path
  }

  /**
   * 关闭指定标签
   * @param {string} path 标签路径
   * @returns {object|null} 关闭后应激活的标签（调用方用其 fullPath 跳转以保留 query）
   */
  const removeView = (path) => {
    const index = visitedViews.value.findIndex(v => v.path === path)
    if (index === -1) return null

    const view = visitedViews.value[index]
    visitedViews.value.splice(index, 1)
    // 从缓存中移除（顶层 / 系统子页面 / 工具页面三份名单都要处理）
    const cacheIndex = cachedViews.value.indexOf(view.name)
    if (cacheIndex > -1) {
      cachedViews.value.splice(cacheIndex, 1)
    }
    const sysCacheIndex = systemCachedViews.value.indexOf(view.name)
    if (sysCacheIndex > -1) {
      systemCachedViews.value.splice(sysCacheIndex, 1)
    }
    const toolsCacheIndex = toolsCachedViews.value.indexOf(view.name)
    if (toolsCacheIndex > -1) {
      toolsCachedViews.value.splice(toolsCacheIndex, 1)
    }

    // 如果关闭的是当前激活的标签，激活相邻标签
    if (activeTab.value === path) {
      const nextView = visitedViews.value[index] || visitedViews.value[index - 1] || null
      activeTab.value = nextView ? nextView.path : (visitedViews.value[0]?.path || '/dashboard')
      return nextView
    }
    return visitedViews.value.find(v => v.path === activeTab.value) || null
  }

  const removeOthers = (path) => {
    const current = visitedViews.value.find(v => v.path === path)
    const dashboard = visitedViews.value.find(v => v.name === 'Dashboard')

    // Dashboard 可能已被右键菜单关闭，此处必须判空，否则会写入 undefined 并在渲染时抛错
    visitedViews.value = dashboard ? [dashboard] : []
    cachedViews.value = dashboard ? ['Dashboard'] : []
    systemCachedViews.value = []
    toolsCachedViews.value = []

    if (current && current.path !== dashboard?.path) {
      visitedViews.value.push(current)
      // 嵌套路由子页面归入其容器自己的缓存名单，不混入顶层名单
      if (current.path?.startsWith('/system')) {
        systemCachedViews.value.push(current.name)
      } else if (current.path?.startsWith('/tools')) {
        toolsCachedViews.value.push(current.name)
      } else if (!cachedViews.value.includes(current.name)) {
        cachedViews.value.push(current.name)
      }
    }
    activeTab.value = current ? current.path : (dashboard?.path || '')
  }

  const removeAll = () => {
    const dashboard = visitedViews.value.find(v => v.name === 'Dashboard')
    visitedViews.value = dashboard ? [dashboard] : []
    cachedViews.value = dashboard ? ['Dashboard'] : []
    systemCachedViews.value = []
    toolsCachedViews.value = []
    activeTab.value = dashboard ? dashboard.path : ''
  }

  const setActiveTab = (path) => {
    activeTab.value = path
  }

  const updateTabPosition = (oldIndex, newIndex) => {
    // 索引非法时直接返回，避免 splice 静默插入 undefined
    if (!Number.isInteger(oldIndex) || !Number.isInteger(newIndex)) return
    if (oldIndex === newIndex) return
    if (oldIndex < 0 || oldIndex >= visitedViews.value.length) return
    if (newIndex < 0 || newIndex >= visitedViews.value.length) return

    const item = visitedViews.value.splice(oldIndex, 1)[0]
    visitedViews.value.splice(newIndex, 0, item)
  }

  /** 退出登录时重置，避免换账号后残留上一用户的标签与组件缓存 */
  const reset = () => {
    visitedViews.value = [
      { name: 'Dashboard', path: '/dashboard', title: '数据概览', fullPath: '/dashboard' }
    ]
    cachedViews.value = ['Dashboard']
    systemCachedViews.value = []
    toolsCachedViews.value = []
    activeTab.value = '/dashboard'
  }

  return {
    visitedViews,
    cachedViews,
    systemCachedViews,
    toolsCachedViews,
    activeTab,
    tabsList,
    addView,
    removeView,
    removeOthers,
    removeAll,
    setActiveTab,
    updateTabPosition,
    reset
  }
})
