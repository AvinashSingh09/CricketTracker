import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB, getDB } from './db.js';
import { ObjectId } from 'mongodb';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ==================== PLAYERS API ====================

// Get all players
app.get('/api/players', async (req, res) => {
    try {
        const db = getDB();
        const players = await db.collection('players').find({}).toArray();
        res.json(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        res.status(500).json({ error: 'Failed to fetch players' });
    }
});

// Add a player
app.post('/api/players', async (req, res) => {
    try {
        const db = getDB();
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Player name is required' });
        }

        // Check for duplicate
        const existing = await db.collection('players').findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
        });
        if (existing) {
            return res.status(400).json({ error: 'Player already exists' });
        }

        const newPlayer = {
            name: name.trim(),
            runs: 0,
            balls: 0,
            fours: 0,
            sixes: 0,
            isOut: false,
            wickets: 0,
            oversBowled: 0,
            runsConceded: 0
        };

        const result = await db.collection('players').insertOne(newPlayer);
        res.json({ ...newPlayer, _id: result.insertedId, id: result.insertedId.toString() });
    } catch (error) {
        console.error('Error adding player:', error);
        res.status(500).json({ error: 'Failed to add player' });
    }
});

// Update a player
app.put('/api/players/:id', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const updates = req.body;

        // Remove _id from updates if present
        delete updates._id;
        delete updates.id;

        await db.collection('players').updateOne(
            { _id: new ObjectId(id) },
            { $set: updates }
        );

        const updated = await db.collection('players').findOne({ _id: new ObjectId(id) });
        res.json({ ...updated, id: updated._id.toString() });
    } catch (error) {
        console.error('Error updating player:', error);
        res.status(500).json({ error: 'Failed to update player' });
    }
});

// Delete a player
app.delete('/api/players/:id', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        await db.collection('players').deleteOne({ _id: new ObjectId(id) });

        // Also remove from teams
        const teams = await db.collection('teams').findOne({ _id: 'config' });
        if (teams) {
            await db.collection('teams').updateOne(
                { _id: 'config' },
                {
                    $set: {
                        'teamA.playerIds': teams.teamA.playerIds.filter(pid => pid !== id),
                        'teamB.playerIds': teams.teamB.playerIds.filter(pid => pid !== id)
                    }
                }
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting player:', error);
        res.status(500).json({ error: 'Failed to delete player' });
    }
});

// Reset all player stats
app.post('/api/players/reset-stats', async (req, res) => {
    try {
        const db = getDB();
        await db.collection('players').updateMany({}, {
            $set: {
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                isOut: false,
                wickets: 0,
                oversBowled: 0,
                runsConceded: 0
            }
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error resetting player stats:', error);
        res.status(500).json({ error: 'Failed to reset player stats' });
    }
});

// ==================== TEAMS API ====================

// Get teams
app.get('/api/teams', async (req, res) => {
    try {
        const db = getDB();
        const teams = await db.collection('teams').findOne({ _id: 'config' });
        res.json(teams || {
            teamA: { id: 'team-a', name: 'Team A', playerIds: [] },
            teamB: { id: 'team-b', name: 'Team B', playerIds: [] }
        });
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});

// Update teams
app.put('/api/teams', async (req, res) => {
    try {
        const db = getDB();
        const { teamA, teamB } = req.body;

        await db.collection('teams').updateOne(
            { _id: 'config' },
            { $set: { teamA, teamB } },
            { upsert: true }
        );

        res.json({ teamA, teamB });
    } catch (error) {
        console.error('Error updating teams:', error);
        res.status(500).json({ error: 'Failed to update teams' });
    }
});

// ==================== MATCH API ====================

// Get match state
app.get('/api/match', async (req, res) => {
    try {
        const db = getDB();
        const match = await db.collection('match').findOne({ _id: 'current' });
        res.json(match || {
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
    } catch (error) {
        console.error('Error fetching match:', error);
        res.status(500).json({ error: 'Failed to fetch match' });
    }
});

// Update match state
app.put('/api/match', async (req, res) => {
    try {
        const db = getDB();
        const matchData = req.body;

        // Remove _id from updates
        delete matchData._id;

        await db.collection('match').updateOne(
            { _id: 'current' },
            { $set: matchData },
            { upsert: true }
        );

        res.json(matchData);
    } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({ error: 'Failed to update match' });
    }
});

// Archive match to history
app.post('/api/match/archive', async (req, res) => {
    try {
        const db = getDB();
        const { match, players, teams } = req.body;

        if (!match || !players || !teams) {
            return res.status(400).json({ error: 'Missing match data' });
        }

        const historyItem = {
            match,
            players, // Snapshot of players with their stats for this match
            teams,   // Snapshot of team configuration
            date: new Date(),
            timestamp: Date.now()
        };

        const result = await db.collection('history').insertOne(historyItem);
        res.json({ success: true, id: result.insertedId });
    } catch (error) {
        console.error('Error archiving match:', error);
        res.status(500).json({ error: 'Failed to archive match' });
    }
});

// Get match history
app.get('/api/history', async (req, res) => {
    try {
        const db = getDB();
        const history = await db.collection('history')
            .find({})
            .sort({ timestamp: -1 }) // Newest first
            .toArray();
        res.json(history);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// Reset match
app.post('/api/match/reset', async (req, res) => {
    try {
        const db = getDB();
        const defaultMatch = {
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
        };

        await db.collection('match').updateOne(
            { _id: 'current' },
            { $set: defaultMatch },
            { upsert: true }
        );

        // Also reset player stats
        await db.collection('players').updateMany({}, {
            $set: {
                runs: 0,
                balls: 0,
                fours: 0,
                sixes: 0,
                isOut: false,
                wickets: 0,
                oversBowled: 0,
                runsConceded: 0
            }
        });

        res.json({ success: true, match: defaultMatch });
    } catch (error) {
        console.error('Error resetting match:', error);
        res.status(500).json({ error: 'Failed to reset match' });
    }
});

// Reset all data
app.post('/api/reset-all', async (req, res) => {
    try {
        const db = getDB();

        // Clear players
        await db.collection('players').deleteMany({});

        // Reset teams
        await db.collection('teams').updateOne(
            { _id: 'config' },
            {
                $set: {
                    teamA: { id: 'team-a', name: 'Team A', playerIds: [] },
                    teamB: { id: 'team-b', name: 'Team B', playerIds: [] }
                }
            },
            { upsert: true }
        );

        // Reset match
        await db.collection('match').updateOne(
            { _id: 'current' },
            {
                $set: {
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
                }
            },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error resetting all data:', error);
        res.status(500).json({ error: 'Failed to reset all data' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();
