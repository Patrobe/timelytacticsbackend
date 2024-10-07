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

    if (url === '/department' && method === 'GET') {
        try {
            const departments = await db.collection('department').find().toArray();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(departments));
            console.log('GET department was called');
        } catch (error) {
            console.error('Error fetching departments:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to fetch departments' }));
        }
    } else if (url === '/department' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const department = JSON.parse(body);
                const highestDepartment = await db.collection('department')
                    .find()
                    .sort({ departmentID: -1 })
                    .limit(1)
                    .toArray();

                const nextDepartmentId = highestDepartment.length > 0 ? highestDepartment[0].departmentID + 1 : 1;
                department.departmentID = nextDepartmentId;
                department.active = true; 
                const insertResult = await db.collection('department').insertOne(department);

                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'department created', department: insertResult }));
            } catch (error) {
                console.error('Error creating department:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to create department' }));
            }
        });
    } else if (url.startsWith('/department/') && method === 'PUT') {
        const departmentID = parseInt(url.split('/')[2], 10);
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const updatedDepartment = JSON.parse(body);
                delete updatedDepartment._id; 
                await db.collection('department').updateOne(
                    { departmentID: departmentID },
                    { $set: updatedDepartment }
                );
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'department updated' }));
            } catch (error) {
                console.error('Error updating department:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to update department' }));
            }
        });
    } else if (url.startsWith('/department/') && method === 'DELETE') {
        const departmentID = parseInt(url.split('/')[2], 10);
        try {
            await db.collection('department').deleteOne({ departmentID: departmentID });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'department deleted' }));
        } catch (error) {
            console.error('Error deleting department:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to delete department' }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
