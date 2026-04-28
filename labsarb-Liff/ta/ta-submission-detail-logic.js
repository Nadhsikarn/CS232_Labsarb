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

    // อัปเดตสถานะระบบ
    const statusDesc = document.getElementById('detail-status-desc');
    if (statusDesc) {
        if (item.status === 'pass') {
            statusDesc.textContent = "ระบบตรวจสอบแล้ว: ผ่านเกณฑ์การให้คะแนนอัตโนมัติ";
        } else if (item.status === 'fail') {
            statusDesc.textContent = "ระบบตรวจสอบแล้ว: ไม่ผ่านเกณฑ์ (กรุณาตรวจสอบข้อเสนอแนะ)";
        } else {
            statusDesc.textContent = "สถานะ: รอการตรวจสอบจากระบบหรือผู้สอน";
        }
    }

  } catch (err) {
    console.error("Submission Detail Error:", err);
    document.getElementById('error-msg').style.display = 'block';
    document.getElementById('error-msg').textContent = "เกิดข้อผิดพลาดในการโหลดข้อมูล";
  }
}

// เรียกใช้งานเมื่อโหลดหน้าเว็บสำเร็จ
window.onload = loadDetail;