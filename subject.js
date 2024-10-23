// .-----------------------------------------------------------------------------------------------------------------------------------------------------------------.
// | _________   ___   _____ ______    _______    ___            ___    ___              _________   ________   ________  _________   ___   ________   ________      |
// ||\___   ___\|\  \ |\   _ \  _   \ |\  ___ \  |\  \          |\  \  /  /|            |\___   ___\|\   __  \ |\   ____\|\___   ___\|\  \ |\   ____\ |\   ____\     |
// |\|___ \  \_|\ \  \\ \  \\\__\ \  \\ \   __/| \ \  \         \ \  \/  / /            \|___ \  \_|\ \  \|\  \\ \  \___|\|___ \  \_|\ \  \\ \  \___| \ \  \___|_    |
// |     \ \  \  \ \  \\ \  \\|__| \  \\ \  \_|/__\ \  \         \ \    / /                  \ \  \  \ \   __  \\ \  \        \ \  \  \ \  \\ \  \     \ \_____  \   |
// |      \ \  \  \ \  \\ \  \    \ \  \\ \  \_|\ \\ \  \____     \/  /  /                    \ \  \  \ \  \ \  \\ \  \____    \ \  \  \ \  \\ \  \____ \|____|\  \  |
// |       \ \__\  \ \__\\ \__\    \ \__\\ \_______\\ \_______\ __/  / /                       \ \__\  \ \__\ \__\\ \_______\   \ \__\  \ \__\\ \_______\ ____\_\  \ |
// |        \|__|   \|__| \|__|     \|__| \|_______| \|_______||\___/ /                         \|__|   \|__|\|__| \|_______|    \|__|   \|__| \|_______||\_________\|
// |                                                           \|___|/                                                                                   \|_________||
// |                                                                                                                                                                 |
// |  A student project web app by Cameron Egglestone, Jason Walstab, Patrick Hickey and Shane Larsen for Latrobe University                                         |
// '-----------------------------------------------------------------------------------------------------------------------------------------------------------------'
//  28/08/2024 created subjects.js endpoint - Pat
require('dotenv').config();
const { ObjectId } = require('mongodb');

module.exports = async (req, res, db) => {
    const { method, url } = req;
    const allowedOrigin = process.env.ALLOWED_ORIGIN;
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (url === '/subjects' && method === 'GET') {
        try {
            const subjects = await db.collection('subjects').find().toArray();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(subjects));
        } catch (error) {
            console.error('Error fetching subjects:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Failed to fetch subjects' }));
        }
    } else if (url === '/subjects' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const subject = JSON.parse(body);
                subject.active = true; // Set active to true on creation

                // Validate required fields
                if (!subject.subjectName || !subject.subjectCode || !subject.departmentID) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'subjectName, subjectCode, and departmentID are required' }));
                    return;
                }

                // Assign subjectID
                const highestSubject = await db.collection('subjects')
                    .find()
                    .sort({ subjectID: -1 })
                    .limit(1)
                    .toArray();

                const nextSubjectId = highestSubject.length > 0 ? highestSubject[0].subjectID + 1 : 1;
                subject.subjectID = nextSubjectId;

                await db.collection('subjects').insertOne(subject);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Subject created' }));
            } catch (error) {
                console.error('Error creating subject:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid subject data' }));
            }
        });
    } else if (url.startsWith('/subjects/') && method === 'PUT') {
        const id = url.split('/')[2];
        if (!ObjectId.isValid(id)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Invalid subject ID' }));
            return;
        }

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const updatedSubject = JSON.parse(body);

                // Prevent _id from being updated
                delete updatedSubject._id;

                // Validate required fields
                if (!updatedSubject.subjectName || !updatedSubject.subjectCode || !updatedSubject.departmentID) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'subjectName, subjectCode, and departmentID are required' }));
                    return;
                }

                const result = await db.collection('subjects').updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedSubject }
                );

                if (result.matchedCount === 0) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Subject not found' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Subject updated' }));
            } catch (error) {
                console.error('Error updating subject:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid subject data' }));
            }
        });
    } else if (url.startsWith('/subjects/') && method === 'DELETE') {
        const id = url.split('/')[2];
        if (!ObjectId.isValid(id)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Invalid subject ID' }));
            return;
        }

        try {
            const result = await db.collection('subjects').deleteOne({ _id: new ObjectId(id) });

            if (result.deletedCount === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Subject not found' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Subject deleted' }));
        } catch (error) {
            console.error('Error deleting subject:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Failed to delete subject' }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
