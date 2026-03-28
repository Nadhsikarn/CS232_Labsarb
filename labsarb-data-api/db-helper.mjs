// ==========================================================================
// [FOR: DATABASE ARCHITECT & WEB BACKEND]
// หน้าที่: 
// 1. จัดการการเชื่อมต่อกับ DynamoDB
// 2. เขียนฟังก์ชัน Get, Put, Update ข้อมูล
// ==========================================================================

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "LabsarbResults";

// 1. ฟังก์ชันดึงข้อมูลผลแล็บทั้งหมด (สำหรับหน้า Dashboard)
export const getAllLabResults = async () => {
    console.log(`ดึงข้อมูลผลแล็บทั้งหมดจากตาราง ${TABLE_NAME}`);
    const command = new ScanCommand({ TableName: TABLE_NAME });
    const response = await docClient.send(command);
    return response.Items; // คืนค่าเป็น Array ของนักศึกษาทุกคน
};

// 1.1 ฟังก์ชันดึงข้อมูลผลแล็บของคนเดียว
export const getLabResult = async (studentId, labId) => {
    console.log(`ดึงข้อมูลของ ${studentId} แล็บ ${labId}`);
    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: { student_id: studentId, lab_id: labId }
    });
    const response = await docClient.send(command);
    return response.Item;
};

// 2. ฟังก์ชันบันทึก/อัปเดตข้อมูลแล็บ (Edit Lab)
export const saveOrUpdateLab = async (data) => {
    console.log("บันทึกข้อมูลลง DB:", data);
    const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
            student_id: data.student_id,
            lab_id: data.lab_id
        },
        UpdateExpression: "set #status = :s, score = :score",
        ExpressionAttributeNames: {
            "#status": "status" // ป้องกันคำสงวนของ DynamoDB
        },
        ExpressionAttributeValues: {
            ":s": data.status,
            ":score": data.score !== undefined ? data.score : 0 
        },
        ReturnValues: "UPDATED_NEW"
    });   

    await docClient.send(command);
    return { status: "success", message: "บันทึกลงฐานข้อมูลสำเร็จ" };
};