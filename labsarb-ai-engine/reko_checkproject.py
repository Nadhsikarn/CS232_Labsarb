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
            print("Filename Format Incorrect")
            return {
                'statusCode': 400,
                'body': json.dumps({'result': 'error', 'score': 0, 'reason': 'Invalid Filename Format'})
            }
            
        s_id = parts[0]
        student_name = parts[1]
        l_id = parts[2] 
        
        image_url = f"https://{bucket}.s3.amazonaws.com/{student_path}"

        check_db = table.get_item(Key={'student_id': s_id, 'lab_id': l_id})
        if 'Item' in check_db:
            print(f"StudentId:{s_id} Had already submitted Assignment:{l_id}.")
            return {
                'statusCode': 200,
                'body': json.dumps({'result': 'already_submitted', 'score': 0})
            }

        template_table = dynamodb.Table('LabsarbTemplates')
        template_item = template_table.get_item(Key={'lab_id': l_id})

        if 'Item' not in template_item:
            print("No template found in DB")
            return {
                'statusCode': 400,
                'body': json.dumps({'result': 'error', 'reason': 'Template not found'})
            }

        template_words = set(template_item['Item']['template_words'])

        student_res = reko.detect_text(
            Image={'S3Object': {'Bucket': bucket, 'Name': student_path}}
        )

    
        student_words = set([
            item['DetectedText']
            for item in student_res['TextDetections']
            if item['Type'] == 'WORD'
        ])


        student_lines = [
            item['DetectedText']
            for item in student_res['TextDetections']
            if item['Type'] == 'LINE'
        ]


        found_name = False
        for line in student_lines:
            if '=' in line and student_name.lower() in line.lower():
                found_name = True
                break

        if not found_name:
            print(f">>> REJECTED: Name mismatch '{student_name}'")
            return {
                'statusCode': 200, 
                'body': json.dumps({'result': 'rejected', 'reason': 'Identity mismatch'})
            }

        student_words_lower = set([w.lower() for w in student_words])
        
        matches = template_words.intersection(student_words_lower)
        missing = template_words.difference(student_words_lower)
        extra = student_words_lower.difference(template_words)

        print(f"--- Comparison Report for Student: {s_id} ---")
        print(f" Matches ({len(matches)} words): {sorted(list(matches))}")
        print(f" Missing from Student ({len(missing)} words): {sorted(list(missing))}")
        print(f" Extra in Student ({len(extra)} words): {sorted(list(extra))}")
        print(f"-------------------------------------------")

        score = (len(matches) / len(template_words)) * 100 if template_words else 0
        
        status = "pass" if score >= 85 else "fail"
        if status == "pass":
            table.put_item(
                Item={
                    'student_id': s_id,
                    'lab_id': l_id,
                    'status': status,
                    'score': Decimal(str(round(score, 2)))
                }
            )

        print(f"ID:{s_id} | Score:{score:.2f}% | Status:{status}")
        
        return {
            'statusCode': 200,
            'body': json.dumps({'result': status, 'score': float(score)})
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500, 
            'body': json.dumps({'result': 'error', 'reason': str(e)})
        }
