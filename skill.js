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

    // Helper function to extract skillID from URL
    const getSkillIDFromURL = (url) => {
        const parts = url.split('/');
        return parts.length > 2 ? parseInt(parts[2], 10) : null;
    };

    if (url === '/skill' && method === 'GET') {
        // Exclude _id from the returned skills
        try {
            const skills = await db.collection('skill').find({}, { projection: { _id: 0 } }).toArray();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(skills));
            console.log('GET /skill was called');
        } catch (error) {
            console.error('Error fetching skills:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Failed to fetch skills' }));
        }
    } else if (url === '/skill' && method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const skill = JSON.parse(body);
                // Ensure 'active' field is set to true on creation
                skill.active = true;

                // Validate required fields
                if (!skill.skillName || !skill.departmentID) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'skillName and departmentID are required' }));
                    return;
                }

                // Assign skillID
                const highestSkill = await db.collection('skill')
                    .find()
                    .sort({ skillID: -1 })
                    .limit(1)
                    .toArray();

                const nextSkillId = highestSkill.length > 0 ? highestSkill[0].skillID + 1 : 1;
                skill.skillID = nextSkillId;

                await db.collection('skill').insertOne(skill);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'skill created' }));
                console.log(`POST /skill: Skill "${skill.skillName}" created with skillID ${skill.skillID}`);
            } catch (error) {
                console.error('Error creating skill:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid skill data' }));
            }
        });
    } else if (url.startsWith('/skill/') && method === 'PUT') {
        const skillID = getSkillIDFromURL(url);
        if (isNaN(skillID)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Invalid skillID in URL' }));
            return;
        }

        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const updatedSkill = JSON.parse(body);
                // Prevent _id from being updated if it's somehow included
                delete updatedSkill._id;

                // Validate required fields
                if (!updatedSkill.skillName || !updatedSkill.departmentID) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'skillName and departmentID are required' }));
                    return;
                }

                const result = await db.collection('skill').updateOne(
                    { skillID: skillID },
                    { $set: updatedSkill }
                );

                if (result.matchedCount === 0) {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'skill not found' }));
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'skill updated' }));
                console.log(`PUT /skill/${skillID}: Skill updated`);
            } catch (error) {
                console.error('Error updating skill:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Invalid skill data' }));
            }
        });
    } else if (url.startsWith('/skill/') && method === 'DELETE') {
        const skillID = getSkillIDFromURL(url);
        if (isNaN(skillID)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Invalid skillID in URL' }));
            return;
        }

        try {
            const result = await db.collection('skill').deleteOne({ skillID: skillID });

            if (result.deletedCount === 0) {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'skill not found' }));
                return;
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'skill deleted' }));
            console.log(`DELETE /skill/${skillID}: Skill deleted`);
        } catch (error) {
            console.error('Error deleting skill:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Failed to delete skill' }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Route not found');
    }
};
