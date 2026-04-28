/* ta-students-logic.js */

window.onload = async () => {
    const storedUser = localStorage.getItem('labsarb_admin');
    if (!storedUser) {
        window.location.href = '../login.html';
        return;
    }
    const userEl = document.getElementById('dropdown-username');
    if (userEl) userEl.textContent = storedUser;

    await loadStudents();
};

async function loadStudents() {
    const tbody = document.getElementById('student-table-body');
    const countSpan = document.getElementById('student-count');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:24px;">กำลังโหลด...</td></tr>';

    try {
        const res = await fetch(API_URL + "/students");
        const students = await res.json();

        if (countSpan) countSpan.textContent = students.length;
        tbody.innerHTML = '';

        if (students.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:32px;">ยังไม่มีรายชื่อนักศึกษาในระบบ</td></tr>';
            return;
        }

        students.forEach(s => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight:500;">${s.student_id}</td>
                <td>${s.name || '-'}</td>
                <td style="color:#64748b;">${s.email || '-'}</td>
                <td style="text-align:right;">
                    <button class="btn-danger" onclick="removeStudent('${s.student_id}')">ลบ</button>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#ef4444; padding:32px;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    }
}

async function addStudent() {
    const idInput = document.getElementById('add-student-id');
    const btn = document.getElementById('btn-add-student');
    const statusMsg = document.getElementById('add-student-status');

    if (!idInput) return;
    const studentId = idInput.value.trim();

    if (studentId.length !== 10) {
        alert('กรุณากรอกรหัสนักศึกษาให้ครบ 10 หลัก');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'กำลังตรวจสอบ...';
    statusMsg.style.display = 'block';
    statusMsg.style.color = '#64748b';
    statusMsg.textContent = 'กำลังดึงข้อมูลจากระบบมหาวิทยาลัย...';

    try {
        // Step 1: ดึงชื่อจาก TU API
        let name = null;
        let email = null;
        try {
            const tuRes = await fetch('https://ya67mrcre1.execute-api.us-east-1.amazonaws.com/prod_tuapi/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'check_student', student_id: studentId })
            });
            const tuResult = await tuRes.json();
            if (tuResult.success && tuResult.data) {
                const info = tuResult.data.data || tuResult.data;
                name = info.name || info.displayname_th || null;
                email = info.email || (studentId + '@dome.tu.ac.th');
            }
        } catch (_) {
            // TU API ล้มเหลว — เพิ่มด้วย ID เปล่าก็ได้
        }

        // Step 2: บันทึกลง DynamoDB
        const res = await fetch(API_URL + "/students", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId, name, email })
        });

        if (!res.ok) throw new Error("API error");

        statusMsg.style.color = '#059669';
        statusMsg.textContent = `เพิ่มนักศึกษา ${studentId}${name ? ' (' + name + ')' : ''} สำเร็จ!`;
        idInput.value = '';
        await loadStudents();
        setTimeout(() => { statusMsg.style.display = 'none'; }, 3000);

    } catch (err) {
        console.error(err);
        statusMsg.style.color = '#dc2626';
        statusMsg.textContent = 'เกิดข้อผิดพลาดในการเพิ่มนักศึกษา';
    } finally {
        btn.disabled = false;
        btn.textContent = 'ตรวจสอบและเพิ่ม';
    }
}

async function removeStudent(studentId) {
    if (!confirm(`ยืนยันการลบนักศึกษา ${studentId} ออกจากระบบ?`)) return;

    try {
        const res = await fetch(API_URL + "/students/" + encodeURIComponent(studentId), {
            method: 'DELETE'
        });
        if (res.ok) {
            await loadStudents();
        } else {
            alert('ลบไม่สำเร็จ กรุณาลองใหม่');
        }
    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการลบ');
    }
}

async function clearAllStudents() {
    if (!confirm('คุณต้องการลบรายชื่อนักศึกษา "ทั้งหมด" ออกจากระบบหรือไม่?')) return;

    try {
        const res = await fetch(API_URL + "/students");
        const students = await res.json();

        for (const s of students) {
            await fetch(API_URL + "/students/" + encodeURIComponent(s.student_id), {
                method: 'DELETE'
            });
        }

        await loadStudents();
    } catch (err) {
        console.error(err);
        alert('เกิดข้อผิดพลาดในการลบทั้งหมด');
    }
}
