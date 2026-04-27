// student-portal.js

function getStudentInfo() {
  const studentId = localStorage.getItem('labsarb_student');
  const studentInfoStr = localStorage.getItem('labsarb_student_info');

  if (!studentId) {
    return null;
  }

  let studentName = 'นักศึกษา';
  let studentEmail = `${studentId}@dome.tu.ac.th`;
  let studentFaculty = '';

  if (studentInfoStr) {
    try {
      const info = JSON.parse(studentInfoStr);
      if (info.name) studentName = info.name;
      else if (info.displayname_th) studentName = info.displayname_th;
      else if (info.displayname_en) studentName = info.displayname_en;

      if (info.email) studentEmail = info.email;

      if (info.faculty) {
        studentFaculty = info.faculty + (info.department ? ` (${info.department})` : '');
      }
    } catch (e) { console.error("Error parsing student info", e); }
  }

  return { studentId, studentName, studentEmail, studentFaculty };
}

function checkStudentLogin() {
  const info = getStudentInfo();
  if (!info) {
    window.location.href = 'login.html';
    return;
  }
  
  const triggerName = document.getElementById('trigger-student-name');
  if (triggerName) triggerName.textContent = info.studentName;

  const cardName = document.getElementById('card-student-name');
  if (cardName) cardName.textContent = info.studentName;

  const cardId = document.getElementById('card-student-id');
  if (cardId) cardId.textContent = 'รหัสนักศึกษา: ' + info.studentId;

  const cardEmail = document.getElementById('card-student-email');
  if (cardEmail) cardEmail.textContent = info.studentEmail;

  const cardFaculty = document.getElementById('card-student-faculty');
  if (cardFaculty) cardFaculty.textContent = info.studentFaculty;
}

function toggleProfileCard() {
  const card = document.getElementById('profile-card');
  if (card) {
    card.classList.toggle('active');
  }
}

document.addEventListener('click', (e) => {
  const container = document.getElementById('profile-container');
  const card = document.getElementById('profile-card');
  if (container && card && !container.contains(e.target)) {
    card.classList.remove('active');
  }
});

function doStudentLogout() {
  localStorage.removeItem('labsarb_student');
  localStorage.removeItem('labsarb_student_info');
  window.location.href = 'login.html';
}

function getLabs() {
  const data = localStorage.getItem('labsarb_labs');
  return data ? JSON.parse(data) : {};
}

function getSubmissions() {
  const data = localStorage.getItem('labsarb_submissions');
  return data ? JSON.parse(data) : [];
}

function saveSubmissions(subs) {
  localStorage.setItem('labsarb_submissions', JSON.stringify(subs));
}