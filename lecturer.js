// backend/lecturer.js
const { getDb } = require('./db');

const getLecturers = async () => {
    const db = getDb();
    return await db.collection('lecturers').find({}).toArray();
};

const createLecturer = async (lecturer) => {
    const db = getDb();
    await db.collection('lecturers').insertOne(lecturer);
};

const updateLecturer = async (id, updates) => {
    const db = getDb();
    await db.collection('lecturers').updateOne({ _id: id }, { $set: updates });
};

const deleteLecturer = async (id) => {
    const db = getDb();
    await db.collection('lecturers').deleteOne({ _id: id });
};

module.exports = { getLecturers, createLecturer, updateLecturer, deleteLecturer };
