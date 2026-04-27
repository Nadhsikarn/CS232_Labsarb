// ta-portal.js
 
const COURSE_CODE = 'CS232';
 
// Initialize labs if not exists
if (!localStorage.getItem('labsarb_labs')) {
  const initialLabs = {
    'Lab 1: C Refresher': { pass: 42, fail: 5, pending: 13, desc: 'พื้นฐานการจัดการหน่วยความจำและพอยน์เตอร์' },
    'Lab 2: Simple Shell': { pass: 28, fail: 14, pending: 18, desc: 'การสร้างโปรเซส, การรันคำสั่ง และการจัดการซิกแนล' }
  };
  localStorage.setItem('labsarb_labs', JSON.stringify(initialLabs));
}
 
// ลบ block นี้ออก — ไม่ตั้งค่า submissions เป็น [] อีกต่อไป
// เพราะถ้า key ยังไม่มี getSubmissions() จะ return [] อยู่แล้ว
// และถ้า set เป็น [] ทิ้งไว้ นักศึกษา submit มา data จะถูก overwrite ทุกครั้งที่โหลดหน้า TA
 
function getLabs() {
  return JSON.parse(localStorage.getItem('labsarb_labs')) || {};
}
 
function saveLabs(labs) {
  localStorage.setItem('labsarb_labs', JSON.stringify(labs));
}
 
function getSubmissions() {
  const data = localStorage.getItem('labsarb_submissions');
  return data ? JSON.parse(data) : [];
}
 
function saveSubmissions(subs) {
  localStorage.setItem('labsarb_submissions', JSON.stringify(subs));
}
 
function getEnrolledStudents() {
  const data = localStorage.getItem('labsarb_students');
  return data ? JSON.parse(data) : [];
}
 
function saveEnrolledStudents(students) {
  localStorage.setItem('labsarb_students', JSON.stringify(students));
}
 
function checkLogin() {
  const storedUser = localStorage.getItem('labsarb_admin');
  if (!storedUser) {
    window.location.href = 'login.html';
  } else {
    const el = document.getElementById('dropdown-username');
    if (el) el.textContent = 'Admin';
  }
}
 
function doLogout() {
  localStorage.removeItem('labsarb_admin');
  window.location.href = 'login.html';
}
 
function toggleProfileDropdown() {
  const dropdown = document.getElementById('profile-dropdown');
  if (dropdown) dropdown.classList.toggle('active');
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
 