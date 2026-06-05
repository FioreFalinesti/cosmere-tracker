<template>
  <nav class="border-b border-surface-700 bg-surface-900 sticky top-0 z-50">
    <div class="w-full px-4 sm:px-6 flex items-center justify-between h-14">
      <NuxtLink to="/" class="text-accent-400 font-semibold text-lg tracking-wide hover:text-accent-300 transition-colors">
        Cosmere Tracker
      </NuxtLink>
      <div class="flex items-center gap-6">
        <NuxtLink
          to="/"
          class="text-indigo-300 hover:text-blue-100 transition-colors text-sm font-medium"
          active-class="text-accent-400"
          :exact="true"
        >Map</NuxtLink>
        <NuxtLink
          to="/settings"
        class="text-indigo-400 hover:text-blue-100 transition-colors"
        active-class="text-accent-400"
        title="Settings"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </NuxtLink>
      </div>
    </div>
  </nav>
</template>
