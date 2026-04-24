// ==========================================================================
// [FOR: WEB BACKEND & TA PORTAL] - หน้าที่ของคุณ:
// 1. เขียน API สำหรับดึงผลการตรวจ (Get Result) ให้อาจารย์ดู
// 2. เขียน API สำหรับให้อาจารย์แก้ไขผลแล็บ (Edit Lab)
// 3. เขียน API สำหรับลบข้อมูล (Delete)
// 4. เขียน API สำหรับ manual update score/status
// 5. จัดการข้อมูลใน DynamoDB ตาม JSON "get_result" และ "edit_lab"
// ==========================================================================

import { getAllLabResults, saveOrUpdateLab, deleteLabResult } from './db-helper.mjs';

export const handler = async (event) => {
    // ดึงค่า Path และ Method จาก Event ของ API Gateway
    const path = event.rawPath || event.routeKey || event.path; 
    const method = event.requestContext?.http?.method || event.httpMethod;

    console.log(`Request Method: ${method}, Path: ${path}`);

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    try {
        // CORS Preflight
        if (method === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        // API ดึงข้อมูลทั้งหมด
        if (method === 'GET') {
            const results = await getAllLabResults();
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify({ message: "ส่งข้อมูลผลการตรวจของนักศึกษา", data: results })
            };
        }

        // API สำหรับแก้ไข/สร้าง Lab (ใช้ได้ทั้ง lab config และ student data)
        if (method === 'POST' && (path === '/edit-lab' || path.endsWith('/edit-lab'))) {
            const requestBody = JSON.parse(event.body);
            // เพิ่ม timestamp อัตโนมัติ
            requestBody.updated_at = new Date().toISOString();
            const result = await saveOrUpdateLab(requestBody);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(result)
            };
        }

        // API สำหรับ update score/status ของนักศึกษา (manual override จาก Dashboard)
        if (method === 'POST' && (path === '/update-score' || path.endsWith('/update-score'))) {
            const requestBody = JSON.parse(event.body);
            requestBody.updated_at = new Date().toISOString();
            const result = await saveOrUpdateLab(requestBody);
            return {
                statusCode: 200,
                headers: headers,
                body: JSON.stringify(result)
            };
        }

        // API สำหรับลบข้อมูล
        if (method === 'DELETE' || (method === 'POST' && (path === '/delete' || path.endsWith('/delete')))) {
            const requestBody = JSON.parse(event.body);
            if (!requestBody.student_id || !requestBody.lab_id) {
                return {
                    statusCode: 400,
                    headers: headers,
                    body: JSON.stringify({ error: "ต้องระบุ student_id และ lab_id" })
                };
            }
            const result = await deleteLabResult(requestBody.student_id, requestBody.lab_id);
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