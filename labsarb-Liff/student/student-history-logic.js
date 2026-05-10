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
    const tbody = document.getElementById('history-tbody');
    const studentId = localStorage.getItem('labsarb_student');
    if (!tbody || !studentId) return;

    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px;">กำลังโหลด...</td></tr>';

    try {
        const res = await fetch(API_URL + "/submissions?student_id=" + studentId);
        if (!res.ok) throw new Error("API error");

        const mySubs = await res.json();

        if (!Array.isArray(mySubs) || mySubs.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#64748b;">ยังไม่มีข้อมูลการส่งงาน</td></tr>';
            updateSummary(0, 0, 0, 0);
            return;
        }

        tbody.innerHTML = '';
        let passCount = 0, failCount = 0, pendingCount = 0;

        mySubs.forEach(sub => {
            const tr = document.createElement('tr');
            tr.style.cursor = 'pointer';
            tr.onclick = () => window.location.href = `student-lab-details.html?lab=${encodeURIComponent(sub.lab_id)}`;

            let statusBadge = '';
            if (sub.status === 'pass') {
                statusBadge = '<span class="badge pass">ผ่าน</span>';
                passCount++;
            } else if (sub.status === 'fail' || sub.status === 'error' || sub.status === 'rejected') {
                statusBadge = '<span class="badge fail">ไม่ผ่าน</span>';
                failCount++;
            } else {
                statusBadge = '<span class="badge pending">รอตรวจ</span>';
                pendingCount++;
            }

            tr.innerHTML = `
                <td><b>${sub.lab_id}</b></td>
                <td>${statusBadge}</td>
                <td>${sub.score != null ? sub.score : '-'}</td>
            `;
            tbody.appendChild(tr);
        });

        updateSummary(mySubs.length, passCount, failCount, pendingCount);

    } catch (error) {
        console.error("Error loading history:", error);
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:30px; color:#ef4444;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    }
}

function updateSummary(total, pass, fail, pending) {
    const statTotal = document.getElementById('stat-total');
    const statPass = document.getElementById('stat-pass');
    const statFail = document.getElementById('stat-fail');
    const statProg = document.getElementById('stat-prog');
    const statFill = document.getElementById('stat-prog-fill');

    if (statTotal) statTotal.innerText = total;
    if (statPass) statPass.innerText = pass;
    if (statFail) statFail.innerText = fail + pending;

    const progPercent = total > 0 ? Math.round((pass / total) * 100) : 0;
    if (statProg) statProg.innerText = progPercent + '%';
    if (statFill) statFill.style.width = progPercent + '%';
}
