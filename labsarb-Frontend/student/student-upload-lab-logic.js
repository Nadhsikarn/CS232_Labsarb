let selectedFile = null;
let _uploadLabId = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof checkStudentLogin === 'function') checkStudentLogin();

    const urlParams = new URLSearchParams(window.location.search);
    _uploadLabId = urlParams.get('lab');

    if (!_uploadLabId) return;

    const nameEl = document.getElementById('upload-lab-name');
    if (nameEl) nameEl.textContent = _uploadLabId;

    // Fetch lab description from API
    try {
        const res = await fetch(API_URL + "/labs");
        const labs = await res.json();
        const labInfo = Array.isArray(labs) ? labs.find(l => l.lab_id === _uploadLabId) : null;
        if (labInfo?.lab_description) {
            const descBox = document.getElementById('lab-desc-box');
            const descText = document.getElementById('lab-desc-text');
            if (descBox && descText) {
                descText.textContent = labInfo.lab_description;
                descBox.style.display = 'block';
            }
        }
    } catch (_) { }
});

function handleFileSelect(e) {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        const textEl = document.getElementById('upload-text');
        if (textEl) textEl.textContent = selectedFile.name;
        const preview = document.getElementById('image-preview');
        const dropzone = document.querySelector('.upload-dropzone');
        if (preview) preview.src = URL.createObjectURL(selectedFile);
        if (dropzone) dropzone.classList.add('has-preview');
    }
}

async function submitLab() {
    if (!_uploadLabId || !selectedFile) {
        alert("กรุณาเลือกไฟล์ก่อน");
        return;
    }

    const studentId = localStorage.getItem('labsarb_student');
    const submitBtn = document.getElementById('btn-submit-lab');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "กำลังอัปโหลด..."; }

    try {
        const res = await fetch(API_URL + "/upload-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                student_id: studentId,
                lab_id: _uploadLabId,
                file_type: selectedFile.type,
                file_name: selectedFile.name
            })
        });

        const { uploadUrl, fileUrl } = await res.json();

        await fetch(uploadUrl, {
            method: "PUT",
            body: selectedFile,
            headers: { "Content-Type": selectedFile.type }
        });

        await fetch(API_URL + "/edit-lab", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                student_id: studentId,
                lab_id: _uploadLabId,
                status: "pending",
                image_url: fileUrl,
                updated_at: new Date().toISOString()
            })
        });

        alert("อัปโหลดสำเร็จ!");
        window.location.href = `student-lab-details.html?lab=${encodeURIComponent(_uploadLabId)}`;
    } catch (err) {
        console.error(err);
        alert("Upload ล้มเหลว");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "ส่งรูปภาพ"; }
    }
}
