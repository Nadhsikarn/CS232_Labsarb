// ==========================================================================
// [FOR: DATABASE ARCHITECT & WEB BACKEND]
// หน้าที่: 
// 1. จัดการการเชื่อมต่อกับ DynamoDB
// 2. เขียนฟังก์ชัน Get, Put, Update ข้อมูล
// ==========================================================================

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "LabsarbResults";

// 1. ฟังก์ชันดึงข้อมูลผลแล็บ (Get Result)
export const getLabResult = async (studentId, labId) => {
    // TODO: เขียนคำสั่ง GetCommand ดึงข้อมูลจาก DynamoDB
    console.log(`ดึงข้อมูลของ ${studentId} แล็บ ${labId}`);

    // Mock Data คืนค่าให้ฝั่งเว็บเอาไปทำ UI ก่อน
    return {
        student_id: studentId,
        lab_id: labId,
        status: "pass",
        image_url: "https://s3.amazonaws.com/.../image.jpg",
        detected_text: "...",
        missing_point: "-"
    };
};

// 2. ฟังก์ชันบันทึก/อัปเดตข้อมูลแล็บ (Edit Lab)
export const saveOrUpdateLab = async (data) => {
    // TODO: เขียนคำสั่ง PutCommand หรือ UpdateCommand
    console.log("บันทึกข้อมูลลง DB:", data);
    return { status: "success", message: "บันทึกลงฐานข้อมูลสำเร็จ" };
};