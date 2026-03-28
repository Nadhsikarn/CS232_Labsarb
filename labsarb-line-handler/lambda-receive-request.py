#แยกไฟล์ไว้ก่อนเฉย ๆ พอเสร็จแล้วเดี๋ยวยุบรวมให้นะจ๊ะ
import json

def lambda_handler(event, context):

    print("EVENT =", event)
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "ok"})
    }
