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
    window.location.href = 'login.html';
  }
};

function doLogout() {
  localStorage.removeItem('labsarb_admin');
  window.location.href = 'login.html';
}

function toggleProfileDropdown() {
  document.getElementById('profile-dropdown').classList.toggle('active');
}


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
  select.innerHTML = '<option value="">เลือกรายวิชา...</option>';
  coursesList.forEach(c => {
    select.innerHTML += `<option value="${c.code}">${c.code} ${c.name}</option>`;
  });
}

function loadCourses() {
  const grid = document.getElementById('courses-grid');
  grid.innerHTML = '';

  coursesList.forEach(c => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.onclick = () => openCourseDashboard(c.code);

    card.innerHTML = `
      <h3>${c.code}</h3>
      <p>${c.name}</p>
    `;
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
  grid.innerHTML = '';

  try {
    const res = await fetch(API_URL + "/submissions");
    const data = await res.json();

    const labs = {};

    data.forEach(item => {
      const lab = item.lab_id;

      if (!labs[lab]) {
        labs[lab] = { pass: 0, fail: 0, pending: 0 };
      }

      if (item.status === 'pass') labs[lab].pass++;
      else if (item.status === 'fail') labs[lab].fail++;
      else labs[lab].pending++;
    });

    Object.entries(labs).forEach(([labName, stats]) => {
      const card = document.createElement('div');
      card.className = 'lab-card';

      card.innerHTML = `
        <h3>${labName}</h3>
        <div>ผ่าน ${stats.pass} | ไม่ผ่าน ${stats.fail} | รอ ${stats.pending}</div>
      `;

      card.onclick = () => {
        currentLabName = labName;
        goTo('submissions');
      };

      grid.appendChild(card);
    });

  } catch (err) {
    console.error(err);
  }
}


// ================= SUBMISSIONS =================
async function loadSubmissions() {
  const tbody = document.getElementById('submissions-tbody');
  tbody.innerHTML = '';

  try {
    let url = API_URL + "/submissions";

    if (currentLabName) {
      url += "?lab_id=" + currentLabName;
    }

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


// ================= CREATE LAB (ใช้ API แล้ว) =================
async function initLab() {
  const name = document.getElementById('config-lab-name').value.trim();
  const desc = document.getElementById('config-desc').value.trim();

  if (!name) {
    alert('กรุณาตั้งชื่อ Lab');
    return;
  }

  try {
    const res = await fetch(API_URL + "/edit-lab", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        student_id: "CONFIG",
        lab_id: name,
        lab_name: name,
        lab_data: desc,
        status: "config"
      })
    });

    const data = await res.json();
    console.log(data);

    alert("สร้าง Lab สำเร็จ!");
    goTo('dashboard');

  } catch (err) {
    console.error(err);
    alert("เกิด error");
  }
}


// ================= STUDENT (ยัง local) =================
function addStudentToList(id, name) {
  addedStudents.push({ id, name });
}

function removeStudentFromList(id) {
  addedStudents = addedStudents.filter(s => s.id !== id);
}


// ================= UPLOAD (ยัง local) =================
function handleFilesSelected(files) {
  if (!files) return;
  for (let i = 0; i < files.length; i++) {
    uploadedGroundTruthFiles.push(files[i]);
  }
}