/**
 * Script สำหรับหน้ารายละเอียดผลงาน (Lab Details)
 */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof checkStudentLogin === 'function') {
        checkStudentLogin();
    }
    loadDetail();
});

async function loadDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const labId = urlParams.get('lab');
    
    if (!labId) {
        alert("ไม่พบรหัสการทดลอง");
        return;
    }

    document.getElementById('lab-detail-title').textContent = `Lab: ${labId}`;
    const studentId = localStorage.getItem('labsarb_student');

    try {
        const res = await fetch(API_URL + "/submissions?student_id=" + studentId + "&lab_id=" + labId);
        
        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        // ค้นหาข้อมูลที่ตรงกับ labId (API อาจส่งมาเป็น Array)
        const mySub = data.find(d => d.lab_id === labId);

        const statusBadge = document.getElementById('lab-detail-status');
        const feedbackP = document.getElementById('lab-detail-feedback');
        const imgDisplay = document.getElementById('lab-detail-image');

        if (!mySub) {
            statusBadge.textContent = 'ไม่พบข้อมูลการส่ง';
            statusBadge.className = 'badge';
            feedbackP.textContent = "คุณยังไม่ได้ส่งงานชิ้นนี้ หรือข้อมูลกำลังถูกปรับปรุง";
            return;
        }

        // แสดงรูปภาพ (ถ้ามี)
        if (mySub.image_url) {
            imgDisplay.src = mySub.image_url;
        } else {
            imgDisplay.alt = "ไม่มีรูปภาพหลักฐาน";
        }

        // แสดงสถานะ
        if (mySub.status === 'pass') {
            statusBadge.textContent = 'ผ่านการประเมิน';
            statusBadge.className = 'badge pass';
            feedbackP.textContent = mySub.feedback || "ยินดีด้วย! งานของคุณผ่านการตรวจสอบเรียบร้อยแล้ว";
        } else if (mySub.status === 'fail') {
            statusBadge.textContent = 'ไม่ผ่าน / ต้องแก้ไข';
            statusBadge.className = 'badge fail';
            feedbackP.textContent = mySub.feedback || "งานของคุณยังไม่ผ่านเกณฑ์ กรุณาตรวจสอบข้อผิดพลาดและส่งใหม่อีกครั้ง";
        } else {
            statusBadge.textContent = 'รอการตรวจ';
            statusBadge.className = 'badge';
            feedbackP.textContent = "งานของคุณถูกส่งเข้าสู่ระบบแล้ว กรุณารออาจารย์หรือระบบอัตโนมัติทำการประเมิน";
        }

    } catch (error) {
        console.error("Error loading detail:", error);
        document.getElementById('lab-detail-feedback').textContent = "เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง";
    }
}