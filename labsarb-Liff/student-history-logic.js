/**
 * Script สำหรับหน้าประวัติการส่งงาน (History Page)
 */

document.addEventListener('DOMContentLoaded', () => {
    if (typeof checkStudentLogin === 'function') {
        checkStudentLogin();
    }
    loadHistory();
});

async function loadHistory() {
    const studentId = localStorage.getItem('labsarb_student');
    if (!studentId) return;

    try {
        const res = await fetch(API_URL + "/submissions?student_id=" + studentId);
        if (!res.ok) throw new Error("API error");

        const mySubs = await res.json();
        const tbody = document.getElementById('history-tbody');
        tbody.innerHTML = '';

        if (mySubs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 30px;">ไม่มีข้อมูลการส่งงาน</td></tr>';
            return;
        }

        let passCount = 0;
        let failCount = 0;

        mySubs.forEach(sub => {
            const tr = document.createElement('tr');
            
            let statusBadge = '';
            if (sub.status === 'pass') {
                statusBadge = '<span class="badge pass">ผ่าน</span>';
                passCount++;
            } else if (sub.status === 'fail') {
                statusBadge = '<span class="badge fail">ไม่ผ่าน</span>';
                failCount++;
            } else {
                statusBadge = '<span class="badge pending">รอตรวจ</span>';
            }

            tr.innerHTML = `
                <td><b>${sub.lab_id}</b></td>
                <td>${statusBadge}</td>
                <td>${sub.score !== undefined && sub.score !== null ? sub.score : '-'}</td>
            `;
            tbody.appendChild(tr);
        });

        // อัปเดตตัวเลขสถิติ (Summary)
        updateSummary(mySubs.length, passCount, failCount);

    } catch (error) {
        console.error("Error loading history:", error);
    }
}

function updateSummary(total, pass, fail) {
    document.getElementById('stat-total').innerText = total;
    document.getElementById('stat-pass').innerText = pass;
    document.getElementById('stat-fail').innerText = (total - pass); // นับทั้ง fail และ pending

    // คำนวณความคืบหน้า (สมมติว่าเกณฑ์คือจำนวนที่ผ่าน)
    const progPercent = total > 0 ? Math.round((pass / total) * 100) : 0;
    document.getElementById('stat-prog').innerText = progPercent + '%';
    document.getElementById('stat-prog-fill').style.width = progPercent + '%';
}