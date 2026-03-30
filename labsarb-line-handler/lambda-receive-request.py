#แยกไฟล์ไว้ก่อนเฉย ๆ พอเสร็จแล้วเดี๋ยวยุบรวมให้นะจ๊ะ
import json
import boto3
import requests  # ต้องแอด Layer เพิ่มนะจ๊ะ
import os

# ตั้งค่า AWS S3
s3 = boto3.client('s3')
# ดึงค่าจาก Env ที่ตั้งไว้ใน Configuration
BUCKET_NAME = os.environ.get('BUCKET_NAME')
LINE_ACCESS_TOKEN = os.environ.get('LINE_ACCESS_TOKEN')

def lambda_handler(event, context):
    body = json.loads(event.get('body', '{}'))
    line_event = body.get('events', [{}])[0]
    
    student_id = line_event.get('source', {}).get('userId', 'unknown_id')
    message_id = line_event.get('message', {}).get('id')
    message_type = line_event.get('message', {}).get('type')

    # เช็คก่อนว่าเป็นรูปภาพไหม
    if message_type != 'image':
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Not an image, skipped."})
        }

    # ดึงไฟล์รูปจริงจาก LINE Content API
    line_url = f"https://api-data.line.me/v2/bot/message/{message_id}/content"
    headers = {'Authorization': f'Bearer {LINE_ACCESS_TOKEN}'}
    
    img_response = requests.get(line_url, headers=headers)
    
    if img_response.status_code == 200:
        image_data = img_response.content
        # จัดโครงสร้างชื่อไฟล์: userId/messageId.jpg
        file_name = f"{student_id}/{message_id}.jpg" 

        # อัปโหลดขึ้น S3 Bucket
        s3.put_object(
            Bucket=BUCKET_NAME, # ใช้ตัวแปรจาก Env
            Key=file_name,
            Body=image_data,
            ContentType='image/jpeg'
        )

        # สร้าง URL ของรูป 
        image_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_name}"

        upload_image_payload = {
            "student_id": student_id,
            "lab_id": "LAB01",
            "image_url": image_url
        }

        print("Final Mapping with S3 URL:", json.dumps(upload_image_payload))

        return {
            "statusCode": 200,
            "body": json.dumps({
                "status": "success",
                "mapped_data": upload_image_payload
            })
        }
    else:
        print(f"Failed to download image from LINE: {img_response.status_code}")
        return {"statusCode": 500, "body": "Failed to fetch image"}