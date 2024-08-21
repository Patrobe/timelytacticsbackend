const { ObjectId } = require('mongodb');

module.exports = async (req, res, db) => {
    const { method, url } = req;

    if (url === '/subjects' && method === 'GET') {
        const subjects = await db.collection('subjects').find().toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(subjects));
    } else if (url === '/subjects' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const subject = JSON.parse(body);
            await db.collection('subjects').insertOne(subject);
            res.writeHead(201, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Subject created' }));
        });
    } else if (url.startsWith('/subjects/') && method === 'PUT') {
        const id = url.split('/')[2];
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const updatedSubject = JSON.parse(body);
            await db.collection('subjects').updateOne({ _id: new ObjectId(id) }, { $set: updatedSubject });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Subject updated' }));
        });
    } else if (url.startsWith('/subjects/') && method === 'DELETE') {
        const id = url.split('/')[2];
        await db.collection('subjects').deleteOne({ _id: new ObjectId(id) });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Subject deleted' }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
