<template>
  <div class="h-screen flex flex-col bg-black">
    <NavBar />
    <div class="flex flex-1 overflow-hidden">
      <AppSidebar />
      <div class="flex-1 overflow-hidden">
        <slot />
      </div>
    </div>
  </div>
</template>
