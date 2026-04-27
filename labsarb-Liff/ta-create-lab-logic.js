/* ta-create-lab-logic.js */

checkLogin();

let uploadedGroundTruthFiles = [];
const API_URL = "https://efmsyxbc9j.execute-api.us-east-1.amazonaws.com";

function handleFilesSelected(files) {
  if (!files || files.length === 0) return;
  for (let i = 0; i < files.length; i++) {
    uploadedGroundTruthFiles.push(files[i]);
  }
  renderUploadPreviews();
}

function removePreviewImage(index, event) {
  event.stopPropagation();
  uploadedGroundTruthFiles.splice(index, 1);
  renderUploadPreviews();
  document.getElementById('config-file').value = '';
  document.getElementById('config-file-append').value = '';
}

function renderUploadPreviews() {
  const container = document.getElementById('upload-preview-container');
  const grid = document.getElementById('preview-grid');
  const prompt = document.getElementById('upload-prompt');
  grid.innerHTML = '';

  if (uploadedGroundTruthFiles.length > 0) {
    container.classList.add('has-images');
    prompt.style.display = 'none';

    uploadedGroundTruthFiles.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const item = document.createElement('div');
      item.className = 'preview-item';
      item.innerHTML = `
        <img src="${url}" alt="preview" onload="URL.revokeObjectURL(this.src)">
        <button class="btn-remove-preview" onclick="removePreviewImage(${index}, event)" title="ลบรูปภาพ">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:14px;height:14px;">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
      grid.appendChild(item);
    });
  } else {
    container.classList.remove('has-images');
    prompt.style.display = 'flex';
  }
}

async function initLab() {
    const name = document.getElementById('config-lab-name').value.trim();
    const desc = document.getElementById('config-desc').value.trim();
    const deadlineDate = document.getElementById('config-deadline-date').value;
    const deadlineTime = document.getElementById('config-deadline-time').value;

    if (!name) {
        alert('กรุณาตั้งชื่อ Lab');
        return;
    }

    if (uploadedGroundTruthFiles.length === 0) {
        alert('กรุณาอัพโหลดภาพเฉลยอย่างน้อย 1 ภาพ');
        return;
    }

    try {
        const formData = new FormData();
        formData.append("student_id", "CONFIG");
        formData.append("lab_id", name);
        formData.append("lab_name", name);
        formData.append("lab_data", desc);
        formData.append("deadline", `${deadlineDate} ${deadlineTime}`);
        formData.append("status", "config");

        uploadedGroundTruthFiles.forEach((file, index) => {
            formData.append(`file_${index}`, file);
        });

        const res = await fetch(API_URL + "/edit-lab", {
            method: "POST",
            body: formData 
        });

        if (res.ok) {
            alert("สร้าง Lab และอัพโหลดรูปภาพสำเร็จ!");
            window.location.href = 'ta-dashboard.html';
        } else {
            const errorData = await res.json();
            alert("เกิดข้อผิดพลาด: " + (errorData.message || "ไม่สามารถอัพโหลดได้"));
        }

    } catch (err) {
        console.error(err);
        alert("เชื่อมต่อ API ไม่สำเร็จ");
    }
}