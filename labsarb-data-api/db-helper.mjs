// db-helper.mjs

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, ScanCommand, DeleteCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const docClient = DynamoDBDocumentClient.from(client);

const RESULTS_TABLE = "LabsarbResults";
const TEMPLATES_TABLE = "LabsarbTemplates";
const USERS_TABLE = "Labsarb_Users";

// ============================================================
// USERS TABLE (Labsarb_Users) — ข้อมูลนักศึกษา
// ============================================================

export const getAllUsers = async () => {
    const command = new ScanCommand({ TableName: USERS_TABLE });
    const response = await docClient.send(command);
    return response.Items;
};

export const saveUser = async (data) => {
    const expressionParts = [];
    const expressionValues = {};
    const expressionNames = {};

    if (data.name) {
        expressionParts.push("#nm = :nm");
        expressionValues[":nm"] = data.name;
        expressionNames["#nm"] = "name";
    }
    if (data.name_en) {
        expressionParts.push("name_en = :ne");
        expressionValues[":ne"] = data.name_en;
    }
    if (data.faculty) {
        expressionParts.push("faculty = :fc");
        expressionValues[":fc"] = data.faculty;
    }
    if (data.email) {
        expressionParts.push("email = :em");
        expressionValues[":em"] = data.email;
    }
    if (data.updated_at) {
        expressionParts.push("#ua = :ua");
        expressionValues[":ua"] = data.updated_at;
        expressionNames["#ua"] = "updated_at";
    }

    if (expressionParts.length === 0) {
        return { status: "error", message: "ไม่มีฟิลด์ที่ต้องอัปเดต" };
    }

    const command = new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { student_id: data.student_id },
        UpdateExpression: "set " + expressionParts.join(", "),
        ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: "UPDATED_NEW"
    });

    await docClient.send(command);
    return { status: "success" };
};

export const deleteUser = async (studentId) => {
    const command = new DeleteCommand({
        TableName: USERS_TABLE,
        Key: { student_id: studentId }
    });
    await docClient.send(command);
    return { status: "success" };
};

// ============================================================
// RESULTS TABLE (LabsarbResults) — ผลการส่งงานนักศึกษา
// ============================================================

export const getAllLabResults = async () => {
    const command = new ScanCommand({ TableName: RESULTS_TABLE });
    const response = await docClient.send(command);
    return response.Items;
};

export const getLabResultsByStudent = async (studentId) => {
    const command = new QueryCommand({
        TableName: RESULTS_TABLE,
        KeyConditionExpression: "student_id = :sid",
        ExpressionAttributeValues: { ":sid": studentId }
    });
    const response = await docClient.send(command);
    return response.Items;
};

export const saveOrUpdateLab = async (data, customTableName = null) => {
    const tableName = customTableName || RESULTS_TABLE;

    console.log(`กำลังบันทึกข้อมูลลงตาราง: ${tableName}`);

    const expressionParts = [];
    const expressionValues = {};
    const expressionNames = {};

    if (data.updated_at) {
        expressionParts.push("#ua = :ua");
        expressionValues[":ua"] = data.updated_at;
        expressionNames["#ua"] = "updated_at";
    }

    if (tableName === TEMPLATES_TABLE) {
        // LabsarbTemplates — เฉลยอาจารย์
        if (data.image_url) {
            expressionParts.push("image_url = :img");
            expressionValues[":img"] = data.image_url;
        }
        if (data.lab_data) {
            expressionParts.push("lab_description = :desc");
            expressionValues[":desc"] = data.lab_data;
        }
        if (data.deadline) {
            expressionParts.push("deadline = :dl");
            expressionValues[":dl"] = data.deadline;
        }
        if (data.template_words) {
            expressionParts.push("template_words = :tw");
            expressionValues[":tw"] = data.template_words;
        }
    } else {
        // LabsarbResults — ผลการส่งงานนักศึกษา
        if (data.status) {
            expressionParts.push("#st = :st");
            expressionValues[":st"] = data.status;
            expressionNames["#st"] = "status";
        }
        if (data.score !== undefined) {
            expressionParts.push("score = :sc");
            expressionValues[":sc"] = data.score;
        }
        if (data.image_url) {
            expressionParts.push("image_url = :img");
            expressionValues[":img"] = data.image_url;
        }
        if (data.rekognition_result !== undefined) {
            expressionParts.push("rekognition_result = :rk");
            expressionValues[":rk"] = data.rekognition_result;
        }
        if (data.feedback) {
            expressionParts.push("feedback = :fb");
            expressionValues[":fb"] = data.feedback;
        }
    }

    if (expressionParts.length === 0) {
        return { status: "error", message: "ไม่มีฟิลด์ที่ต้องอัปเดต" };
    }

    const key = (tableName === TEMPLATES_TABLE)
        ? { lab_id: data.lab_id }
        : { student_id: data.student_id, lab_id: data.lab_id };

    const command = new UpdateCommand({
        TableName: tableName,
        Key: key,
        UpdateExpression: "set " + expressionParts.join(", "),
        ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
        ExpressionAttributeValues: expressionValues,
        ReturnValues: "UPDATED_NEW"
    });

    try {
        await docClient.send(command);
        return { status: "success", message: `บันทึกลง ${tableName} สำเร็จ` };
    } catch (err) {
        console.error("DB Error:", err);
        throw err;
    }
};

export const deleteLabResult = async (studentId, labId) => {
    const command = new DeleteCommand({
        TableName: RESULTS_TABLE,
        Key: { student_id: studentId, lab_id: labId }
    });
    await docClient.send(command);
    return { status: "success", message: "ลบข้อมูลสำเร็จ" };
};

// ============================================================
// TEMPLATES TABLE (LabsarbTemplates) — เฉลยอาจารย์
// ============================================================

export const getAllTemplates = async () => {
    const command = new ScanCommand({ TableName: TEMPLATES_TABLE });
    const response = await docClient.send(command);
    return response.Items;
};
