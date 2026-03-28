import os
import json
import boto3
import re
from urllib.parse import unquote_plus
from decimal import Decimal

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
TABLE_NAME = os.environ.get("TABLE_NAME", "LabsarbResults")

dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table(TABLE_NAME)

rekognition = boto3.client("rekognition", region_name=AWS_REGION)
s3 = boto3.client("s3", region_name=AWS_REGION)

def normalize_text(text):
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.strip().lower())


def normalize_compact(text):
    if not text:
        return ""
    return re.sub(r"[^a-zA-Z0-9]", "", text).lower()


def parse_filename(student_path):
    # ตัวอย่าง submissions/66000001_Nantapop_LAB_01.png
    file_name = student_path.split("/")[-1].rsplit(".", 1)[0]
    parts = file_name.split("_")

    if len(parts) < 3:
        raise ValueError(f"Invalid filename format: {file_name}")

    student_id = parts[0]
    student_name = parts[1]
    lab_id = "_".join(parts[2:])

    return student_id, student_name, lab_id


def get_existing_result(student_id, lab_id):
    res = table.get_item(
        Key={
            "student_id": student_id,
            "lab_id": lab_id
        }
    )
    return res.get("Item")


def extract_words(bucket, key):
    response = rekognition.detect_text(
        Image={"S3Object": {"Bucket": bucket, "Name": key}}
    )

    words = []
    lines = []

    for item in response.get("TextDetections", []):
        if item.get("Type") == "WORD":
            words.append(item.get("DetectedText", ""))
        elif item.get("Type") == "LINE":
            lines.append(item.get("DetectedText", ""))

    return words, lines


def check_student_name(student_name, student_words, student_lines):
    expected = normalize_compact(student_name)
    all_text = " ".join(student_words + student_lines)
    actual = normalize_compact(all_text)
    return expected in actual


def calculate_score(template_words, student_words):
    template_set = set(normalize_text(w) for w in template_words if w.strip())
    student_set = set(normalize_text(w) for w in student_words if w.strip())

    if not template_set:
        return 0.0, []

    matches = template_set.intersection(student_set)
    missing = list(template_set - student_set)
    score = (len(matches) / len(template_set)) * 100

    return round(score, 2), missing


def save_result(student_id, lab_id, student_name, status, score, missing_point, image_path, image_url):
    table.put_item(
        Item={
            "student_id": student_id,
            "lab_id": lab_id,
            "student_name": student_name,
            "status": status,
            "score": Decimal(str(score)),
            "missing_point": missing_point,
            "image_path": image_path,
            "image_url": image_url
        }
    )


def process_submission(bucket, student_path):
    student_id, student_name, lab_id = parse_filename(student_path)

    existing = get_existing_result(student_id, lab_id)
    if existing:
        return {
            "result": "already_submitted",
            "student_id": student_id,
            "lab_id": lab_id
        }

    master_path = f"teacher-samples/{lab_id}/answer.png"
    image_url = f"https://{bucket}.s3.amazonaws.com/{student_path}"

    template_words, _ = extract_words(bucket, master_path)
    student_words, student_lines = extract_words(bucket, student_path)

    found_name = check_student_name(student_name, student_words, student_lines)

    if not found_name:
        save_result(
            student_id=student_id,
            lab_id=lab_id,
            student_name=student_name,
            status="rejected",
            score=0.0,
            missing_point="Identity mismatch",
            image_path=student_path,
            image_url=image_url
        )
        return {
            "result": "rejected",
            "student_id": student_id,
            "lab_id": lab_id,
            "reason": "Identity mismatch"
        }

    score, missing_words = calculate_score(template_words, student_words)
    missing_point = ", ".join(missing_words[:5]) if missing_words else "-"
    status = "pass" if score >= 85 else "fail"

    save_result(
        student_id=student_id,
        lab_id=lab_id,
        student_name=student_name,
        status=status,
        score=score,
        missing_point=missing_point,
        image_path=student_path,
        image_url=image_url
    )

    return {
        "result": status,
        "student_id": student_id,
        "lab_id": lab_id,
        "score": score,
        "missing_point": missing_point
    }


def lambda_handler(event, context):
    try:
        results = []

        for record in event.get("Records", []):
            bucket = record["s3"]["bucket"]["name"]
            student_path = unquote_plus(record["s3"]["object"]["key"])

            result = process_submission(bucket, student_path)
            results.append(result)

        return {
            "statusCode": 200,
            "body": json.dumps(results, default=str)
        }

    except Exception as e:
        print("Error:", str(e))
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }