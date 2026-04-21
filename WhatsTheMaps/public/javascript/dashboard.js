/** Dashboard avatar picker and local profile image preview */
const avatarUploadInput = document.getElementById('profile-image-upload');
const avatarDataInput = document.getElementById('uploaded-image-data');
const avatarPreview = document.getElementById('profile-image-preview');
const avatarPlaceholder = document.getElementById('profile-image-placeholder');
const avatarRadios = Array.from(document.querySelectorAll('input[name="selectedAvatar"]'));

// Show currently selected avatar source in the profile preview circle
function showPreviewImage(imageUrl) {
  if (!avatarPreview) {
    return;
  }

  avatarPreview.src = imageUrl;
  avatarPreview.classList.remove('hidden');
  avatarPlaceholder?.classList.add('hidden');
}

// Clear uploaded image state when user switches back to preset avatars
function resetUploadField() {
  if (avatarUploadInput) {
    avatarUploadInput.value = '';
  }

  if (avatarDataInput) {
    avatarDataInput.value = '';
  }
}

function clearSelectedPreset() {
  avatarRadios.forEach((radio) => {
    radio.checked = false;
  });
}

// Convert uploaded files to data URLs
function handleUploadChange() {
  const [file] = avatarUploadInput.files || [];

  if (!file) {
    if (avatarDataInput) {
      avatarDataInput.value = '';
    }
    return;
  }

  if (!file.type.startsWith('image/')) {
    window.alert('Please choose an image file.');
    resetUploadField();
    return;
  }

  const reader = new FileReader();

  reader.addEventListener('load', () => {
    const imageData = typeof reader.result === 'string' ? reader.result : '';

    if (!imageData.startsWith('data:image/')) {
      window.alert('That image could not be uploaded.');
      resetUploadField();
      return;
    }

    avatarDataInput.value = imageData;
    clearSelectedPreset();
    showPreviewImage(imageData);
  });

  reader.readAsDataURL(file);
}

// Preset avatar changes replace uploaded image selection
function handlePresetChange(radio) {
  if (!radio.checked) {
    return;
  }

  resetUploadField();
  showPreviewImage(radio.value);
}

// Listeners only on editable dashboard page
function initializeAvatarPicker() {
  if (!avatarUploadInput || !avatarDataInput || !avatarPreview) {
    return;
  }

  avatarUploadInput.addEventListener('change', handleUploadChange);

  avatarRadios.forEach((radio) => {
    radio.addEventListener('change', () => handlePresetChange(radio));
  });
}

initializeAvatarPicker();
