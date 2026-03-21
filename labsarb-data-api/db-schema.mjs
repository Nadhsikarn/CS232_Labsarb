// ==========================================================================
// [FOR: DATABASE ARCHITECT] - หน้าที่ของคุณ:
// 1. สร้างตาราง DynamoDB ชื่อ 'LabsarbResults'
// 2. กำหนด Partition Key เป็น 'student_id' และ Sort Key เป็น 'lab_id'
// 3. ตรวจสอบให้แน่ใจว่า Field ตรงกับ JSON "get_result"
// ==========================================================================

export const tableSchema = {
    TableName: "LabsarbResults",
    AttributeDefinitions: [
        { AttributeName: "student_id", AttributeType: "S" },
        { AttributeName: "lab_id", AttributeType: "S" }
    ]
};