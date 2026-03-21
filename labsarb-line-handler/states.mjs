// ==========================================================================
// [FOR: LINE OA DEV]
// หน้าที่: จัดการ State (สถานะการคุย) 
// คำเตือน: ใน Lambda ตัวแปรแบบ Global จะอยู่แค่ชั่วคราว ถ้าระบบใหญ่ควรเก็บ State ใน DynamoDB
// ==========================================================================

let userSessions = {};

export const setUserState = (lineUserId, step, data = {}) => {
    userSessions[lineUserId] = {
        step: step,           // เช่น 'WAITING_FOR_IMAGE'
        data: data,           // เช่น { lab_id: 'LAB_01', student_id: '66XXXXXX' }
        updatedAt: Date.now()
    };
    console.log(`ตั้งค่า State ให้ ${lineUserId} เป็น ${step}`);
};

export const getUserState = (lineUserId) => {
    // ถ้าไม่มี State ให้คืนค่าสถานะเริ่มต้น
    return userSessions[lineUserId] || { step: 'IDLE', data: {} };
};

export const clearUserState = (lineUserId) => {
    delete userSessions[lineUserId];
    console.log(`ล้าง State ของ ${lineUserId} เรียบร้อย`);
};