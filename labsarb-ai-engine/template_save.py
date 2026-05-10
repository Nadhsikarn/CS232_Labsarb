import json
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('LabsarbTemplates')

# Label ที่ถือว่าเป็น "ข้อความ/เอกสาร" ไม่นับเป็นรูปภาพ
TEXT_LABELS = {
    'text', 'document', 'paper', 'alphabet', 'word',
    'page', 'file', 'number', 'letter', 'writing',
    'handwriting', 'print', 'typescript'
}


def extract_words(textract_client, bucket: str, key: str) -> list[str]:
    try:
        res = textract_client.detect_document_text(
            Document={'S3Object': {'Bucket': bucket, 'Name': key}}
        )
    except textract_client.exceptions.UnsupportedDocumentException:
        raise ValueError(f"ไฟล์ไม่รองรับ: {key}")
    except textract_client.exceptions.InvalidS3ObjectException:
        raise ValueError(f"ไม่พบไฟล์ใน S3: {key}")

    words = list(set([
        b['Text'].lower()
        for b in res['Blocks']
        if b['BlockType'] == 'WORD'
    ]))

    return words


def has_image_content(reko_client, bucket: str, key: str, min_confidence: float = 75.0) -> int:
    """
    ตรวจสอบว่าเอกสารมีรูปภาพ (ที่ไม่ใช่ข้อความ) หรือไม่
    คืน 1 ถ้ามี, 0 ถ้าไม่มี
    """
    try:
        res = reko_client.detect_labels(
            Image={'S3Object': {'Bucket': bucket, 'Name': key}},
            MinConfidence=min_confidence
        )
    except Exception as e:
        print(f"[WARN] Rekognition error: {e} — ถือว่าไม่มีรูปภาพ")
        return 0

    for label in res['Labels']:
        label_name = label['Name'].lower()
        parent_names = {p['Name'].lower() for p in label.get('Parents', [])}

        # ข้ามถ้า label หรือ parent ใดๆ เป็นประเภทข้อความ
        is_text_related = (
            label_name in TEXT_LABELS
            or bool(parent_names & TEXT_LABELS)
        )

        if not is_text_related:
            print(f"[INFO] พบ non-text label: {label['Name']} ({label['Confidence']:.1f}%)")
            return 1

    return 0


def lambda_handler(event, context):
    reko = boto3.client('rekognition')
    textract = boto3.client('textract')

    try:
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']

        # ดึง lab_id จาก path เช่น templates/LAB001/file.pdf
        parts = key.split('/')
        if len(parts) < 2:
            print(f"[ERROR] Key format ไม่ถูกต้อง: {key}")
            return {'statusCode': 400, 'body': json.dumps({'reason': 'Invalid S3 key format'})}

        l_id = parts[1]
        image_url = f"https://{bucket}.s3.amazonaws.com/{key}"

        print(f"[INFO] กำลังประมวลผล template สำหรับ lab: {l_id}")

        # --- 1. Text Detection ---
        words = extract_words(textract, bucket, key)
        print(f"[INFO] พบคำทั้งหมด {len(words)} คำ")

        # --- 2. Image Check ---
        count_image = has_image_content(reko, bucket, key)
        print(f"[INFO] count_image = {count_image}")

        # --- 3. บันทึกลง DynamoDB ---
        table.update_item(
            Key={'lab_id': l_id},
            UpdateExpression="set template_words = :tw, image_url = :img, count_image = :ci",
            ExpressionAttributeValues={
                ':tw': words,
                ':img': image_url,
                ':ci': count_image
            }
        )

        print(f"[SUCCESS] บันทึก template lab={l_id}, words={len(words)}, count_image={count_image}")
        return {'statusCode': 200, 'body': json.dumps({'lab_id': l_id, 'word_count': len(words)})}

    except ValueError as ve:
        print(f"[ERROR] {ve}")
        return {'statusCode': 400, 'body': json.dumps({'reason': str(ve)})}

    except Exception as e:
        print(f"[ERROR] Unexpected: {e}")
        return {'statusCode': 500, 'body': json.dumps({'reason': str(e)})}