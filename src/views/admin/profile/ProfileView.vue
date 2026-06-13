<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Icon } from '@iconify/vue'
import PageCard from '@/components/ui/PageCard.vue'
import ImageCropInput from '@/components/ui/ImageCropInput.vue'
import { profileApi } from '@/api/profile'
import type { User } from '@/types/auth'
import { useAuthStore } from '@/stores/auth'
import { useNotify } from '@/composables/useNotify'
import { getApiErrorMessage } from '@/utils/apiError'
import { profilePhotoUrl } from '@/utils/media'

const { t } = useI18n()
const auth = useAuthStore()
const { success, error: notifyError, confirm } = useNotify()

const loading = ref(true)
const savingProfile = ref(false)
const savingPassword = ref(false)
const uploadingPhoto = ref(false)

const profile = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
})

const passwordForm = ref({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const photoPreview = ref('')
const photoFile = ref<File | null>(null)
const photoLoadFailed = ref(false)

function setPhotoPreview(photo: string | null | undefined, cacheKey?: string | number | null) {
  photoLoadFailed.value = false
  photoPreview.value = profilePhotoUrl(photo, cacheKey) || ''
}

async function load() {
  loading.value = true
  try {
    const response = await profileApi.get()
    const user = response.data as User
    profile.value = {
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      address: user.address || '',
    }
    setPhotoPreview(user.profile_photo, user.updated_at)
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  savingProfile.value = true
  try {
    const response = await profileApi.update(profile.value)
    auth.user = response.data
    success(t('profile.updated'))
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    savingProfile.value = false
  }
}

function onPhotoSelected(files: File[]) {
  const file = files[0]
  if (!file) return
  photoFile.value = file
  photoLoadFailed.value = false
  photoPreview.value = URL.createObjectURL(file)
}

async function uploadPhoto() {
  if (!photoFile.value) return
  uploadingPhoto.value = true
  const localPreview = photoPreview.value
  try {
    const response = await profileApi.updatePhoto(photoFile.value)
    auth.user = response.data
    setPhotoPreview(response.data.profile_photo, response.data.updated_at)
    photoFile.value = null
    success(t('profile.photoUpdated'))
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    if (localPreview.startsWith('blob:')) {
      URL.revokeObjectURL(localPreview)
    }
    uploadingPhoto.value = false
  }
}

async function removePhoto() {
  if (!(await confirm(t('profile.removePhotoConfirm')))) return
  uploadingPhoto.value = true
  try {
    const response = await profileApi.removePhoto()
    auth.user = response.data
    photoPreview.value = ''
    photoLoadFailed.value = false
    photoFile.value = null
    success(t('profile.photoRemoved'))
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    uploadingPhoto.value = false
  }
}

async function changePassword() {
  savingPassword.value = true
  try {
    await profileApi.changePassword(passwordForm.value)
    passwordForm.value = { current_password: '', password: '', password_confirmation: '' }
    success(t('profile.passwordChanged'))
  } catch (e) {
    notifyError(getApiErrorMessage(e))
  } finally {
    savingPassword.value = false
  }
}

onMounted(load)
</script>

<template>
  <PageCard :title="t('pages.profile.title')" :subtitle="t('pages.profile.description')">
    <div v-if="loading" class="page-loading">{{ t('common.loading') }}</div>

    <div v-else class="profile-layout">
      <div class="panel profile-photo-panel">
        <h2>{{ t('profile.photo') }}</h2>
        <div class="photo-wrap">
          <img
            v-if="photoPreview && !photoLoadFailed"
            :src="photoPreview"
            class="profile-photo"
            alt=""
            @error="photoLoadFailed = true"
          />
          <div v-else class="profile-photo placeholder">
            <Icon icon="solar:user-circle-bold-duotone" />
          </div>
        </div>
        <div class="photo-actions">
          <label class="btn btn-outline btn-sm">
            <Icon icon="solar:camera-linear" /> {{ t('profile.choosePhoto') }}
            <ImageCropInput hidden @select="onPhotoSelected" />
          </label>
          <button
            v-if="photoFile"
            type="button"
            class="btn btn-primary btn-sm"
            :disabled="uploadingPhoto"
            @click="uploadPhoto"
          >
            {{ uploadingPhoto ? t('common.loading') : t('profile.uploadPhoto') }}
          </button>
          <button
            v-if="photoPreview && !photoFile"
            type="button"
            class="btn btn-outline btn-sm danger-text"
            :disabled="uploadingPhoto"
            @click="removePhoto"
          >
            {{ t('profile.removePhoto') }}
          </button>
        </div>
      </div>

      <div class="panel">
        <h2>{{ t('profile.information') }}</h2>
        <div class="form-grid two-col">
          <div class="form-group">
            <label>{{ t('profile.name') }} *</label>
            <input v-model="profile.name" type="text" required />
          </div>
          <div class="form-group">
            <label>{{ t('profile.email') }} *</label>
            <input v-model="profile.email" type="email" required />
          </div>
          <div class="form-group">
            <label>{{ t('profile.phone') }}</label>
            <input v-model="profile.phone" type="text" />
          </div>
          <div class="form-group full">
            <label>{{ t('profile.address') }}</label>
            <textarea v-model="profile.address" rows="2" />
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-primary" :disabled="savingProfile" @click="saveProfile">
            {{ savingProfile ? t('common.loading') : t('common.save') }}
          </button>
        </div>
      </div>

      <div class="panel">
        <h2>{{ t('profile.changePassword') }}</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>{{ t('profile.currentPassword') }} *</label>
            <input v-model="passwordForm.current_password" type="password" required />
          </div>
          <div class="form-group">
            <label>{{ t('profile.newPassword') }} *</label>
            <input v-model="passwordForm.password" type="password" required />
          </div>
          <div class="form-group">
            <label>{{ t('profile.confirmPassword') }} *</label>
            <input v-model="passwordForm.password_confirmation" type="password" required />
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-primary" :disabled="savingPassword" @click="changePassword">
            {{ savingPassword ? t('common.loading') : t('profile.updatePassword') }}
          </button>
        </div>
      </div>
    </div>
  </PageCard>
</template>

<style scoped>
.profile-layout {
  display: grid;
  gap: 1rem;
}

.profile-photo-panel {
  max-width: 320px;
}

.photo-wrap {
  margin-bottom: 1rem;
}

.profile-photo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--fc-border);
}

.profile-photo.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--fc-bg);
  font-size: 4rem;
  color: var(--fc-text-muted);
}

.photo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.danger-text {
  color: #dc2626;
}

.form-actions {
  margin-top: 1rem;
}

.panel h2 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--fc-border);
  border-radius: 6px;
}

.form-grid.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-grid.two-col .full {
  grid-column: 1 / -1;
}

@media (max-width: 768px) {
  .form-grid.two-col {
    grid-template-columns: 1fr;
  }
}
</style>
