import urllib.request
import json
import ssl

# Token จากโค้ด Java ที่ให้มาตอนแรก
ACCESS_TOKEN = "TU86ef004ae9c4dc077b0f5ee076f23388452133650814c706551da3b9bdbdde09a4fb72e5142d25ee2069187888c64b4d"

def check_student(student_id):
    url = f"https://restapi.tu.ac.th/api/v2/profile/std/info/?id={student_id}"
    req = urllib.request.Request(url)
    req.add_header('Content-Type', 'application/json')
    req.add_header('Application-Key', ACCESS_TOKEN)
    
    # อนุญาต SSL ที่อาจจะมีปัญหาในบางเครื่อง
    context = ssl._create_unverified_context()
    
    try:
        print(f"กำลังค้นหาข้อมูลนักศึกษา: {student_id}...")
        response = urllib.request.urlopen(req, context=context)
        data = json.loads(response.read().decode('utf-8'))
        
        print(f"\n✅ ผลลัพธ์สำหรับรหัสนักศึกษา: {student_id}")
        print("=" * 50)
        # ปริ้นท์ JSON ออกมาให้ดูแบบอ่านง่ายๆ (รองรับภาษาไทย)
        print(json.dumps(data, indent=4, ensure_ascii=False))
        print("=" * 50 + "\n")
        
    except urllib.error.HTTPError as e:
        print(f"\n❌ Error (HTTP {e.code}): ไม่พบข้อมูลนักศึกษาหรือ Token มีปัญหา\n")
    except Exception as e:
        print(f"\n❌ Error: {e}\n")

if __name__ == "__main__":
    print("\n=== โปรแกรมทดสอบเรียกดูข้อมูลนักศึกษาด้วย TU API ===")
    while True:
        std_id = input("👉 ใส่รหัสนักศึกษา 10 หลัก (หรือพิมพ์ 'q' เพื่อออก): ").strip()
        
        if std_id.lower() == 'q':
            print("จบการทำงาน")
            break
            
        if len(std_id) == 10 and std_id.isdigit():
            check_student(std_id)
        else:
            print("⚠️ กรุณาใส่ตัวเลขให้ครบ 10 หลัก\n")
