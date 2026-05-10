import json
import boto3
import urllib3
import os
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Labsarb_Users')

APPLICATION_KEY = os.environ['TU_APPLICATION_KEY']

def verify_tu_account(username, password):
    http = urllib3.PoolManager()
    url = "https://restapi.tu.ac.th/api/v1/auth/Ad/verify"
    
    headers = {
        "Content-Type": "application/json",
        "Application-Key": APPLICATION_KEY
    }
    body = json.dumps({
        "UserName": username,
        "PassWord": password
    }).encode('utf-8')
    
    response = http.request('POST', url, body=body, headers=headers)
    return json.loads(response.data.decode('utf-8'))

def check_student_exists(student_id):
    http = urllib3.PoolManager()
    url = f"https://restapi.tu.ac.th/api/v2/profile/std/info/?id={student_id}"
    
    headers = {
        "Content-Type": "application/json",
        "Application-Key": APPLICATION_KEY
    }
    
    response = http.request('GET', url, headers=headers)
    return json.loads(response.data.decode('utf-8'))

def lambda_handler(event, context):
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS"
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'verify')
        
        # --- ACTION: check_student (สำหรับหน้า TA เพิ่มนักศึกษา) ---
        if action == 'check_student':
            student_id = body.get('student_id')
            if not student_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'message': 'กรุณาระบุรหัสนักศึกษา', 'success': False})
                }
            
            result = check_student_exists(student_id)
            if result.get('status') == True:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'message': 'พบข้อมูลนักศึกษา', 'success': True, 'data': result})
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'message': 'ไม่พบข้อมูลนักศึกษาในระบบ', 'success': False})
                }

        # --- ACTION: verify (login นักศึกษา) ---
        username = body.get('username')
        password = body.get('password')

        if not username or not password:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'message': 'กรุณากรอก username และ password', 'success': False})
            }

        # เช็คว่า login แล้วหรือยัง
        existing = table.get_item(Key={'student_id': username})
        if 'Item' in existing:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Already verified', 'success': True, 'data': existing['Item']})
            }

        # เรียก TU API
        result = verify_tu_account(username, password)

        if result.get('status') == True:
            student_info = {
                'student_id': username,
                'name': result.get('displayname_th', ''),
                'name_en': result.get('displayname_en', ''),
                'email': result.get('email', ''),
                'faculty': result.get('faculty', ''),
                'last_login': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
            }
            table.put_item(Item=student_info)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Success', 'success': True, 'data': student_info})
            }
        else:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'message': 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'success': False})
            }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'message': 'Internal Error', 'error': str(e)})
        }