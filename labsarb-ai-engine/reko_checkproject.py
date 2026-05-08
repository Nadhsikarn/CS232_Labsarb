import boto3
import json
from decimal import Decimal
from datetime import datetime, timezone

dynamodb = boto3.resource('dynamodb')
results_table = dynamodb.Table('LabsarbResults')
templates_table = dynamodb.Table('LabsarbTemplates')
users_table = dynamodb.Table('Labsarb_Users')

reko = boto3.client('rekognition')
textract = boto3.client('textract')

TEXT_LABELS = {
    'text', 'document', 'paper', 'alphabet', 'word',
    'page', 'file', 'number', 'letter', 'writing',
    'handwriting', 'print', 'typescript'
}


# =============================================================
# HELPERS
# =============================================================

def parse_filename(student_path: str) -> tuple[str, str, str]:
    file_name = student_path.split('/')[-1].rsplit('.', 1)[0]
    parts = file_name.split('_')
    if len(parts) < 3:
        raise ValueError(f"ชื่อไฟล์ไม่ถูกต้อง: {file_name} (ต้องมีอย่างน้อย 3 ส่วนคั่นด้วย _)")
    return parts[0], parts[1], parts[2]


def verify_student_id(student_id: str) -> bool:
    try:
        res = users_table.get_item(Key={'student_id': student_id})
        if 'Item' not in res:
            return False
        return res['Item'].get('student_id') == student_id
    except Exception as e:
        print(f"[ERROR] verify_student_id: เชื่อมต่อ Labsarb_Users ไม่ได้ — {e}")
        raise RuntimeError(f"ไม่สามารถเชื่อมต่อฐานข้อมูล Labsarb_Users ได้: {e}")


def is_already_submitted(student_id: str, lab_id: str) -> bool:
    res = results_table.get_item(Key={'student_id': student_id, 'lab_id': lab_id})
    if 'Item' not in res:
        return False
    return res['Item'].get('status') == 'pass'


def get_template(lab_id: str) -> dict:
    res = templates_table.get_item(Key={'lab_id': lab_id})
    if 'Item' not in res:
        raise ValueError(f"ไม่พบ template สำหรับ lab: {lab_id}")
    return res['Item']


def extract_text(textract_client, bucket: str, key: str) -> tuple[set, list]:
    try:
        res = textract_client.detect_document_text(
            Document={'S3Object': {'Bucket': bucket, 'Name': key}}
        )
    except textract_client.exceptions.UnsupportedDocumentException:
        raise ValueError(f"ไฟล์ไม่รองรับโดย Textract: {key}")
    except textract_client.exceptions.InvalidS3ObjectException:
        raise ValueError(f"ไม่พบไฟล์ใน S3: {key}")

    blocks = res['Blocks']
    words = {b['Text'] for b in blocks if b['BlockType'] == 'WORD'}
    lines = [b['Text'] for b in blocks if b['BlockType'] == 'LINE']
    return words, lines


def check_name_in_lines(lines: list, student_name: str) -> bool:
    name_lower = student_name.lower()
    for line in lines:
        line_lower = line.lower()
        if '=' in line_lower and name_lower in line_lower:
            return True
    return False


def calculate_score(template_words: set, student_words: set) -> tuple[float, dict]:
    student_words_lower = {w.lower() for w in student_words}
    matches = template_words & student_words_lower
    missing = template_words - student_words_lower
    extra = student_words_lower - template_words

    score = (len(matches) / len(template_words)) * 100 if template_words else 0

    report = {
        'matches': sorted(matches),
        'missing': sorted(missing),
        'extra_count': len(extra),
        'match_count': len(matches),
        'template_count': len(template_words)
    }
    return score, report


def has_image_content(reko_client, bucket: str, key: str, min_confidence: float = 70.0) -> bool:
    try:
        res = reko_client.detect_labels(
            Image={'S3Object': {'Bucket': bucket, 'Name': key}},
            MinConfidence=min_confidence
        )
    except Exception as e:
        print(f"[WARN] Rekognition error: {e} — ถือว่าไม่มีรูปภาพ")
        return False

    for label in res['Labels']:
        label_name = label['Name'].lower()
        parent_names = {p['Name'].lower() for p in label.get('Parents', [])}
        is_text_related = (
            label_name in TEXT_LABELS
            or bool(parent_names & TEXT_LABELS)
        )
        if not is_text_related:
            print(f"[INFO] พบ non-text label: {label['Name']} ({label['Confidence']:.1f}%)")
            return True

    return False


def build_log(lines: list) -> str:
    """รวม log lines เป็น string เดียว"""
    return '\n'.join(lines)


def save_result(student_id: str, lab_id: str, status: str, score: float,
                image_url: str = "", reason: str = "", system_log: str = ""):
    """บันทึกผลลัพธ์ลง DynamoDB ทุก submission (ทั้ง pass และ fail)"""
    item = {
        'student_id': student_id,
        'lab_id': lab_id,
        'status': status,
        'score': Decimal(str(round(score, 2))),
        'submitted_at': datetime.now(timezone.utc).isoformat()
    }
    if image_url:
        item['image_url'] = image_url
    if reason:
        item['reason'] = reason
    if system_log:
        item['system_log'] = system_log  

    results_table.put_item(Item=item)


# =============================================================
# MAIN HANDLER
# =============================================================

def lambda_handler(event, context):

    try:
        record = event['Records'][0]
        bucket = record['s3']['bucket']['name']
        student_path = record['s3']['object']['key']

        # --- 1. Parse ชื่อไฟล์ ---
        try:
            s_id, student_name, l_id = parse_filename(student_path)
        except ValueError as ve:
            print(f"[ERROR] {ve}")
            return {
                'statusCode': 400,
                'body': json.dumps({'result': 'error', 'reason': str(ve)})
            }

        print(f"[INFO] student_id={s_id}, name={student_name}, lab_id={l_id}")
        image_url = f"https://{bucket}.s3.amazonaws.com/{student_path}"

        # --- 2. ตรวจสอบ student_id ใน DB ---
        if not verify_student_id(s_id):
            print(f"[REJECTED] ไม่พบ student_id '{s_id}' ใน Labsarb_Users")
            return {
                'statusCode': 403,
                'body': json.dumps({
                    'result': 'rejected',
                    'reason': f"student_id '{s_id}' not found in system"
                })
            }

        # --- 3. เช็คส่งซ้ำ (บล็อกเฉพาะ pass) ---
        if is_already_submitted(s_id, l_id):
            print(f"[INFO] {s_id} ผ่าน lab {l_id} ไปแล้ว")
            return {
                'statusCode': 200,
                'body': json.dumps({'result': 'already_submitted', 'score': 0})
            }

        # --- 4. ดึง Template ---
        try:
            template = get_template(l_id)
        except ValueError as ve:
            print(f"[ERROR] {ve}")
            return {
                'statusCode': 400,
                'body': json.dumps({'result': 'error', 'reason': str(ve)})
            }

        template_words = set(template['template_words'])
        count_image_required = int(template.get('count_image', 0))

        # --- 5. Text Detection ---
        try:
            student_words, student_lines = extract_text(textract, bucket, student_path)
        except ValueError as ve:
            print(f"[ERROR] Textract: {ve}")
            return {
                'statusCode': 400,
                'body': json.dumps({'result': 'error', 'reason': str(ve)})
            }

        # --- 6. ตรวจชื่อนักศึกษา ---
        if not check_name_in_lines(student_lines, student_name):
            print(f"[REJECTED] ไม่พบชื่อ '{student_name}' ในเอกสาร")
            log = build_log([
                f'student_id: {s_id}',
                f'lab_id: {l_id}',
                f"[REJECTED] ไม่พบชื่อ '{student_name}' ในเอกสาร",
                f"กรุณาตรวจสอบว่าเอกสารมีบรรทัด 'name = {student_name}' หรือ 'ชื่อ = {student_name}'"
            ])
            save_result(s_id, l_id, 'rejected', 0.0, image_url, 'Identity mismatch', system_log=log)
            return {
                'statusCode': 200,
                'body': json.dumps({'result': 'rejected', 'reason': 'Identity mismatch'})
            }

        # --- 7. คำนวณ Score ---
        score, report = calculate_score(template_words, student_words)

        print(f"[SCORE] student={s_id} | score={score:.2f}%")
        print(f"  matches ({report['match_count']}): {report['matches']}")
        print(f"  missing ({len(report['missing'])}): {report['missing']}")
        print(f"  extra words: {report['extra_count']}")

        # --- 8. ตรวจรูปภาพ (ถ้าจำเป็น) ---
        if count_image_required == 1:
            found_image = has_image_content(reko, bucket, student_path)
            if not found_image:
                print(f"[FAIL] ไม่พบรูปภาพ ทั้งที่ template ต้องการ")
                log = build_log([
                    f'student_id: {s_id}',
                    f'lab_id: {l_id}',
                    f'score: {round(score, 2)}%',
                    f"matched: {report['match_count']}/{report['template_count']} คำ",
                    f"missing: {', '.join(report['missing']) if report['missing'] else 'ไม่มี'}",
                    '[FAIL] ไม่พบรูปภาพในเอกสาร ทั้งที่ lab นี้ต้องการ'
                ])
                save_result(s_id, l_id, 'fail', score, image_url,
                            'image requirement not satisfied', system_log=log)
                return {
                    'statusCode': 200,
                    'body': json.dumps({
                        'result': 'fail',
                        'score': round(score, 2),
                        'reason': 'image requirement not satisfied'
                    })
                }

        # --- 9. ตัดสินผล ---
        status = "pass" if score >= 85 else "fail"

        log = build_log([
            f'student_id: {s_id}',
            f'lab_id: {l_id}',
            f'score: {round(score, 2)}%',
            f"matched: {report['match_count']}/{report['template_count']} คำ",
            f"matched words: {', '.join(report['matches']) if report['matches'] else 'ไม่มี'}",
            f"missing words: {', '.join(report['missing']) if report['missing'] else 'ไม่มี'}",
            f"extra words count: {report['extra_count']}",
            f'[RESULT] status = {status}'
        ])

        save_result(s_id, l_id, status, score, system_log=log)

        print(f"[RESULT] student={s_id} | score={score:.2f}% | status={status}")

        return {
            'statusCode': 200,
            'body': json.dumps({'result': status, 'score': round(score, 2)})
        }

    except Exception as e:
        print(f"[ERROR] Unexpected: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'result': 'error', 'reason': str(e)})
        }