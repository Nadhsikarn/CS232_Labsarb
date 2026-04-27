/* ta-students-logic.js */

// ตรวจสอบสถานะการเข้าสู่ระบบ
if (typeof checkLogin === 'function') {
    checkLogin();
}

/**
 * โหลดรายชื่อนักศึกษาและแสดงผลในตาราง
 */
function loadStudents() {
  const students = typeof getEnrolledStudents === 'function' ? getEnrolledStudents() : [];
  const tbody = document.getElementById('student-table-body');
  const countSpan = document.getElementById('student-count');

  if (countSpan) countSpan.textContent = students.length;
  if (!tbody) return;

  tbody.innerHTML = '';

  if (students.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#64748b; padding:32px;">ยังไม่มีรายชื่อนักศึกษาในระบบ</td></tr>`;
    return;
  }

  students.forEach((s, index) => {
    const isPending = s.status === 'pending';
    const displayName = isPending ? '<span style="color:#fbbf24; font-style:italic;">รอการตอบรับจากนักศึกษา</span>' : s.name;
    const displayEmail = isPending ? '<span style="color:#fbbf24; font-style:italic;">รอการตอบรับ</span>' : (s.email || '-');
    
    const badge = isPending 
        ? '<span style="background:#fef3c7; color:#d97706; padding:2px 8px; border-radius:12px; font-size:10px; margin-left:8px;">Pending</span>' 
        : '<span style="background:#dcfce7; color:#16a34a; padding:2px 8px; border-radius:12px; font-size:10px; margin-left:8px;">Enrolled</span>';

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="font-weight:500;">${s.id} ${badge}</td>
      <td>${displayName}</td>
      <td style="color:#64748b;">${displayEmail}</td>
      <td style="text-align:right;">
        <button class="btn-danger" onclick="removeStudent(${index})">ลบ</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/**
 * ฟังก์ชันเพิ่มนักศึกษา โดยดึงข้อมูลผ่าน API Gateway
 */
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

  const students = typeof getEnrolledStudents === 'function' ? getEnrolledStudents() : [];
  if (students.find(s => s.id === studentId)) {
    alert('รหัสนักศึกษานี้อยู่ในรายชื่อแล้ว');
    return;
  }

  // Start Loading
  btn.disabled = true;
  btn.textContent = 'กำลังตรวจสอบ...';
  statusMsg.style.display = 'block';
  statusMsg.style.color = '#64748b';
  statusMsg.textContent = '🔄 กำลังดึงข้อมูลจากระบบมหาวิทยาลัย...';

  try {
    const apiUrl = 'https://ya67mrcre1.execute-api.us-east-1.amazonaws.com/prod_tuapi/login';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check_student', student_id: studentId })
    });

    const result = await response.json();

    if (result.success && result.data) {
      const studentData = result.data;
      const info = studentData.data || studentData; 
      
      const newStudent = {
        id: studentId,
        name: info.name || info.displayname_th || 'ไม่ทราบชื่อ',
        email: info.email || (studentId + '@dome.tu.ac.th'),
        status: 'pending' 
      };

      students.push(newStudent);
      if (typeof saveEnrolledStudents === 'function') {
          saveEnrolledStudents(students);
      }

      statusMsg.style.color = '#059669';
      statusMsg.textContent = `✅ เพิ่มคุณ ${newStudent.name} สำเร็จ!`;
      idInput.value = '';
      loadStudents();

      setTimeout(() => { statusMsg.style.display = 'none'; }, 3000);
    } else {
      statusMsg.style.color = '#dc2626';
      statusMsg.textContent = '❌ ไม่พบข้อมูลนักศึกษาคนนี้ กรุณาตรวจสอบรหัสอีกครั้ง';
    }
  } catch (err) {
    console.error(err);
    statusMsg.style.color = '#dc2626';
    statusMsg.textContent = '⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
  } finally {
    btn.disabled = false;
    btn.textContent = 'ตรวจสอบและเพิ่ม';
  }
}

/**
 * ลบนักศึกษาทีละคน
 */
function removeStudent(index) {
  if (confirm('ยืนยันการลบนักศึกษารายนี้ออกจากรายวิชา?')) {
    const students = getEnrolledStudents();
    students.splice(index, 1);
    saveEnrolledStudents(students);
    loadStudents();
  }
}

/**
 * ล้างรายชื่อนักศึกษาทั้งหมด
 */
function clearAllStudents() {
  if (confirm('คุณต้องการลบรายชื่อนักศึกษา "ทั้งหมด" ออกจากระบบหรือไม่?')) {
    saveEnrolledStudents([]);
    loadStudents();
  }
}

// เริ่มต้นโหลดข้อมูลเมื่อหน้าเว็บพร้อม
window.onload = loadStudents;