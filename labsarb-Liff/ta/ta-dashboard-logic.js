/* ta-dashboard-logic.js */

window.onload = async () => {
    const storedUser = localStorage.getItem('labsarb_admin');
    if (!storedUser) {
        window.location.href = '../login.html';
        return;
    }
    const userEl = document.getElementById('dropdown-username');
    if (userEl) userEl.textContent = storedUser;

    await loadDashboard();
};

async function loadDashboard() {
    const grid = document.getElementById('dashboard-grid');
    if (!grid) return;

    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">กำลังโหลดข้อมูล...</div>';

    try {
        const [labsRes, subsRes] = await Promise.all([
            fetch(API_URL + "/labs"),
            fetch(API_URL + "/submissions")
        ]);

        const labs = await labsRes.json();
        const submissions = await subsRes.json();

        // สร้าง stats จาก labs ที่อาจารย์สร้างไว้
        const stats = {};
        labs.forEach(lab => {
            stats[lab.lab_id] = {
                pass: 0, fail: 0, pending: 0,
                desc: lab.lab_description || ''
            };
        });

        // นับ submission ของแต่ละ lab
        submissions.forEach(sub => {
            if (!stats[sub.lab_id]) return;
            if (sub.status === 'pass') stats[sub.lab_id].pass++;
            else if (sub.status === 'fail') stats[sub.lab_id].fail++;
            else stats[sub.lab_id].pending++;
        });

        grid.innerHTML = '';

        if (Object.keys(stats).length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">ยังไม่มีการทดลอง กด "สร้าง LAB ใหม่" เพื่อเริ่มต้น</div>';
            return;
        }

        Object.entries(stats).forEach(([labId, s]) => {
            const card = document.createElement('div');
            card.className = 'lab-card';
            card.style.cursor = 'pointer';
            card.onclick = () => window.location.href = `ta-submissions.html?lab=${encodeURIComponent(labId)}`;
            card.innerHTML = `
                <h3>${labId}</h3>
                <p>${s.desc || 'ไม่มีคำอธิบาย'}</p>
                <div class="lab-stats">
                    <div>ผ่าน: ${s.pass}</div>
                    <div>ไม่ผ่าน: ${s.fail}</div>
                    <div>รอดำเนินการ: ${s.pending}</div>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (err) {
        console.error("Dashboard Load Error:", err);
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #ef4444;">เกิดข้อผิดพลาดในการดึงข้อมูล</div>`;
    }
}
