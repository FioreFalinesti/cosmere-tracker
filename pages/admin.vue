<template>
  <div class="max-w-2xl">
    <h1 class="text-3xl font-bold text-blue-50 mb-8">Admin</h1>

    <section v-if="isAdmin">
      <h2 class="text-sm font-semibold text-indigo-400 uppercase tracking-widest mb-4">Admins</h2>
      <div class="rounded-lg border border-surface-700 bg-surface-800 p-4 space-y-3">
        <ul class="space-y-1">
          <li class="flex items-center justify-between text-sm text-blue-100">
            <span>{{ rootEmail }}</span>
            <span class="text-xs text-indigo-500 italic">root</span>
          </li>
          <li v-for="email in adminEmails" :key="email" class="flex items-center justify-between text-sm text-blue-100">
            <span>{{ email }}</span>
            <button type="button" class="text-xs text-red-400 hover:text-red-300 transition-colors cursor-pointer" @click="removeAdmin(email)">Remove</button>
          </li>
        </ul>
        <form class="flex items-center gap-2 pt-2 border-t border-surface-700" @submit.prevent="onAdd">
          <input
            v-model="newEmail"
            type="email"
            placeholder="new-admin@example.com"
            class="flex-1 bg-surface-700 border border-surface-600 rounded-lg px-3 py-2 text-sm text-blue-100 placeholder-indigo-600 focus:outline-none focus:border-accent-500 transition-colors"
          />
          <button
            type="submit"
            class="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white text-sm rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            :disabled="!newEmail.trim()"
          >Add</button>
        </form>
      </div>
    </section>
    <p v-else class="text-sm text-indigo-400">Nothing to see here yet.</p>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const { isAdmin } = useAuthState()
const { adminEmails, init, addAdmin, removeAdmin } = useAdminRoster()
const config = useRuntimeConfig()
const rootEmail = config.public.adminEmails.split(',')[0].trim()
init()

const newEmail = ref('')
async function onAdd() {
  await addAdmin(newEmail.value)
  newEmail.value = ''
}
</script>
