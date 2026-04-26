import json
import boto3
import urllib3
import os
from datetime import datetime, timezone

# เชื่อมต่อกับ DynamoDB
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('Labsarb_Users')

APPLICATION_KEY = os.environ['TU_APPLICATION_KEY']

def get_tu_student_info(student_id):
    """ดึงข้อมูลนักศึกษาจาก TU API โดยใช้แค่รหัส (ไม่ต้องใช้ Password)"""
    http = urllib3.PoolManager()
    # ใช้ endpoint profile/std/info ตามมาตรฐาน TU API v2
    url = f"https://restapi.tu.ac.th/api/v2/profile/std/info/?id={student_id}"
    
    headers = {
        "Content-Type": "application/json",
        "Application-Key": APPLICATION_KEY
    }
    
    response = http.request('GET', url, headers=headers)
    return json.loads(response.data.decode('utf-8'))

def verify_tu_account(username, password):
    """ตรวจสอบการ Login ของนักศึกษา"""
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
        action = body.get('action', 'verify') # default เป็น verify เพื่อรองรับโค้ดเก่า

        # --- ACTION: ตรวจสอบข้อมูลนักศึกษา (สำหรับหน้าอาจารย์) ---
        if action == 'check_student':
            student_id = body.get('student_id')
            if not student_id:
                return {
                    'statusCode': 400, 'headers': headers,
                    'body': json.dumps({'message': 'กรุณาระบุรหัสนักศึกษา', 'success': False})
                }
            
            # 1. ลองดูใน Cache (DynamoDB) ก่อน
            cache_res = table.get_item(Key={'student_id': student_id})
            if 'Item' in cache_res:
                return {
                    'statusCode': 200, 'headers': headers,
                    'body': json.dumps({'message': 'Success', 'success': True, 'data': cache_res['Item'], 'source': 'cache'})
                }
            
            # 2. ถ้าไม่มีใน Cache ให้ดึงจาก TU API จริง
            result = get_tu_student_info(student_id)
            if result.get('status') == True and result.get('data') and len(result.get('data')) > 0:
                std_data = result['data'][0]
                student_info = {
                    'student_id': student_id,
                    'name': std_data.get('displayname_th'),
                    'email': std_data.get('email') or f"{student_id}@dome.tu.ac.th",
                    'faculty': std_data.get('faculty'),
                    'last_updated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
                }
                # บันทึกลง Cache
                table.put_item(Item=student_info)
                
                return {
                    'statusCode': 200, 'headers': headers,
                    'body': json.dumps({'message': 'Success', 'success': True, 'data': student_info, 'source': 'api'})
                }
            else:
                return {
                    'statusCode': 404, 'headers': headers,
                    'body': json.dumps({'message': 'ไม่พบข้อมูลนักศึกษา', 'success': False})
                }

        # --- ACTION: LOGIN (สำหรับหน้าเว็บนักศึกษา) ---
        username = body.get('username')
        password = body.get('password')
        result = verify_tu_account(username, password)

        if result.get('status') == True:
            # อัปเดตข้อมูลลง DynamoDB
            student_info = {
                'student_id': username,
                'name': result.get('displayname_th'),
                'email': result.get('email'),
                'faculty': result.get('faculty'),
                'last_login': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
            }
            table.put_item(Item=student_info)

            return {
                'statusCode': 200, 'headers': headers,
                'body': json.dumps({'message': 'Success', 'success': True, 'data': result})
            }
        else:
            return {
                'statusCode': 401, 'headers': headers,
                'body': json.dumps({'message': 'รหัสผ่านไม่ถูกต้อง', 'success': False})
            }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500, 'headers': headers,
            'body': json.dumps({'message': 'Internal Error'})
        }