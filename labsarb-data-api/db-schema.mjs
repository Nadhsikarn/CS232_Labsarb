// ==========================================================================
// [FOR: DATABASE ARCHITECT] - หน้าที่ของคุณ:
// 1. จัดการโครงสร้างตารางทั้งหมดในระบบ Labsarb
// ==========================================================================

// 1. ตารางเก็บผลการตรวจงาน (สำหรับนักศึกษา)
export const resultsTableSchema = {
    TableName: "LabsarbResults",
    AttributeDefinitions: [
        { AttributeName: "student_id", AttributeType: "S" },
        { AttributeName: "lab_id", AttributeType: "S" }
    ],
    KeySchema: [
        { AttributeName: "student_id", KeyType: "HASH" }, // Partition Key
        { AttributeName: "lab_id", KeyType: "RANGE" }     // Sort Key
    ]
};

// 2. ตารางเก็บเฉลยต้นแบบ (สำหรับอาจารย์) - 🆕 เพิ่มส่วนนี้
export const templatesTableSchema = {
    TableName: "LabsarbTemplates",
    AttributeDefinitions: [
        { AttributeName: "lab_id", AttributeType: "S" }
    ],
    KeySchema: [
        { AttributeName: "lab_id", KeyType: "HASH" }      // Partition Key อย่างเดียวตามรูป DB ของคุณ
    ]
};