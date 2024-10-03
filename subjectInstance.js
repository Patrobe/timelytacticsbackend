require('dotenv').config();
const { parse } = require('url');
const querystring = require('querystring');
const { ObjectId } = require('mongodb');

module.exports = async (req, res, db) => {
    const { method, url } = req;
    const allowedOrigin = process.env.ALLOWED_ORIGIN;
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Origin, X-Requested-With, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (url.startsWith('/subjectinstances') && method === 'GET') {
        const parsedUrl = parse(url);
        const queryParams = querystring.parse(parsedUrl.query);

        const { subjectId, year, month, lecturerId, supportUserId } = queryParams;

        const query = {};
        if (subjectId) {
            query.subjectID = parseInt(subjectId, 10);
        }
        if (year) {
            query.year = parseInt(year, 10);
        }
        if (month) {
            query.month = parseInt(month, 10);
        }
        if (lecturerId) {
            query.lecturersID = parseInt(lecturerId, 10);
        }
        if (supportUserId) {
            query.supportLecturers = { $elemMatch: { userID: parseInt(supportUserId, 10) } };
        }

        try {
            const schedule = await db.collection('subjectInstances').find(query).toArray();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(schedule));
            console.log('GET /subjectinstances - Retrieved subject instances with filters');
        } catch (error) {
            console.error('Error fetching subject instances:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    }
    else if (url === '/subjectinstance' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', async () => {
            try {
                const scheduleItem = JSON.parse(body);

                // Validate required fields
                const requiredFields = ['subjectID', 'month', 'year', 'studentEnrollment', 'lecturersID'];
                for (const field of requiredFields) {
                    if (!(field in scheduleItem)) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ message: `Missing required field: ${field}` }));
                        return;
                    }
                }

                // Assign a unique InstanceID
                const highestInstance = await db.collection('subjectInstances')
                    .find()
                    .sort({ instanceID: -1 })
                    .limit(1)
                    .toArray();

                const nextInstanceID = highestInstance.length > 0 ? highestInstance[0].instanceID + 1 : 1;
                scheduleItem.instanceID = nextInstanceID;

                // Optional: Set default fields if necessary
                // scheduleItem.active = scheduleItem.active !== undefined ? scheduleItem.active : true;

                await db.collection('subjectInstances').insertOne(scheduleItem);

                // Fetch the created subject instance to return
                const createdInstance = await db.collection('subjectInstances').findOne(
                    { instanceID: nextInstanceID },
                    { projection: { /* Exclude sensitive fields if any */ } }
                );

                console.log(`POST /subjectinstance - Created subject instance with InstanceID: ${nextInstanceID}`);
                console.log('Created Instance:', createdInstance); // Debugging

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(createdInstance));
            } catch (error) {
                console.error('Error creating subject instance:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        });
    }
    else if (url.startsWith('/subjectinstance/') && method === 'PUT') {
        const id = url.split('/')[2];
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const updatedScheduleItem = JSON.parse(body);
                // Prevent changing the InstanceID
                delete updatedScheduleItem.instanceID;

                await db.collection('subjectInstances').updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedScheduleItem }
                );

                // Fetch the updated subject instance
                const userAfterUpdate = await db.collection('subjectInstances').findOne(
                    { _id: new ObjectId(id) },
                    { projection: { /* Exclude sensitive fields if any */ } }
                );

                console.log(`PUT /subjectinstance/${id} - Updated subject instance`, userAfterUpdate);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(userAfterUpdate));
            } catch (error) {
                console.error('Error updating subject instance:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Internal Server Error' }));
            }
        });
    }
    else if (url.startsWith('/subjectinstance/') && method === 'DELETE') {
        const id = url.split('/')[2];
        try {
            await db.collection('subjectInstances').deleteOne({ _id: new ObjectId(id) });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Schedule item deleted' }));
            console.log(`DELETE /subjectinstance/${id} - Deleted subject instance`);
        } catch (error) {
            console.error('Error deleting subject instance:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
    }
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
