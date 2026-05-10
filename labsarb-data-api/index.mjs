import { getAllLabResults, getLabResultsByStudent, getAllTemplates, saveOrUpdateLab, deleteLabResult, getAllUsers, saveUser, deleteUser } from './db-helper.mjs';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET = "cs254-projects";

export const handler = async (event) => {

    const rawPath = event.rawPath || event.path || '';
    const path = rawPath.split(' ')[0];
    const method = event.requestContext?.http?.method || event.httpMethod;

    console.log(`Method: ${method}, Path: ${path}`);

    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    };

    try {
        if (method === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        // ============================
        // STUDENTS (Labsarb_Users)
        // ============================

        // GET /students/{id} — ดึงผลงานทั้งหมดของนักศึกษาคนหนึ่ง
        if (method === 'GET' && path.includes('/students/')) {
            const studentId = decodeURIComponent(path.split('/students/')[1]);
            const results = await getLabResultsByStudent(studentId);
            return { statusCode: 200, headers, body: JSON.stringify(results) };
        }

        // GET /students — รายชื่อนักศึกษาทั้งหมดจาก Labsarb_Users
        if (method === 'GET' && path.endsWith('/students')) {
            const users = await getAllUsers();
            return { statusCode: 200, headers, body: JSON.stringify(users) };
        }

        // POST /students — เพิ่มนักศึกษาลง Labsarb_Users
        if (method === 'POST' && path.endsWith('/students')) {
            const body = JSON.parse(event.body);
            await saveUser({
                student_id: body.student_id,
                name: body.name || null,
                name_en: body.name_en || null,
                email: body.email || null,
                faculty: body.faculty || null,
                updated_at: new Date().toISOString()
            });
            return { statusCode: 200, headers, body: JSON.stringify({ message: "student added" }) };
        }

        // DELETE /students/{id} — ลบนักศึกษาออกจาก Labsarb_Users
        if (method === 'DELETE' && path.includes('/students/')) {
            const studentId = decodeURIComponent(path.split('/students/')[1]);
            await deleteUser(studentId);
            return { statusCode: 200, headers, body: JSON.stringify({ message: "student deleted" }) };
        }

        // ============================
        // SUBMISSIONS (LabsarbResults)
        // ============================

        // GET /submissions — ผลการส่งงาน กรองได้ด้วย student_id และ/หรือ lab_id
        if (method === 'GET' && path.endsWith('/submissions')) {
            const query = event.queryStringParameters || {};
            const studentId = query.student_id;
            const labId = query.lab_id;

            let results = await getAllLabResults();

            if (studentId) results = results.filter(r => r.student_id === studentId);
            if (labId) results = results.filter(r => r.lab_id === labId);

            return { statusCode: 200, headers, body: JSON.stringify(results) };
        }

        // ============================
        // LABS (LabsarbTemplates)
        // ============================

        // GET /labs — ดึง lab ทั้งหมดจาก LabsarbTemplates
        if (method === 'GET' && path.endsWith('/labs')) {
            const templates = await getAllTemplates();
            return { statusCode: 200, headers, body: JSON.stringify(templates) };
        }

        // ============================
        // UPLOAD
        // ============================

        // POST /upload-url — ขอ presigned URL สำหรับอัปโหลดรูปใน S3
        if (method === 'POST' && path.endsWith('/upload-url')) {
            const body = JSON.parse(event.body);
            const { student_id, lab_id, file_type, file_name, is_template } = body;

            let key;
            if (is_template) {
                key = `teacher_template/${lab_id}/template/answer.png`;
            } else {
                // ใช้ชื่อไฟล์เดิม (sanitized) เพื่อให้ path ใน S3 ตรงกับที่เก็บใน DB
                const safeName = file_name
                    ? file_name.replace(/[^a-zA-Z0-9._-]/g, '_')
                    : `submission_${Date.now()}.png`;
                key = `student_assignment/submissions/${lab_id}/sid${student_id}/${safeName}`;
            }

            const command = new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                ContentType: file_type
            });

            const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
            const fileUrl = `https://${BUCKET}.s3.amazonaws.com/${key}`;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ uploadUrl, fileUrl })
            };
        }

        // ============================
        // EDIT / SCORE
        // ============================

        // POST /edit-lab — บันทึก/อัปเดตผลการส่งงานหรือ template
        if (method === 'POST' && path.endsWith('/edit-lab')) {
            const body = JSON.parse(event.body);
            body.updated_at = new Date().toISOString();

            let result;
            if (body.student_id === "TEMPLATE_DATA") {
                result = await saveOrUpdateLab(body, "LabsarbTemplates");
            } else {
                result = await saveOrUpdateLab(body);
            }

            return { statusCode: 200, headers, body: JSON.stringify(result) };
        }

        // POST /update-score — อัปเดตคะแนนและผล rekognition
        if (method === 'POST' && path.endsWith('/update-score')) {
            const body = JSON.parse(event.body);
            body.updated_at = new Date().toISOString();
            const result = await saveOrUpdateLab(body);
            return { statusCode: 200, headers, body: JSON.stringify(result) };
        }

        // DELETE /delete — ลบ submission
        if (method === 'DELETE' || (method === 'POST' && path.endsWith('/delete'))) {
            const body = JSON.parse(event.body);
            if (!body.student_id || !body.lab_id) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: "ต้องระบุ student_id และ lab_id" }) };
            }
            const result = await deleteLabResult(body.student_id, body.lab_id);
            return { statusCode: 200, headers, body: JSON.stringify(result) };
        }

        return { statusCode: 404, headers, body: JSON.stringify({ error: "Route not found" }) };

    } catch (error) {
        console.error("API Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: "Internal Server Error", details: error.message })
        };
    }
};
