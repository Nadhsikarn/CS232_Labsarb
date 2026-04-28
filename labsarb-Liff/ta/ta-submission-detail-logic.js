/* ta-submission-detail-logic.js */

// ตรวจสอบสถานะการเข้าสู่ระบบ
if (typeof checkLogin === 'function') {
  checkLogin();
}

const urlParams = new URLSearchParams(window.location.search);
const labId = urlParams.get('lab');
const studentId = urlParams.get('student');

// ตั้งค่าปุ่มย้อนกลับ
const btnBack = document.getElementById('btn-back');
if (btnBack) {
  btnBack.onclick = () => {
    window.location.href = `ta-submissions.html?lab=${encodeURIComponent(labId)}`;
  };
}

/**
 * ดึงข้อมูลรายละเอียดการส่งงานเฉพาะของนักศึกษาคนนั้นๆ
 */
async function loadDetail() {
  if (!labId || !studentId) {
    document.getElementById('error-msg').style.display = 'block';
    return;
  }

  // อัปเดตหัวข้อเบื้องต้น
  document.getElementById('detail-lab-name').textContent = `Lab: ${labId}`;
  document.getElementById('detail-student-name').textContent = `ส่งโดยนักศึกษารหัส: ${studentId}`;

  try {
    const res = await fetch(API_URL + "/submissions");
    const json = await res.json();
    const data = json.data || json; // รองรับทั้งโครงสร้างที่มี data wrapper และไม่มี

    // ค้นหาข้อมูลที่ตรงกัน
    const item = data.find(
      d => d.lab_id === labId && d.student_id === studentId
    );

    if (!item) {
      document.getElementById('submission-detail-container').style.display = 'none';
      document.getElementById('error-msg').style.display = 'block';
      return;
    }

    // แสดงข้อมูลใน UI
    document.getElementById('submission-detail-container').style.display = 'flex';
    document.getElementById('error-msg').style.display = 'none';

    // ตั้งค่ารูปภาพ
    const detailImg = document.getElementById('detail-img');
    if (detailImg) detailImg.src = item.image_url;

    // อัปเดตข้อมูลบริบท
    const timeEl = document.getElementById('detail-time');
    if (timeEl && item.updated_at) {
      const date = new Date(item.updated_at);
      timeEl.textContent = date.toLocaleString('th-TH');
    }

    const formatEl = document.getElementById('detail-format');
    if (formatEl && item.image_url) {
      const ext = item.image_url.split('.').pop().toUpperCase();
      formatEl.textContent = `${ext} Image`;
    }

    // อัปเดตสถานะและบทวิเคราะห์
    const statusDesc = document.getElementById('detail-status-desc');
    const statusTitle = document.getElementById('detail-status-title');
    if (statusDesc) {
      if (item.status === 'pass') {
        if (statusTitle) statusTitle.textContent = "ตรวจสอบระบบ: ผ่านเกณฑ์";
        statusDesc.textContent = item.feedback || "ระบบตรวจสอบแล้ว: ผ่านเกณฑ์การให้คะแนนอัตโนมัติ";
      } else if (item.status === 'fail') {
        if (statusTitle) statusTitle.textContent = "ตรวจสอบระบบ: ไม่ผ่านเกณฑ์";
        statusDesc.textContent = item.feedback || "ระบบตรวจสอบแล้ว: ไม่ผ่านเกณฑ์ (กรุณาตรวจสอบข้อเสนอแนะ)";
      } else {
        if (statusTitle) statusTitle.textContent = "ตรวจสอบระบบ: กำลังดำเนินการ";
        statusDesc.textContent = item.feedback || "สถานะ: รอการตรวจสอบจากระบบหรือผู้สอน";
      }
    }

    // แสดงผลการวิเคราะห์แบบ Bullet Points
    const analysisBox = document.getElementById('analysis-results-box');
    const analysisList = document.getElementById('analysis-list');
    if (analysisBox && analysisList && item.analysis_results) {
        analysisBox.style.display = 'block';
        analysisList.innerHTML = '';
        const results = item.analysis_results.split('\n');
        results.forEach(text => {
            if (text.trim()) {
                const li = document.createElement('li');
                li.textContent = text;
                analysisList.appendChild(li);
            }
        });
    }

  } catch (err) {
    console.error("Submission Detail Error:", err);
    document.getElementById('error-msg').style.display = 'block';
    document.getElementById('error-msg').textContent = "เกิดข้อผิดพลาดในการโหลดข้อมูล";
  }
}

// เรียกใช้งานเมื่อโหลดหน้าเว็บสำเร็จ
window.onload = loadDetail;