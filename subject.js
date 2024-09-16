const { ObjectId } = require('mongodb');

module.exports = async (req, res, db) => {
    const { method, url } = req;
    res.setHeader('Access-Control-Allow-Origin', 'http://170.64.196.188:5173');
    //res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

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
