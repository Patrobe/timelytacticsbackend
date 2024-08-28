const { ObjectId } = require('mongodb');

module.exports = async (req, res, db) => {
    const { method, url } = req;

    if (url === '/skill' && method === 'GET') {
        const skill = await db.collection('skill').find().toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' },
            { 'Access-Control-Allow-Origin': 'http://localhost:5173' });
        res.end(JSON.stringify(skill));
        console.log('GET skill was called');
    } else if (url === '/skill' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const skill = JSON.parse(body);
            await db.collection('skill').insertOne(skill);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'skill created' }));
        });
    } else if (url.startsWith('/skill/') && method === 'PUT') {
        const id = url.split('/')[2];
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const updatedskill = JSON.parse(body);
            await db.collection('skill').updateOne({ _id: new ObjectId(id) }, { $set: updatedskill });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'skill updated' }));
        });
    } else if (url.startsWith('/skill/') && method === 'DELETE') {
        const id = url.split('/')[2];
        await db.collection('skill').deleteOne({ _id: new ObjectId(id) });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'skill deleted' }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
