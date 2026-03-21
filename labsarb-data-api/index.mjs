// ==========================================================================
// [FOR: WEB BACKEND & TA PORTAL] - หน้าที่ของคุณ:
// 1. เขียน API สำหรับดึงผลการตรวจ (Get Result) ให้อาจารย์ดู
// 2. เขียน API สำหรับให้อาจารย์แก้ไขผลแล็บ (Edit Lab)
// 3. จัดการข้อมูลใน DynamoDB ตาม JSON "get_result" และ "edit_lab"
// ==========================================================================

export const handler = async (event) => {
    const path = event.rawPath; // หรือใช้ event.routeKey
    const method = event.requestContext.http.method;

    if (method === 'GET') {
        // TODO: ดึงข้อมูลจาก DynamoDB (JSON "get_result")
        return { message: "ส่งข้อมูลผลการตรวจของนักศึกษา" };
    }

    if (method === 'POST' && path === '/edit-lab') {
        // TODO: อัปเดตข้อมูลแล็บ (JSON "edit_lab")
        return { status: "success", message: "แก้ไขข้อมูลแล็บสำเร็จ" };
    }
};