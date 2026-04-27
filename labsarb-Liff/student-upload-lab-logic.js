const urlParams = new URLSearchParams(window.location.search);
const labId = urlParams.get('lab');
let selectedFile = null;

if (labId) {
  document.getElementById('upload-lab-name').textContent = labId;
  const labs = typeof getLabs === 'function' ? getLabs() : {};
  const labInfo = labs[labId];
  if (labInfo && labInfo.desc && labInfo.desc !== 'ไม่มีคำอธิบาย') {
    document.getElementById('lab-desc-text').textContent = labInfo.desc;
    document.getElementById('lab-desc-box').style.display = 'block';
  }
}

function handleFileSelect(e) {
  if (e.target.files.length > 0) {
    selectedFile = e.target.files[0];
    document.getElementById('upload-text').textContent = selectedFile.name;
    const preview = document.getElementById('image-preview');
    const dropzone = document.querySelector('.upload-dropzone');
    preview.src = URL.createObjectURL(selectedFile);
    dropzone.classList.add('has-preview');
  }
}

async function submitLab() {
  if (!labId || !selectedFile) {
    alert("กรุณาเลือกไฟล์ก่อน");
    return;
  }

  const studentId = localStorage.getItem('labsarb_student');
  const submitBtn = document.getElementById('btn-submit-lab');
  submitBtn.disabled = true;
  submitBtn.textContent = "กำลังอัปโหลด...";

  try {
    const res = await fetch(API_URL + "/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: studentId,
        lab_id: labId,
        file_type: selectedFile.type
      })
    });

    const data = await res.json();
    const { uploadUrl, fileUrl } = data;

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
        lab_id: labId,
        status: "pending",
        image_url: fileUrl
      })
    });

    alert("อัปโหลดสำเร็จ!");
    window.location.href = "student-dashboard.html";
  } catch (err) {
    console.error(err);
    alert("Upload ล้มเหลว");
    submitBtn.disabled = false;
    submitBtn.textContent = "ส่งรูปภาพ";
  }
}

document.addEventListener('DOMContentLoaded', checkStudentLogin);