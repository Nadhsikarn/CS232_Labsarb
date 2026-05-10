/**
 * ข้อมูลรายละเอียดของแต่ละขั้นตอนใน Workflow
 */
const nodeInfo = {
    start: {
        title: "Start",
        type: "Start Node",
        desc: "จุดเริ่มต้นของ Workflow — Teacher/TA เข้าใช้งานระบบ Labsarb เพื่อจัดการ Lab และดูผลการตรวจงาน",
        hint: ""
    },
    login: {
        title: "Login as Teacher",
        type: "Process",
        desc: "เข้าสู่ระบบด้วยบัญชี TU ผ่าน TU API พร้อมผูกกับ LINE User ID เพื่อยืนยันตัวตน",
        hint: "เชื่อมต่อกับ labsarb-tu-auth (Python Lambda)"
    },
    selectMenu: {
        title: "Select Menu",
        type: "Decision",
        desc: "เลือกเมนูหลัก 2 ทาง:\n\n• Dashboard — ดูผลการส่งงาน\n• Lab Editor — สร้าง/แก้ไข Lab",
        hint: ""
    },
    selectLabA: {
        title: "Select LAB (Dashboard)",
        type: "Process — Path A",
        desc: "เลือก Lab ที่ต้องการดูผลการส่งงานของนักศึกษา เช่น LAB_01, LAB_02 เป็นต้น",
        hint: "ข้อมูลดึงจาก DynamoDB ตาราง LabsarbResults"
    },
    showDashboard: {
        title: "Show Dashboard",
        type: "Process — Path A",
        desc: "แสดง Dashboard สรุปผลการส่งงาน — จำนวนผ่าน/ไม่ผ่าน/รอตรวจ พร้อมแสดงสถานะของนักศึกษาแต่ละคน",
        hint: "เรียกใช้ GET API จาก labsarb-data-api"
    },
    viewDetail: {
        title: "View Detail",
        type: "Process — Path A",
        desc: "ดูรายละเอียดผลตรวจของนักศึกษาแต่ละคน: detected_text, status, missing_point, image_url",
        hint: "ผลมาจาก AWS Rekognition (labsarb-ai-engine)"
    },
    endA: {
        title: "End",
        type: "End Node",
        desc: "สิ้นสุดกระบวนการ Dashboard — Teacher/TA ดูข้อมูลเรียบร้อยแล้ว",
        hint: ""
    },
    isLabExist: {
        title: "Is lab exist?",
        type: "Decision — Path B",
        desc: "ตรวจสอบว่ามี Lab ที่ต้องการแก้ไขอยู่ในระบบแล้วหรือไม่",
        hint: ""
    },
    addLab: {
        title: "Add LAB",
        type: "Process — Path B",
        desc: "สร้าง Lab ใหม่ในระบบ กำหนดชื่อ Lab และรายละเอียดเบื้องต้น",
        hint: "เรียกใช้ POST API (/edit-lab) จาก labsarb-data-api"
    },
    selectLabB: {
        title: "Select LAB (Editor)",
        type: "Process — Path B",
        desc: "เลือก Lab ที่ต้องการแก้ไข เพิ่ม Task หรือเพิ่ม Example Photo",
        hint: ""
    },
    addTask: {
        title: "Add Task",
        type: "Process — Path B",
        desc: "เพิ่มโจทย์/ข้อกำหนดใหม่ในแต่ละ Lab ที่ระบบ AI จะใช้เป็นเกณฑ์ในการตรวจสอบ",
        hint: "เช่น \"เขียน Hello World ด้วย Java\""
    },
    addExamplePhoto: {
        title: "Add Example Photo",
        type: "Process — Path B",
        desc: "อัปโหลดภาพตัวอย่าง (ภาพเฉลย) เข้า S3 Bucket เพื่อใช้เป็น reference สำหรับ AWS Rekognition",
        hint: "Upload ไปยัง AWS S3"
    },
    isFinish: {
        title: "Is finish?",
        type: "Decision — Path B",
        desc: "ตรวจสอบว่าเพิ่ม Task และ Example Photo ครบทุก Task แล้วหรือยัง",
        hint: "วนซ้ำได้จนกว่าจะครบ"
    },
    endB: {
        title: "End",
        type: "End Node",
        desc: "สิ้นสุดกระบวนการ Lab Editor — Lab พร้อมให้นักศึกษาส่งงาน",
        hint: ""
    }
};

let activeNode = null;

/**
 * ฟังก์ชันแสดงรายละเอียดเมื่อคลิกที่ Node
 */
function showDetail(el) {
    const id = el.dataset.id;
    const info = nodeInfo[id];
    if (!info) return;

    // เปลี่ยนสถานะ Node ที่กำลังเลือก
    if (activeNode) activeNode.classList.remove('active');
    activeNode = el;
    el.classList.add('active');

    // อัปเดตข้อมูลใน Detail Panel
    const panel = document.getElementById('detailPanel');
    panel.classList.remove('hidden');
    document.getElementById('detailTitle').textContent = info.title;
    document.getElementById('detailType').textContent = info.type;
    document.getElementById('detailDesc').innerText = info.desc;
    document.getElementById('detailHint').textContent = info.hint;
}