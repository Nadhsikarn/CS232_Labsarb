// ==========================================================================
// [FOR: DATABASE ARCHITECT & WEB BACKEND]
// หน้าที่: 
// 1. จัดการการเชื่อมต่อกับ DynamoDB
// 2. เขียนฟังก์ชัน Get, Put, Update, Delete ข้อมูล
// ==========================================================================

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

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

// 2. ฟังก์ชันบันทึก/อัปเดตข้อมูลแล็บ (Edit Lab) — รองรับทุกฟิลด์
export const saveOrUpdateLab = async (data) => {
    console.log("บันทึกข้อมูลลง DB:", data);

    // สร้าง UpdateExpression แบบ dynamic ตามฟิลด์ที่ส่งมา
    const expressionParts = [];
    const expressionNames = {};
    const expressionValues = {};

    if (data.status !== undefined) {
        expressionParts.push("#status = :status");
        expressionNames["#status"] = "status";
        expressionValues[":status"] = data.status;
    }
    if (data.score !== undefined) {
        expressionParts.push("score = :score");
        expressionValues[":score"] = data.score;
    }
    if (data.lab_data !== undefined) {
        expressionParts.push("lab_data = :lab_data");
        expressionValues[":lab_data"] = data.lab_data;
    }
    if (data.lab_name !== undefined) {
        expressionParts.push("lab_name = :lab_name");
        expressionValues[":lab_name"] = data.lab_name;
    }
    if (data.deadline !== undefined) {
        expressionParts.push("deadline = :deadline");
        expressionValues[":deadline"] = data.deadline;
    }
    if (data.updated_by !== undefined) {
        expressionParts.push("updated_by = :updated_by");
        expressionValues[":updated_by"] = data.updated_by;
    }
    if (data.updated_at !== undefined) {
        expressionParts.push("updated_at = :updated_at");
        expressionValues[":updated_at"] = data.updated_at;
    }
    if (data.image_url !== undefined) {
        expressionParts.push("image_url = :image_url");
        expressionValues[":image_url"] = data.image_url;
    }
    if (data.detected_text !== undefined) {
        expressionParts.push("detected_text = :detected_text");
        expressionValues[":detected_text"] = data.detected_text;
    }
    if (data.missing_point !== undefined) {
        expressionParts.push("missing_point = :missing_point");
        expressionValues[":missing_point"] = data.missing_point;
    }

    if (expressionParts.length === 0) {
        return { status: "error", message: "ไม่มีฟิลด์ที่ต้องอัปเดต" };
    }

    const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
            student_id: data.student_id,
            lab_id: data.lab_id
        },
        UpdateExpression: "set " + expressionParts.join(", "),
        ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: "UPDATED_NEW"
    });

    await docClient.send(command);
    return { status: "success", message: "บันทึกลงฐานข้อมูลสำเร็จ" };
};

// 3. ฟังก์ชันลบข้อมูล
export const deleteLabResult = async (studentId, labId) => {
    console.log(`ลบข้อมูลของ ${studentId} แล็บ ${labId}`);
    const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { student_id: studentId, lab_id: labId }
    });
    await docClient.send(command);
    return { status: "success", message: "ลบข้อมูลสำเร็จ" };
};