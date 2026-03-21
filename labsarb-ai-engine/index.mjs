// ==========================================================================
// [FOR: AI REKOGNITION EXPERT] - หน้าที่ของคุณ:
// 1. นำรูปมาผ่าน AWS Rekognition (DetectText หรือ CompareFaces)
// 2. ตรวจสอบความถูกต้องตามเงื่อนไขของแต่ละ Lab
// 3. คืนค่าตามโครงสร้าง JSON "rekognition_result"
// ==========================================================================

export const handler = async (event) => {
    // ข้อมูลที่ส่งมาจาก Line Handler
    const { student_id, lab_id, image_id } = event;

    // TODO: เขียน Logic Rekognition ตรงนี้
    // 1. ดึงรูปจาก S3 หรือ LINE
    // 2. สั่ง Rekognition อ่านค่า

    const result = {
        student_id: student_id,
        lab_id: lab_id,
        detected_text: "ตัวอย่าง: System.out.println('Hello')", // AI อ่านได้
        status: "pass", // หรือ fail
        missing_point: "ลืมใส่เครื่องหมาย ; ตรงบรรทัดที่ 5"
    };

    return result; // ส่งค่ากลับไปตาม JSON "rekognition_result"
};