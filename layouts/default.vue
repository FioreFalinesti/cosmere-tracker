<template>
  <div class="h-screen bg-blue-800 flex flex-col">
    <div class="flex-1 bg-black/75 text-blue-50 flex flex-col overflow-hidden">
      <NavBar />
      <div class="flex flex-1 overflow-hidden">
        <AppSidebar />
        <main class="flex-1 overflow-y-auto">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
