import json

def lambda_handler(event, context):

    print("EVENT =", event)
    return {
        "statusCode": 200,
        "body": json.dumps({"message": "ok"})
    }