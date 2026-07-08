export default defineNuxtRouteMiddleware(async () => {
  const { currentUser, waitForAuth } = useAuthState()
  await waitForAuth()
  if (!currentUser.value) return navigateTo('/')
})
