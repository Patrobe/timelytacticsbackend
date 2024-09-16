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
    if (url === '/skill' && method === 'GET') {
        const skill = await db.collection('skill').find().toArray();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(skill));
        console.log('GET skill was called');
    } else if (url === '/skill' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            const skill = JSON.parse(body);
            const highestSkill = await db.collection('skill')
                .find()
                .sort({ skillID: -1 })
                .limit(1)
                .toArray();

            const nextSkillId = highestSkill.length > 0 ? highestSkill[0].skillID + 1 : 1;
            skill.skillID = nextSkillId;
            await db.collection('skill').insertOne(skill);
            res.writeHead(201, { 'Content-Type': 'application/json' },
                { 'Access-Control-Allow-Origin': '*' });
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
