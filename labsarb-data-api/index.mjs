import { getAllLabResults, saveOrUpdateLab, deleteLabResult } from './db-helper.mjs';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "us-east-1" });
const BUCKET = "cs254-projects";

export const handler = async (event) => {

    // ===== SAFE PATH & METHOD =====
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
        // ===== CORS =====
        if (method === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        // ============================
        // ===== STUDENTS ROUTES =====
        // ============================

        // GET /students/{id}
        if (method === 'GET' && path.includes('/students/')) {
            const studentId = path.split('/').pop();

            const results = await getAllLabResults();
            const studentData = results.filter(r => r.student_id === studentId);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(studentData)
            };
        }

        // GET /students
        if (method === 'GET' && path.endsWith('/students')) {
            const results = await getAllLabResults();

            const students = {};

            results.forEach(r => {
                // ✅ เอาเฉพาะ PROFILE เท่านั้น
                if (r.lab_id === "PROFILE") {
                    students[r.student_id] = {
                        student_id: r.student_id,
                        name: r.lab_data?.name || null,
                        email: r.lab_data?.email || null
                    };
                }
            });

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(Object.values(students))
            };
        }

        // ============================
        // ===== SUBMISSIONS FILTER ====
        // ============================

        if (method === 'GET' && path.endsWith('/submissions')) {

            const query = event.queryStringParameters || {};
            const studentId = query.student_id;
            const labId = query.lab_id;

            const results = await getAllLabResults();

            let filtered = results;

            filtered = filtered.filter(r => r.lab_id !== "PROFILE");

            // filter ตาม student
            if (studentId) {
                filtered = filtered.filter(r => r.student_id === studentId);
            }

            // filter ตาม lab
            if (labId) {
                filtered = filtered.filter(r => r.lab_id === labId);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(filtered)
            };
        }

        // POST /students
        if (method === 'POST' && path.endsWith('/students')) {
            const body = JSON.parse(event.body);

            const data = {
                student_id: body.student_id,
                lab_id: "PROFILE",
                lab_name: "student_profile",
                lab_data: {
                    ...(body.name && { name: body.name }),
                    ...(body.email && { email: body.email })
                },
                updated_at: new Date().toISOString()
            };

            await saveOrUpdateLab(data);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: "student added" })
            };
        }

        // DELETE /students/{id}
        if (method === 'DELETE' && path.includes('/students/')) {
            const studentId = path.split('/').pop();

            const results = await getAllLabResults();
            const targets = results.filter(r => r.student_id === studentId);

            for (const t of targets) {
                await deleteLabResult(t.student_id, t.lab_id);
            }

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: "student deleted" })
            };
        }

        // ============================
        // ===== LAB / SUBMISSION =====
        // ============================

        // POST /edit-lab
        if (method === 'POST' && path.endsWith('/edit-lab')) {
            const body = JSON.parse(event.body);
            body.updated_at = new Date().toISOString();

            const result = await saveOrUpdateLab(body);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result)
            };
        }

        // POST /update-score
        if (method === 'POST' && path.endsWith('/update-score')) {
            const body = JSON.parse(event.body);
            body.updated_at = new Date().toISOString();

            const result = await saveOrUpdateLab(body);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result)
            };
        }

        // DELETE /delete
        if (method === 'DELETE' || (method === 'POST' && path.endsWith('/delete'))) {
            const body = JSON.parse(event.body);

            if (!body.student_id || !body.lab_id) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: "ต้องระบุ student_id และ lab_id" })
                };
            }

            const result = await deleteLabResult(body.student_id, body.lab_id);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result)
            };
        }
        ///upload-url
        if (method === 'POST' && path.endsWith('/upload-url')) {
            const body = JSON.parse(event.body);
        
            const { student_id, lab_id, file_type } = body;
        
            const key = `student_assignment/submissions/${lab_id}/sid${student_id}/${Date.now()}.png`;
        
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
                body: JSON.stringify({
                    uploadUrl,
                    fileUrl
                })
            };
        }

        // ============================
        // ===== DEFAULT GET =====
        // ============================

        // GET /
        if (method === 'GET') {
            const results = await getAllLabResults();

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: "ส่งข้อมูลผลการตรวจของนักศึกษา",
                    data: results
                })
            };
        }

        // ============================
        // ===== NOT FOUND =====
        // ============================

        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: "Route not found" })
        };

    } catch (error) {
        console.error("API Error:", error);

        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                error: "Internal Server Error",
                details: error.message
            })
        };
    }
};