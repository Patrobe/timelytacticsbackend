const { parse } = require('url');
const querystring = require('querystring');

module.exports = async (req, res, db) => {
    const { method, url } = req;

    if (url.startsWith('/subjectinstance') && method === 'GET') {
        const parsedUrl = parse(url);
        const queryParams = querystring.parse(parsedUrl.query);

        const { subjectId, year, month } = queryParams;

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

        // Fetch results based on the query object
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
