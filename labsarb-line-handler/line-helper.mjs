// ==========================================================================
// [FOR: LINE OA DEV & UI DESIGNER]
// หน้าที่: 
// 1. ติดต่อกับ LINE Messaging API
// 2. สร้างโครงสร้าง Flex Message สวยๆ แจ้งผลผ่าน/ไม่ผ่าน
// ==========================================================================

// ให้ PM เอา Token มาใส่ใน Environment Variables (กระซิบ: อย่าเผลอเอาขึ้น Git นะ!)
const LINE_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || "YOUR_TOKEN_HERE";

// 1. ฟังก์ชันโหลดรูปจากแชท LINE
export const downloadImageFromLine = async (messageId) => {
    console.log(`กำลังโหลดรูป ID: ${messageId} จาก LINE...`);
    // TODO: ใช้ fetch ไปที่ https://api-data.line.me/v2/bot/message/{messageId}/content
    return Buffer.from([]); // คืนค่าเป็น Buffer
};

// 2. ฟังก์ชันส่งข้อความตอบกลับ
export const replyLineMessage = async (replyToken, messagesArray) => {
    console.log(`ตอบกลับข้อความ...`);
    // TODO: ใช้ fetch โพสต์ไปที่ https://api.line.me/v2/bot/message/reply
    // โครงสร้าง messagesArray สามารถเป็น Text ธรรมดา หรือ Flex Message ก็ได้
};

// 3. ฟังก์ชัน Push Notification (แจ้งเตือนผลตรวจ)
export const pushNotification = async (lineUserId, flexMessage) => {
    // TODO: ใช้ fetch โพสต์ไปที่ https://api.line.me/v2/bot/message/push
    console.log(`Push แจ้งเตือนไปที่ UID: ${lineUserId}`);
};