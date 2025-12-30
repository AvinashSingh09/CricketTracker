import { MongoClient, ServerApiVersion } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db = null;

export async function connectDB() {
    try {
        console.log('🔌 Connecting to MongoDB Atlas...');
        await client.connect();

        // Test connection
        await client.db("admin").command({ ping: 1 });
        console.log('✅ Connected to MongoDB Atlas successfully!');

        db = client.db('cricket_tracker');

        // Create collections if they don't exist
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        if (!collectionNames.includes('players')) {
            await db.createCollection('players');
            console.log('📁 Created players collection');
        }
        if (!collectionNames.includes('teams')) {
            await db.createCollection('teams');
            // Initialize default teams
            const teamsCollection = db.collection('teams');
            const existingTeams = await teamsCollection.findOne({ _id: 'config' });
            if (!existingTeams) {
                await teamsCollection.insertOne({
                    _id: 'config',
                    teamA: { id: 'team-a', name: 'Team A', playerIds: [] },
                    teamB: { id: 'team-b', name: 'Team B', playerIds: [] }
                });
            }
            console.log('📁 Created teams collection');
        }
        if (!collectionNames.includes('match')) {
            await db.createCollection('match');
            // Initialize default match
            const matchCollection = db.collection('match');
            const existingMatch = await matchCollection.findOne({ _id: 'current' });
            if (!existingMatch) {
                await matchCollection.insertOne({
                    _id: 'current',
                    name: '',
                    oversLimit: null,
                    battingTeamId: null,
                    bowlingTeamId: null,
                    currentBatsmanIds: [],
                    currentBowlerId: null,
                    totalRuns: 0,
                    wickets: 0,
                    totalBalls: 0,
                    extras: { wides: 0, noBalls: 0 },
                    ballByBall: [],
                    innings: 1,
                    firstInningsScore: null,
                    firstInningsBattingTeamId: null,
                    status: 'setup'
                });
            }
            console.log('📁 Created match collection');
        }
        if (!collectionNames.includes('history')) {
            await db.createCollection('history');
            console.log('📁 Created history collection');
        }

        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        console.log('\n🔧 Troubleshooting tips:');
        console.log('1. Make sure your IP is whitelisted in MongoDB Atlas → Network Access');
        console.log('2. Check if the connection string in .env is correct');
        console.log('3. Verify the database password is correct');
        throw error;
    }
}

export function getDB() {
    if (!db) {
        throw new Error('Database not connected. Call connectDB first.');
    }
    return db;
}

export async function closeDB() {
    await client.close();
    console.log('MongoDB connection closed');
}
