/* ta-submissions-logic.js */

const urlParams = new URLSearchParams(window.location.search);
currentLabName = urlParams.get('lab'); // ใช้ตัวแปร let จาก ta-portal.js
let activeLabFilter = currentLabName || null;
let _allSubmissions = [];

if (currentLabName && document.getElementById('sub-list-title')) {
    document.getElementById('sub-list-title').textContent = currentLabName;
}

function buildFilterSelect(data) {
    const select = document.getElementById('lab-filter-select');
    if (!select) return;
    select.innerHTML = '';

    const allOpt = document.createElement('option');
    allOpt.value = '__all__';
    allOpt.textContent = 'ทั้งหมด (' + data.length + ')';
    select.appendChild(allOpt);

    const labs = [...new Set(data.map(d => d.lab_id))];
    labs.forEach(labId => {
        const count = data.filter(d => d.lab_id === labId).length;
        const opt = document.createElement('option');
        opt.value = labId;
        opt.textContent = labId + ' (' + count + ')';
        if (labId === activeLabFilter) opt.selected = true;
        select.appendChild(opt);
    });

    if (!activeLabFilter) select.value = '__all__';
}

function onFilterChange(value) {
    activeLabFilter = value === '__all__' ? null : value;
    const titleEl = document.getElementById('sub-list-title');
    if (titleEl) titleEl.textContent = activeLabFilter || 'รายการส่งงานทั้งหมด';
    renderRows(_allSubmissions);
}

function renderRows(data) {
    const tbody = document.getElementById('submissions-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const filtered = activeLabFilter
        ? data.filter(d => d.lab_id === activeLabFilter)
        : data;

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#64748b;padding:24px;">ยังไม่มีข้อมูลการส่งงาน</td></tr>';
        return;
    }

    filtered.forEach(d => {
        const tr = document.createElement('tr');
        tr.style.cursor = 'pointer';
        tr.onclick = () => {
            window.location.href = `ta-submission-detail.html?lab=${encodeURIComponent(d.lab_id)}&student=${encodeURIComponent(d.student_id)}`;
        };

        let statusHtml = '<span class="status-badge pending">รอตรวจ</span>';
        if (d.status === 'pass') statusHtml = '<span class="status-badge pass">ผ่านเกณฑ์</span>';
        else if (d.status === 'fail') statusHtml = '<span class="status-badge fail">ปรับปรุง</span>';

        tr.innerHTML =
            `<td style="font-weight:500;">${d.student_id}</td>` +
            `<td>${d.lab_id}</td>` +
            `<td>${statusHtml}</td>` +
            `<td>${d.score !== undefined ? d.score : '-'} / 10</td>` +
            `<td style="color:#64748b;font-size:12px;">${d.detected_text || '-'}</td>`;
        tbody.appendChild(tr);
    });
}

async function loadSubmissions() {
    const tbody = document.getElementById('submissions-tbody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:24px;">กำลังโหลดข้อมูล...</td></tr>';

    try {
        const res = await fetch(API_URL + "/submissions");
        if (!res.ok) throw new Error("API error");
        _allSubmissions = await res.json();

        buildFilterSelect(_allSubmissions);
        renderRows(_allSubmissions);
    } catch (err) {
        console.error("Load Submissions Error:", err);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:#ef4444;">เกิดข้อผิดพลาดในการโหลดข้อมูล</td></tr>';
    }
}

window.onload = async () => {
    const storedUser = localStorage.getItem('labsarb_admin');
    if (!storedUser) {
        window.location.href = '../login.html';
        return;
    }
    const userEl = document.getElementById('dropdown-username');
    if (userEl) userEl.textContent = storedUser;

    await loadSubmissions();
};
