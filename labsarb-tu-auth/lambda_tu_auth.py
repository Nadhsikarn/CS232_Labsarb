import json
import boto3
import urllib3
import os
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('TU_User_Mapping')

APPLICATION_KEY = os.environ['TU_APPLICATION_KEY']

def verify_tu_account(username, password):
    http = urllib3.PoolManager()
    url = "https://restapi.tu.ac.th/api/v1/auth/Ad/verify"
    
    headers = {
        "Content-Type": "application/json",
        "Application-Key": APPLICATION_KEY #ต้องเอาค่า application-key ที่ได้ตอนสร้าง project tu api มาใส่ใน env จ่ะ
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
        username = body.get('username')
        password = body.get('password')
        line_user_id = body.get('lineUserId')

        # เช็คว่า login แล้วหรือยัง
        existing = table.get_item(Key={'lineUserId': line_user_id}) #ค่อยแก้เปน line_user_id ตอนรวม
        if 'Item' in existing:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Already verified', 'success': True})
            }

        # เรียก TU API จริง
        result = verify_tu_account(username, password)

        if result.get('status') == True:
            table.put_item(Item={
                'lineUserId': line_user_id, #พอรวมโค้ดค่อยแก้เป็น line_user_id
                'student_id': username,
                'name': result.get('displayname_th', ''),
                'created_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
            })
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'message': 'Success', 'success': True})
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
            'body': json.dumps({'message': 'Internal Error'})
        }