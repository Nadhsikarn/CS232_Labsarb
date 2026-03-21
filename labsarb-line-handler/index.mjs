// ==========================================================================
// [FOR: LINE OA DEV] - หน้าที่ของคุณ: 
// 1. จัดการ Logic การตอบโต้ (Conversation Flow) เช่น นศ. เลือก Lab ไหน
// 2. ดึงรูปจาก LINE API มาแปลงเป็น Buffer หรือส่งต่อให้ AI
// 3. ใช้ JSON "upload_image" เป็นโครงสร้างในการรับส่งข้อมูล
// ==========================================================================

import { invokeAI } from './ai-bridge.mjs';

export const handler = async (event) => {
    const body = JSON.parse(event.body);
    const lineEvent = body.events[0];

    if (lineEvent.type === 'message' && lineEvent.message.type === 'image') {
        // TODO: ดึง Image จาก LINE และระบุ studentId/labId จาก State
        const payload = {
            line_user_id: lineEvent.source.userId,
            student_id: "66XXXXXX", // ดึงจากระบบผูกบัญชี
            lab_id: "LAB_01",       // ดึงจากสถานะที่เลือกไว้
            image_id: lineEvent.message.id
        };

        // ส่งต่อไปให้ระบบ AI ตรวจสอบ
        const aiResponse = await invokeAI(payload);

        // TODO: ส่ง Notification กลับหา User ตาม JSON "notification"
        return { statusCode: 200, body: JSON.stringify(aiResponse) };
    }

    return { statusCode: 200 };
};