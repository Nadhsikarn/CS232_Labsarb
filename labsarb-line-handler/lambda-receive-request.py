#แยกไฟล์ไว้ก่อนเฉย ๆ พอเสร็จแล้วเดี๋ยวยุบรวมให้นะจ๊ะ
import json

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}'))

    # ดึง event แรกที่ส่งมาจาก LINE
    line_event = body.get('events', [{}])[0]
    
    # ดึงค่า userId มาใช้เป็น student_id
    student_id = line_event.get('source', {}).get('userId', 'unknown_id')
    
    # ดึง messageId ไว้ใช้ใน Task ถัดไป
    message_id = line_event.get('message', {}).get('id', 'no_message_id')

    upload_image_payload = {
        "student_id": student_id,
        "lab_id": "LAB01",  #mock
        "image_url": f"pending_upload_for_{message_id}"
    }

    print("Mapped Data to Contract:", json.dumps(upload_image_payload))

    return {
        "statusCode": 200,
        "body": json.dumps({
            "status": "success",
            "mapped_data": upload_image_payload
        })
    }
