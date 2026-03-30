import boto3
import json
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('LabsarbResults')

def lambda_handler(event, context):
    reko = boto3.client('rekognition')
    
    try:
        bucket = event['Records'][0]['s3']['bucket']['name']
        student_path = event['Records'][0]['s3']['object']['key']
        
        file_name = student_path.split('/')[-1].rsplit('.', 1)[0]
        parts = file_name.split('_')
        
        if len(parts) < 3:
            print(f">>> ERROR: Invalid filename format: {file_name}")
            return {'statusCode': 400, 'body': 'Invalid File Name Format'}
            
        s_id = parts[0]
        student_name = parts[1]
        l_id = parts[2] 
        
        master_path = f"teacher-samples/{l_id}/answer.png"
        image_url = f"https://{bucket}.s3.amazonaws.com/{student_path}"

        check_db = table.get_item(Key={'student_id': s_id, 'lab_id': l_id})
        if 'Item' in check_db:
            print(f">>> ALREADY EXISTS: Student {s_id} already submitted {l_id}.")
            return {'statusCode': 200, 'body': 'Already submitted'}

        template_res = reko.detect_text(Image={'S3Object': {'Bucket': bucket, 'Name': master_path}})
        template_words = set([item['DetectedText'].lower() for item in template_res['TextDetections'] if item['Type'] == 'WORD'])

        student_res = reko.detect_text(Image={'S3Object': {'Bucket': bucket, 'Name': student_path}})
        student_words = set([item['DetectedText'] for item in student_res['TextDetections'] if item['Type'] == 'WORD'])
        #ยังต้องแก้ตรงที่ชื่อ ไม่ครบก็ผ่าน เช่น Nantapop แต่ Nantap ก็ถือว่าถูกต้อง
        found_name = any(student_name in word for word in student_words)

        if not found_name:
            print(f">>> REJECTED: Case/Name mismatch. StudentName '{student_name}' not found.")
            return {
                'statusCode': 200, 
                'body': json.dumps({'result': 'rejected', 'reason': 'Identity mismatch'})
            }

        student_words_lower = set([w.lower() for w in student_words])
        matches = template_words.intersection(student_words_lower)
        score = (len(matches) / len(template_words)) * 100 if template_words else 0
        
        
        missing_words = list(template_words - student_words_lower)
        missing_point = ", ".join(missing_words[:5]) if missing_words else "-"

        status = "pass" if score >= 85 else "fail"
        
        table.put_item(
            Item={
                'student_id': s_id,
                'lab_id': l_id,
                'status': status,
                'score': Decimal(str(round(score, 2)))
            }
        )

        print(f"--- SUCCESS: ID {s_id} | Score: {score:.2f}% | Status: {status} ---")
        
        return {
            'statusCode': 200,
            'body': json.dumps({'result': status, 'score': float(score)})
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {'statusCode': 500, 'body': str(e)}
        
