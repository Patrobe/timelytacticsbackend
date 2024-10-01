require('dotenv').config();
const { ObjectId } = require('mongodb');

module.exports = async (req, res, db) => {
    const { method, url } = req;
    const allowedOrigin = process.env.ALLOWED_ORIGIN;
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }
    if (url === '/department' && method === 'GET') {
        const department = await db.collection('department').find().toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(department));
        console.log('GET department was called');
    } else if (url === '/department' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const department = JSON.parse(body);
            const highestDepartment = await db.collection('department')
                .find()
                .sort({ departmentID: -1 })
                .limit(1)
                .toArray();

            const nextDepartmentId = highestDepartment.length > 0 ? highestDepartment[0].departmentID + 1 : 1;
            department.departmentID = nextDepartmentId;
            await db.collection('department').insertOne(department);
            res.writeHead(201, { 'Content-Type': 'application/json' },
                { 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ message: 'department created' }));
        });
    } else if (url.startsWith('/department/') && method === 'PUT') {
        const id = url.split('/')[2];
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const updatedDepartment = JSON.parse(body);
            await db.collection('department').updateOne({ _id: new ObjectId(id) }, { $set: updatedDepartment });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'department updated' }));
        });
    } else if (url.startsWith('/department/') && method === 'DELETE') {
        const id = url.split('/')[2];
        await db.collection('department').deleteOne({ _id: new ObjectId(id) });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'department deleted' }));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
