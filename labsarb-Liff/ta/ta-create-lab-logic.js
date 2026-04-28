function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    uploadedGroundTruthFiles = [file];

    const preview = document.getElementById('image-preview');
    const dropzone = document.querySelector('.config-upload');

    const objectUrl = URL.createObjectURL(file);
    preview.src = objectUrl;

    if (dropzone) dropzone.classList.add('has-preview');
}
