{
    // ==========================================
    // 1. Upload Image: API สำหรับนักศึกษาส่งงานผ่าน LINE OA (LIFF หรือ Chatbot)
    // ==========================================
    "upload_image": {
        "request": {
            "line_user_id": "string", // UID ของ LINE เพื่อใช้ระบุตัวตนและตอบกลับ
            "student_id": "string",   // รหัสนักศึกษา (ดึงจากระบบผูกบัญชี)
            "lab_id": "string",       // รหัส Lab ที่กำลังส่ง
            "image_url": "string"     // ลิงก์รูปภาพ (ถ้าส่งเข้าแชท Backend ต้องดึงจาก LINE API ไปเก็บลง S3 แล้วส่งลิงก์ S3 มา)
        },
        "response": {
            "status": "string",      
            "message": "string" // ข้อความที่ Bot จะตอบกลับ
        }
    },

    // ==========================================
    // 2. Rekognition Result: ผลจาก Rekognition
    // ==========================================
    "rekognition_result": {
        "description": "ผลการตรวจ",
        "data": {
            "student_id": "string",  
            "lab_id": "string",      
            "detected_text": "string", // ข้อความที่ AI อ่านได้จากรูป
            "status": "pass | fail", // ผลการประเมินจาก AI
            "missing_point": "string" // จุดที่ต้องแก้ไข
        }
    },

    // ==========================================
    // 3. Get Result: API ดึงผลการตรวจงาน (สำหรับ TA)
    // ==========================================
    "get_result": {
        "request": {
            "student_id": "string",  
            "lab_id": "string"       
        },
        "response": {
            "student_id": "string",  
            "lab_id": "string",      
            "status": "pass | fail", 
            "image_url": "string",   
            "detected_text": "string",
            "missing_point": "string" 
        }
    },

    // ==========================================
    // 4. Edit Lab: API สำหรับ TA แก้ไขข้อมูลแล็บ
    // ==========================================
    "edit_lab": {
        "request": {
            "student_id": "string",
        "lab_id": "string",
        "lab_data": "string", 
        "updated_by": "string"
    },
    "response": {
        "status": "success",
        "message": "แก้ไขข้อมูลแล็บสำเร็จ"
    }
}

    // ==========================================
    // 5. Notification: ข้อมูลสำหรับส่ง Push Message กลับไปทาง LINE
    // ==========================================
    "notification": {
        "data": {
            "line_user_id": "string", //ต้องใช้ UID ของ LINE เพื่อให้ Bot ส่ง Push Message ไปหาถูกคน
            "student_id": "string",  
            "lab_id": "string",      
            "status": "pass | fail", 
            "message": "string"      
        }
    }
}