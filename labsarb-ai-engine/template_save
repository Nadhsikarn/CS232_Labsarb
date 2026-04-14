import boto3
import json

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('LabsarbTemplates')

def lambda_handler(event, context):
    reko = boto3.client('rekognition')

    try:
        bucket = event['Records'][0]['s3']['bucket']['name']
        key = event['Records'][0]['s3']['object']['key']

       
        parts = key.split('/')
        l_id = parts[1]

        res = reko.detect_text(Image={'S3Object': {'Bucket': bucket, 'Name': key}})
        words = list(set([
            item['DetectedText'].lower()
            for item in res['TextDetections']
            if item['Type'] == 'WORD'
        ]))

        image_url = f"https://{bucket}.s3.amazonaws.com/{key}"

        table.put_item(
            Item={
                'lab_id': l_id,
                'template_words': words,
                'image_url': image_url
                }
)

        print(f"Saved template for lab {l_id}")

        return {'statusCode': 200}

    except Exception as e:
        print(str(e))
        return {'statusCode': 500}
