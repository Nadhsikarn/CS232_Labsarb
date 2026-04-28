/**
 * Script สำหรับหน้ารายละเอียดผลงาน (Lab Details)
 */

document.addEventListener('DOMContentLoaded', async () => {
    if (typeof checkStudentLogin === 'function') {
        checkStudentLogin();
    }
    await loadDetail();
});

async function loadDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const labId = urlParams.get('lab');

    if (!labId) {
        alert("ไม่พบรหัสการทดลอง");
        return;
    }

    const titleEl = document.getElementById('lab-detail-title');
    if (titleEl) titleEl.textContent = `Lab: ${labId}`;

    const studentId = localStorage.getItem('labsarb_student');

    try {
        const [labsRes, subRes] = await Promise.all([
            fetch(API_URL + "/labs"),
            fetch(API_URL + "/submissions?student_id=" + studentId + "&lab_id=" + encodeURIComponent(labId))
        ]);

        const labs = await labsRes.json();
        const subs = await subRes.json();

        const labTemplate = Array.isArray(labs) ? labs.find(l => l.lab_id === labId) : null;
        const mySub = Array.isArray(subs) ? subs.find(s => s.lab_id === labId) : null;

        // Show lab description from template
        const descSection = document.getElementById('lab-desc-section');
        const descEl = document.getElementById('lab-detail-desc');
        if (labTemplate?.lab_description && descSection && descEl) {
            descEl.textContent = labTemplate.lab_description;
            descSection.style.display = 'block';
        }

        const statusBadge = document.getElementById('lab-detail-status');
        const feedbackP = document.getElementById('lab-detail-feedback');
        const imgDisplay = document.getElementById('lab-detail-image');
        const noImageEl = document.getElementById('lab-detail-no-image');
        const scoreSection = document.getElementById('lab-score-section');
        const scoreEl = document.getElementById('lab-detail-score');
        const submitBtn = document.getElementById('btn-submit-lab');

        if (!mySub) {
            if (statusBadge) { statusBadge.textContent = 'ยังไม่ส่งงาน'; statusBadge.className = 'badge'; }
            if (feedbackP) feedbackP.textContent = "คุณยังไม่ได้ส่งงานชิ้นนี้";
            if (submitBtn) {
                submitBtn.href = `student-upload-lab.html?lab=${encodeURIComponent(labId)}`;
                submitBtn.textContent = 'ส่งงาน';
                submitBtn.style.display = 'inline-block';
            }
            return;
        }

        // Show submission image or placeholder
        if (mySub.image_url) {
            if (imgDisplay) { imgDisplay.src = mySub.image_url; imgDisplay.style.display = 'block'; }
            if (noImageEl) noImageEl.style.display = 'none';
        }

        // Show score
        if (mySub.score != null && scoreSection && scoreEl) {
            scoreEl.textContent = mySub.score + ' คะแนน';
            scoreSection.style.display = 'block';
        }

        // Show status, feedback, and action button
        if (mySub.status === 'pass') {
            if (statusBadge) { statusBadge.textContent = 'ผ่านการประเมิน'; statusBadge.className = 'badge pass'; }
            if (feedbackP) feedbackP.textContent = mySub.feedback || "ยินดีด้วย! งานของคุณผ่านการตรวจสอบเรียบร้อยแล้ว";
        } else if (mySub.status === 'fail') {
            if (statusBadge) { statusBadge.textContent = 'ไม่ผ่าน / ต้องแก้ไข'; statusBadge.className = 'badge fail'; }
            if (feedbackP) feedbackP.textContent = mySub.feedback || "งานของคุณยังไม่ผ่านเกณฑ์ กรุณาตรวจสอบข้อผิดพลาดและส่งใหม่อีกครั้ง";
            if (submitBtn) {
                submitBtn.href = `student-upload-lab.html?lab=${encodeURIComponent(labId)}`;
                submitBtn.textContent = 'ส่งงานใหม่';
                submitBtn.style.display = 'inline-block';
            }
        } else {
            if (statusBadge) { statusBadge.textContent = 'รอการตรวจ'; statusBadge.className = 'badge'; }
            if (feedbackP) feedbackP.textContent = mySub.feedback || "งานของคุณถูกส่งเข้าสู่ระบบแล้ว กรุณารออาจารย์หรือระบบอัตโนมัติทำการประเมิน";
            if (submitBtn) {
                submitBtn.href = `student-upload-lab.html?lab=${encodeURIComponent(labId)}`;
                submitBtn.textContent = 'ส่งงานใหม่';
                submitBtn.style.display = 'inline-block';
            }
        }

    } catch (error) {
        console.error("Error loading detail:", error);
        const feedbackP = document.getElementById('lab-detail-feedback');
        if (feedbackP) feedbackP.textContent = "เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง";
    }
}
