export default defineNuxtPlugin(() => {
  const { currentUser } = useAuthState()
  const router = useRouter()

  watch(currentUser, (user) => {
    if (user) return
    const middleware = router.currentRoute.value.meta.middleware
    const requiresAuth = middleware === 'auth' || (Array.isArray(middleware) && middleware.includes('auth'))
    if (requiresAuth) navigateTo('/')
  })
})
