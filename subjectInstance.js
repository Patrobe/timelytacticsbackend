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

    if (url.startsWith('/subjectinstance') && method === 'GET') {
        const parsedUrl = parse(url);
        const queryParams = querystring.parse(parsedUrl.query);

        const { subjectId, year, month, lecturerId } = queryParams; 

        const query = {};
        if (subjectId) {
            query.subjectId = subjectId;
        }
        if (year) {
            query.year = year;
        }
        if (month) {
            query.month = month;
        }
        if (lecturerId) {
            query.lecturersID = lecturerId; 
        }


        const schedule = await db.collection('subjectInstances').find(query).toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(schedule));
    } else if (url === '/subjectinstance' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const scheduleItem = JSON.parse(body);
            await db.collection('subjectInstances').insertOne(scheduleItem);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Schedule item created' }));
        });
    } else if (url.startsWith('/subjectinstance/') && method === 'PUT') {
        const id = url.split('/')[2];
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const updatedScheduleItem = JSON.parse(body);
            await db.collection('subjectInstances').updateOne({ _id: new ObjectId(id) }, { $set: updatedScheduleItem });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Schedule item updated' }));
        });
    } else if (url.startsWith('/subjectinstance/') && method === 'DELETE') {
        const id = url.split('/')[2];
        await db.collection('subjectInstances').deleteOne({ _id: new ObjectId(id) });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Schedule item deleted' }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
