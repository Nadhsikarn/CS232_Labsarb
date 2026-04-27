/* ta-dashboard-logic.js */

// ตรวจสอบสถานะการเข้าสู่ระบบ
if (typeof checkLogin === 'function') {
  checkLogin();
}

const API_URL = "https://efmsyxbc9j.execute-api.us-east-1.amazonaws.com";

/**
 * ดึงข้อมูลผลการส่งงานทั้งหมดและแสดงผลบน Dashboard
 */
async function loadDashboard() {
  const grid = document.getElementById('dashboard-grid');
  if (!grid) return;
  
  grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">กำลังโหลดข้อมูล...</div>';

  try {
    const res = await fetch(API_URL + "/submissions");
    if (!res.ok) {
      throw new Error("API error");
    }
    
    const json = await res.json();
    const data = json.data || [];

    const labs = {};

    // จัดกลุ่มข้อมูลตาม lab_id และนับสถานะ
    data.forEach(item => {
      const lab = item.lab_id;

      if (!labs[lab]) {
        labs[lab] = {
          pass: 0,
          fail: 0,
          pending: 0,
          desc: item.lab_name || "ไม่มีคำอธิบาย"
        };
      }

      if (item.status === 'pass') labs[lab].pass++;
      else if (item.status === 'fail') labs[lab].fail++;
      else labs[lab].pending++;
    });

    grid.innerHTML = ''; // ล้าง Loader

    if (Object.keys(labs).length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">ไม่พบข้อมูลการทดลอง</div>';
        return;
    }

    // สร้างการ์ดแสดงผลสำหรับแต่ละ Lab
    Object.entries(labs).forEach(([labName, stats]) => {
      const card = document.createElement('div');
      card.className = 'lab-card';

      card.innerHTML = `
        <h3>${labName}</h3>
        <p>${stats.desc}</p>
        <div class="lab-stats">
          <div>ผ่าน: ${stats.pass}</div>
          <div>ไม่ผ่าน: ${stats.fail}</div>
          <div>รอดำเนินการ: ${stats.pending}</div>
        </div>
      `;

      grid.appendChild(card);
    });

  } catch (err) {
    console.error("Dashboard Load Error:", err);
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองใหม่อีกครั้ง</div>`;
  }
}

// เรียกใช้งานเมื่อโหลดหน้าเว็บสำเร็จ
window.onload = loadDashboard;