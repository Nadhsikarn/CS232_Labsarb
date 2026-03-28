// ==========================================================================
// [FOR: WEB BACKEND & TA PORTAL] - หน้าที่ของคุณ:
// 1. เขียน API สำหรับดึงผลการตรวจ (Get Result) ให้อาจารย์ดู
// 2. เขียน API สำหรับให้อาจารย์แก้ไขผลแล็บ (Edit Lab)
// 3. จัดการข้อมูลใน DynamoDB ตาม JSON "get_result" และ "edit_lab"
// ==========================================================================

import { getAllLabResults, saveOrUpdateLab } from './db-helper.mjs';

export const handler = async (event) => {
    // ดึงค่า Path และ Method จาก Event ของ API Gateway
    const path = event.rawPath || event.routeKey || event.path; 
    const method = event.requestContext?.http?.method || event.httpMethod;

    console.log(`Request Method: ${method}, Path: ${path}`);

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    };

    try {
        // API ดึงข้อมูลทั้งหมด
        if (method === 'GET') {
            const results = await getAllLabResults();
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({ message: "ส่งข้อมูลผลการตรวจของนักศึกษา", data: results })
            };
        }

        // API สำหรับแก้ไขข้อมูล
        if (method === 'POST' && (path === '/edit-lab' || path.endsWith('/edit-lab'))) {
            const requestBody = JSON.parse(event.body);
            const result = await saveOrUpdateLab(requestBody);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(result)
            };
        }

        return {
            statusCode: 404,
            headers: headers,
            body: JSON.stringify({ error: "Route not found" })
        };

    } catch (error) {
        console.error("API Error:", error);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ error: "Internal Server Error", details: error.message })
        };
    }
};