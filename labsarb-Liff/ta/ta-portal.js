const API_URL = "https://efmsyxbc9j.execute-api.us-east-1.amazonaws.com";

// ================= STATE =================
let coursesList = [
  { code: 'CS232', name: 'Cloud Computing' },
  { code: 'CS231', name: 'Data Structures' }
];

let currentCourseCode = '';
let currentLabName = '';

let addedStudents = [];
let uploadedGroundTruthFiles = [];


// ================= AUTH =================
window.onload = () => {
  const storedUser = localStorage.getItem('labsarb_admin');
  if (storedUser) {
    document.getElementById('app-container').style.display = 'flex';
    document.getElementById('dropdown-username').textContent = storedUser;
    updateCourseDropdown();
    goTo('courses');
  } else {
    window.location.href = '../login.html';
  }
};

function doLogout() {
  localStorage.removeItem('labsarb_admin');
  window.location.href = '../login.html';
}

function toggleProfileDropdown() {
  document.getElementById('profile-dropdown').classList.toggle('active');
}

document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('profile-dropdown');
  const circle = document.querySelector('.profile-circle');
  if (
    dropdown &&
    dropdown.classList.contains('active') &&
    !dropdown.contains(e.target) &&
    (!circle || !circle.contains(e.target))
  ) {
    dropdown.classList.remove('active');
  }
});


// ================= NAV =================
function goTo(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(`screen-${screen}`).classList.add('active');

  if (screen === 'courses') loadCourses();
  if (screen === 'dashboard') loadDashboard();
  if (screen === 'submissions') loadSubmissions();
}


// ================= COURSES =================
function updateCourseDropdown() {
  const select = document.getElementById('config-course');
  if (!select) return;
  select.innerHTML = '<option value="">เลือกรายวิชา...</option>';
  coursesList.forEach(c => {
    select.innerHTML += `<option value="${c.code}">${c.code} ${c.name}</option>`;
  });
}

function loadCourses() {
  const grid = document.getElementById('courses-grid');
  if (!grid) return;
  grid.innerHTML = '';

  coursesList.forEach(c => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.onclick = () => openCourseDashboard(c.code);
    card.innerHTML = `<h3>${c.code}</h3><p>${c.name}</p>`;
    grid.appendChild(card);
  });
}

function openCourseDashboard(code) {
  currentCourseCode = code;
  goTo('dashboard');
}


// ================= DASHBOARD =================
async function loadDashboard() {
  const grid = document.getElementById('dashboard-grid');
  if (!grid) return;
  grid.innerHTML = '';

  try {
    const res = await fetch(API_URL + "/submissions");
    const data = await res.json();

    const labs = {};
    data.forEach(item => {
      if (!labs[item.lab_id]) labs[item.lab_id] = { pass: 0, fail: 0, pending: 0 };
      if (item.status === 'pass') labs[item.lab_id].pass++;
      else if (item.status === 'fail') labs[item.lab_id].fail++;
      else labs[item.lab_id].pending++;
    });

    Object.entries(labs).forEach(([labName, stats]) => {
      const card = document.createElement('div');
      card.className = 'lab-card';
      card.innerHTML = `<h3>${labName}</h3><div>ผ่าน ${stats.pass} | ไม่ผ่าน ${stats.fail} | รอ ${stats.pending}</div>`;
      card.onclick = () => { currentLabName = labName; goTo('submissions'); };
      grid.appendChild(card);
    });

  } catch (err) {
    console.error(err);
  }
}


// ================= SUBMISSIONS =================
async function loadSubmissions() {
  const tbody = document.getElementById('submissions-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  try {
    let url = API_URL + "/submissions";
    if (currentLabName) url += "?lab_id=" + currentLabName;

    const res = await fetch(url);
    const data = await res.json();

    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">ไม่มีข้อมูล</td></tr>`;
      return;
    }

    data.forEach(d => {
      const tr = document.createElement('tr');
      let status = 'รอตรวจ';
      if (d.status === 'pass') status = 'ผ่าน';
      if (d.status === 'fail') status = 'ไม่ผ่าน';
      tr.innerHTML = `
        <td>${d.student_id}</td>
        <td>${d.lab_id}</td>
        <td>${status}</td>
        <td>${d.score ?? '-'}</td>
        <td>${d.detected_text || '-'}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
  }
}


// ================= CREATE LAB =================
async function initLab() {
  const name = document.getElementById('config-lab-name').value.trim();
  const desc = document.getElementById('config-desc').value.trim();
  const file = uploadedGroundTruthFiles[0];

  if (!name) { alert('กรุณาตั้งชื่อ Lab'); return; }
  if (!file) { alert('กรุณาอัปโหลดรูปเฉลย'); return; }

  try {
    const resUrl = await fetch(API_URL + "/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lab_id: name, file_type: file.type, is_template: true })
    });

    const { uploadUrl, fileUrl } = await resUrl.json();

    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type }
    });

    const deadline = document.getElementById('config-deadline-date')?.value || '';
    const time = document.getElementById('config-deadline-time')?.value || '';

    await fetch(API_URL + "/edit-lab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: "TEMPLATE_DATA",
        lab_id: name,
        lab_data: desc,
        image_url: fileUrl,
        deadline: deadline && time ? `${deadline}T${time}:00` : deadline
      })
    });

    alert("สร้าง Lab สำเร็จ!");
    window.location.href = 'ta-dashboard.html';

  } catch (err) {
    console.error(err);
    alert("เกิด error: " + err.message);
  }
}


// ================= HELPERS =================
function addStudentToList(id, name) {
  addedStudents.push({ id, name });
}

function removeStudentFromList(id) {
  addedStudents = addedStudents.filter(s => s.id !== id);
}

function handleFilesSelected(files) {
  if (!files) return;
  for (let i = 0; i < files.length; i++) {
    uploadedGroundTruthFiles.push(files[i]);
  }
}
