/**
 * Script สำหรับหน้า Student Dashboard
 */

document.addEventListener('DOMContentLoaded', () => {
    loadLabs();
});

async function loadLabs() {
    const list = document.getElementById('labs-container');
    const studentId = localStorage.getItem('labsarb_student');
    if (!list || !studentId) return;

    list.innerHTML = '<div style="text-align:center; padding:32px; color:#64748b;">กำลังโหลด...</div>';

    try {
        const [labsRes, subsRes] = await Promise.all([
            fetch(API_URL + "/labs"),
            fetch(API_URL + "/submissions?student_id=" + studentId)
        ]);

        const labs = await labsRes.json();
        const submissions = await subsRes.json();

        list.innerHTML = '';

        if (!Array.isArray(labs) || labs.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding:32px; color:#64748b;">ยังไม่มีการทดลองที่เปิดอยู่</div>';
            return;
        }

        labs.forEach(lab => {
            const mySub = Array.isArray(submissions)
                ? submissions.find(s => s.lab_id === lab.lab_id)
                : null;

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

            const deadlineText = lab.deadline
                ? new Date(lab.deadline).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
                : '';

            const scoreText = mySub?.score != null ? `คะแนน: ${mySub.score}` : '';

            const div = document.createElement('div');
            div.className = 'lab-item';
            div.style.cursor = 'pointer';
            div.onclick = () => window.location.href = `student-lab-details.html?lab=${encodeURIComponent(lab.lab_id)}`;

            div.innerHTML = `
                <div class="lab-item-left">
                    <div class="lab-item-title">
                        <h3>${lab.lab_id}</h3>
                        <span class="badge ${statusClass}">${statusText}</span>
                    </div>
                    ${deadlineText ? `<p style="font-size:12px; color:#64748b; margin-top:4px;">กำหนดส่ง: ${deadlineText}</p>` : ''}
                    ${scoreText ? `<p style="font-size:12px; color:#059669; margin-top:2px;">${scoreText}</p>` : ''}
                </div>
            `;
            list.appendChild(div);
        });

    } catch (err) {
        console.error("Error loading labs:", err);
        list.innerHTML = '<div style="text-align:center; padding:32px; color:#ef4444;">เกิดข้อผิดพลาดในการโหลดข้อมูล</div>';
    }
}
