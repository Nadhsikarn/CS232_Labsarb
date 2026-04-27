/* ta-submissions-logic.js */

// ตรวจสอบสถานะการเข้าสู่ระบบ
if (typeof checkLogin === 'function') {
    checkLogin();
}

const urlParams = new URLSearchParams(window.location.search);
currentLabName = urlParams.get('lab'); // ใช้ตัวแปร let จาก ta-portal.js

// เปลี่ยนชื่อหัวข้อตาม Lab ที่ส่งมา
if (currentLabName && document.getElementById('sub-list-title')) {
  document.getElementById('sub-list-title').textContent = currentLabName;
}

/**
 * ดึงข้อมูลการส่งงานทั้งหมดและแสดงผลในตาราง
 */
async function loadSubmissions() {
  const tbody = document.getElementById('submissions-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 24px;">กำลังโหลดข้อมูล...</td></tr>';

  try {
    let url = API_URL + "/submissions";

    // กรองตาม Lab ID ถ้ามีการส่งมาใน URL
    if (currentLabName) {
      url += "?lab_id=" + encodeURIComponent(currentLabName);
    }

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("API error");
    }
    const data = await res.json();

    tbody.innerHTML = ''; // ล้าง Loader

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: #64748b;">ไม่มีข้อมูลการส่งงาน</td></tr>`;
      return;
    }

    data.forEach(d => {
      const tr = document.createElement('tr');

      let statusText = 'รอ';
      let statusClass = 'status-pending';
      
      if (d.status === 'pass') {
          statusText = 'ผ่าน';
          statusClass = 'status-pass';
      } else if (d.status === 'fail') {
          statusText = 'ไม่ผ่าน';
          statusClass = 'status-fail';
      }

      // เมื่อคลิกที่แถว ให้ไปหน้าแสดงรายละเอียด
      tr.onclick = () => {
        window.location.href = `ta-submission-detail.html?lab=${encodeURIComponent(d.lab_id)}&student=${encodeURIComponent(d.student_id)}`;
      };

      tr.innerHTML = `
        <td style="font-weight: 500;">${d.student_id}</td>
        <td>${d.lab_id}</td>
        <td class="${statusClass}">${statusText}</td>
        <td style="font-family: monospace;">${d.score ?? '-'}</td>
        <td style="color: #64748b; max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${d.detected_text || ''}">
            ${d.detected_text || '-'}
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Load Submissions Error:", err);
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px; color: #ef4444;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>`;
  }
}

window.onload = async () => {
    const storedUser = localStorage.getItem('labsarb_admin');
    if (!storedUser) {
        window.location.href = 'login.html';
        return;
    }
    const userEl = document.getElementById('dropdown-username');
    if (userEl) userEl.textContent = storedUser;

    await loadSubmissions();
};