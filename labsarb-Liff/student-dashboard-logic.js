/**
 * Script สำหรับหน้า Student Dashboard
 */

// ตรวจสอบการ Login ทันทีเมื่อโหลดไฟล์
if (typeof checkStudentLogin === 'function') {
    checkStudentLogin();
}

async function loadLabs() {
    const list = document.getElementById('labs-container');
    const studentId = localStorage.getItem('labsarb_student');

    if (!studentId) return;

    try {
        const res = await fetch(API_URL + "/submissions?student_id=" + studentId);
        const submissions = await res.json();

        // สมมติว่า getLabs() ถูกประกาศไว้ใน student-portal.js
        const allLabs = typeof getLabs === 'function' ? getLabs() : {}; 

        list.innerHTML = '';

        Object.keys(allLabs).forEach(labId => {
            const mySub = submissions.find(s => s.lab_id === labId);

            let statusText = 'ยังไม่ส่งงาน';
            let statusClass = 'pending';

            if (mySub?.status === 'pass') {
                statusText = 'ผ่าน';
                statusClass = 'passed';
            } else if (mySub?.status === 'fail') {
                statusText = 'ไม่ผ่าน';
                statusClass = 'failed';
            } else if (mySub) {
                statusText = 'รอตรวจ';
                statusClass = 'submitted';
            }

            const div = document.createElement('div');
            div.className = 'lab-item';
            div.innerHTML = `
                <div class="lab-item-left">
                    <div class="lab-item-title">
                        <h3>${labId}</h3>
                        <span class="badge ${statusClass}">${statusText}</span>
                    </div>
                </div>
                <hr style="margin: 15px 0; border: 0; border-top: 1px solid #eee;"/>
            `;
            list.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading labs:", error);
    }
}

function acceptInvitation() {
    const studentId = localStorage.getItem('labsarb_student');
    const allStudents = JSON.parse(localStorage.getItem('labsarb_students') || '[]');
    const myIndex = allStudents.findIndex(s => s.id === studentId);

    if (myIndex !== -1) {
        allStudents[myIndex].status = 'accepted';
        localStorage.setItem('labsarb_students', JSON.stringify(allStudents));
        loadLabs(); // โหลดข้อมูลใหม่
    }
}

// เรียกใช้งานเมื่อหน้าเว็บพร้อม
document.addEventListener('DOMContentLoaded', () => {
    loadLabs();
});