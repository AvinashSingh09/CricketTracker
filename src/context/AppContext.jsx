import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { playersApi, teamsApi, matchApi, resetAll as resetAllApi } from '../services/api';

const AppContext = createContext(null);

// Generate unique ID (fallback for offline mode)
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Initial state
const initialPlayers = [];
const initialTeams = {
    teamA: { id: 'team-a', name: 'Team A', playerIds: [] },
    teamB: { id: 'team-b', name: 'Team B', playerIds: [] }
};
const initialMatch = {
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

export function AppProvider({ children }) {
    // State
    const [players, setPlayers] = useState(initialPlayers);
    const [teams, setTeams] = useState(initialTeams);
    const [match, setMatch] = useState(initialMatch);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load data from API on mount
    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                setError(null);

                const [playersData, teamsData, matchData] = await Promise.all([
                    playersApi.getAll(),
                    teamsApi.get(),
                    matchApi.get()
                ]);

                // Convert MongoDB _id to id for frontend compatibility
                const normalizedPlayers = playersData.map(p => ({
                    ...p,
                    id: p._id?.toString() || p.id
                }));

                setPlayers(normalizedPlayers);
                setTeams(teamsData);
                setMatch(matchData);
            } catch (err) {
                console.error('Failed to load data from API:', err);
                setError('Failed to connect to server. Using local mode.');
                // Fall back to localStorage if API fails
                try {
                    const localPlayers = JSON.parse(localStorage.getItem('cricket_tracker_players') || '[]');
                    const localTeams = JSON.parse(localStorage.getItem('cricket_tracker_teams') || 'null') || initialTeams;
                    const localMatch = JSON.parse(localStorage.getItem('cricket_tracker_match') || 'null') || initialMatch;
                    setPlayers(localPlayers);
                    setTeams(localTeams);
                    setMatch(localMatch);
                } catch {
                    // Use defaults
                }
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    // Sync to API helper
    const syncToAPI = useCallback(async (type, data) => {
        try {
            if (type === 'teams') {
                await teamsApi.update(data);
            } else if (type === 'match') {
                await matchApi.update(data);
            }
        } catch (err) {
            console.error(`Failed to sync ${type} to API:`, err);
            // Fallback to localStorage
            localStorage.setItem(`cricket_tracker_${type}`, JSON.stringify(data));
        }
    }, []);

    // Player actions
    const addPlayer = useCallback(async (name) => {
        const trimmedName = name.trim();
        if (!trimmedName) return false;
        if (players.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
            return false;
        }

        try {
            const newPlayer = await playersApi.add(trimmedName);
            setPlayers(prev => [...prev, { ...newPlayer, id: newPlayer._id?.toString() || newPlayer.id }]);
            return true;
        } catch (err) {
            console.error('Failed to add player:', err);
            return false;
        }
    }, [players]);

    const updatePlayer = useCallback(async (id, updates) => {
        // Optimistic update
        setPlayers(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

        try {
            await playersApi.update(id, updates);
        } catch (err) {
            console.error('Failed to update player:', err);
        }
    }, []);

    const deletePlayer = useCallback(async (id) => {
        setPlayers(prev => prev.filter(p => p.id !== id));
        setTeams(prev => {
            const updated = {
                ...prev,
                teamA: { ...prev.teamA, playerIds: prev.teamA.playerIds.filter(pid => pid !== id) },
                teamB: { ...prev.teamB, playerIds: prev.teamB.playerIds.filter(pid => pid !== id) }
            };
            syncToAPI('teams', updated);
            return updated;
        });

        try {
            await playersApi.delete(id);
        } catch (err) {
            console.error('Failed to delete player:', err);
        }
    }, [syncToAPI]);

    const resetPlayerStats = useCallback(async () => {
        setPlayers(prev => prev.map(p => ({
            ...p,
            runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false,
            wickets: 0, oversBowled: 0, runsConceded: 0
        })));

        try {
            await playersApi.resetStats();
        } catch (err) {
            console.error('Failed to reset player stats:', err);
        }
    }, []);

    // Team actions
    const addPlayerToTeam = useCallback((playerId, teamId) => {
        setTeams(prev => {
            const otherTeamKey = teamId === 'team-a' ? 'teamB' : 'teamA';
            const thisTeamKey = teamId === 'team-a' ? 'teamA' : 'teamB';

            const updated = {
                ...prev,
                [otherTeamKey]: {
                    ...prev[otherTeamKey],
                    playerIds: prev[otherTeamKey].playerIds.filter(id => id !== playerId)
                },
                [thisTeamKey]: {
                    ...prev[thisTeamKey],
                    playerIds: prev[thisTeamKey].playerIds.includes(playerId)
                        ? prev[thisTeamKey].playerIds
                        : [...prev[thisTeamKey].playerIds, playerId]
                }
            };
            syncToAPI('teams', updated);
            return updated;
        });
    }, [syncToAPI]);

    const removePlayerFromTeam = useCallback((playerId, teamId) => {
        const teamKey = teamId === 'team-a' ? 'teamA' : 'teamB';
        setTeams(prev => {
            const updated = {
                ...prev,
                [teamKey]: {
                    ...prev[teamKey],
                    playerIds: prev[teamKey].playerIds.filter(id => id !== playerId)
                }
            };
            syncToAPI('teams', updated);
            return updated;
        });
    }, [syncToAPI]);

    const updateTeamName = useCallback((teamId, name) => {
        const teamKey = teamId === 'team-a' ? 'teamA' : 'teamB';
        setTeams(prev => {
            const updated = {
                ...prev,
                [teamKey]: { ...prev[teamKey], name }
            };
            syncToAPI('teams', updated);
            return updated;
        });
    }, [syncToAPI]);

    // Match actions
    const setupMatch = useCallback((config) => {
        setMatch(prev => {
            const updated = { ...prev, ...config, status: 'setup' };
            syncToAPI('match', updated);
            return updated;
        });
    }, [syncToAPI]);

    const startMatch = useCallback(() => {
        setMatch(prev => {
            const updated = {
                ...prev,
                firstInningsBattingTeamId: prev.battingTeamId,
                status: 'live'
            };
            syncToAPI('match', updated);
            return updated;
        });
    }, [syncToAPI]);

    const recordBall = useCallback((ballData) => {
        const { runs, isNoBall, isWide, isWicket, batsmanId, bowlerId } = ballData;
        const isExtra = isNoBall || isWide;

        setMatch(prev => {
            const newBall = {
                id: generateId(),
                runs, isNoBall, isWide, isExtra,
                extraType: isNoBall ? 'no-ball' : isWide ? 'wide' : null,
                isWicket, batsmanId, bowlerId,
                timestamp: Date.now()
            };

            let newTotalBalls = prev.totalBalls;
            let newTotalRuns = prev.totalRuns + runs;
            let newWickets = prev.wickets;
            let newExtras = { ...prev.extras };

            if (isWide) {
                newTotalRuns += 1;
                newExtras.wides += 1;
            } else if (isNoBall) {
                newTotalRuns += 1;
                newExtras.noBalls += 1;
            }

            if (!isExtra) {
                newTotalBalls += 1;
            }

            if (isWicket) {
                newWickets += 1;
            }

            const updated = {
                ...prev,
                totalRuns: newTotalRuns,
                totalBalls: newTotalBalls,
                wickets: newWickets,
                extras: newExtras,
                ballByBall: [...prev.ballByBall, newBall]
            };

            syncToAPI('match', updated);
            return updated;
        });

        // Update batsman stats
        const batsman = players.find(p => p.id === batsmanId);
        if (batsman) {
            updatePlayer(batsmanId, {
                runs: batsman.runs + runs,
                balls: isNoBall || isWide ? batsman.balls : batsman.balls + 1,
                fours: runs === 4 ? batsman.fours + 1 : batsman.fours,
                sixes: runs === 6 ? batsman.sixes + 1 : batsman.sixes,
                isOut: isWicket ? true : batsman.isOut
            });
        }

        // Update bowler stats
        const bowler = players.find(p => p.id === bowlerId);
        if (bowler) {
            const runsAgainstBowler = runs + (isNoBall || isWide ? 1 : 0);
            updatePlayer(bowlerId, {
                oversBowled: isNoBall || isWide ? bowler.oversBowled : bowler.oversBowled + 1,
                runsConceded: bowler.runsConceded + runsAgainstBowler,
                wickets: isWicket ? bowler.wickets + 1 : bowler.wickets
            });
        }
    }, [players, updatePlayer, syncToAPI]);

    const undoLastBall = useCallback(() => {
        setMatch(prev => {
            if (prev.ballByBall.length === 0) return prev;

            const lastBall = prev.ballByBall[prev.ballByBall.length - 1];
            const newBallByBall = prev.ballByBall.slice(0, -1);

            let newTotalBalls = prev.totalBalls;
            let newTotalRuns = prev.totalRuns - lastBall.runs;
            let newWickets = prev.wickets;
            let newExtras = { ...prev.extras };

            if (lastBall.isWide) {
                newTotalRuns -= 1;
                newExtras.wides -= 1;
            } else if (lastBall.isNoBall) {
                newTotalRuns -= 1;
                newExtras.noBalls -= 1;
            } else {
                newTotalBalls -= 1;
            }

            if (lastBall.isWicket) {
                newWickets -= 1;
            }

            const updated = {
                ...prev,
                totalRuns: newTotalRuns,
                totalBalls: newTotalBalls,
                wickets: newWickets,
                extras: newExtras,
                ballByBall: newBallByBall
            };

            syncToAPI('match', updated);
            return updated;
        });
    }, [syncToAPI]);

    const selectBatsman = useCallback((batsmanId, position = 0) => {
        setMatch(prev => {
            const newBatsmanIds = [...prev.currentBatsmanIds];
            newBatsmanIds[position] = batsmanId;
            const updated = { ...prev, currentBatsmanIds: newBatsmanIds };
            syncToAPI('match', updated);
            return updated;
        });
    }, [syncToAPI]);

    const selectBowler = useCallback((bowlerId) => {
        setMatch(prev => {
            const updated = { ...prev, currentBowlerId: bowlerId };
            syncToAPI('match', updated);
            return updated;
        });
    }, [syncToAPI]);

    const endInnings = useCallback(() => {
        setMatch(prev => {
            const updated = { ...prev, status: 'innings_complete' };
            syncToAPI('match', updated);
            return updated;
        });
    }, [syncToAPI]);

    const startSecondInnings = useCallback(() => {
        setMatch(prev => {
            const firstInningsScore = {
                runs: prev.totalRuns,
                wickets: prev.wickets,
                balls: prev.totalBalls,
                battingTeamId: prev.battingTeamId
            };

            const updated = {
                ...prev,
                battingTeamId: prev.bowlingTeamId,
                bowlingTeamId: prev.battingTeamId,
                currentBatsmanIds: [],
                currentBowlerId: null,
                totalRuns: 0,
                wickets: 0,
                totalBalls: 0,
                extras: { wides: 0, noBalls: 0 },
                ballByBall: [],
                innings: 2,
                firstInningsScore,
                status: 'live'
            };

            syncToAPI('match', updated);
            return updated;
        });
    }, [syncToAPI]);

    const completeMatch = useCallback(() => {
        setMatch(prev => {
            const updated = { ...prev, status: 'complete' };
            syncToAPI('match', updated);
            return updated;
        });
    }, [syncToAPI]);

    const resetMatch = useCallback(async () => {
        try {
            await matchApi.reset();
            setMatch(initialMatch);
            setPlayers(prev => prev.map(p => ({
                ...p, runs: 0, balls: 0, fours: 0, sixes: 0, isOut: false,
                wickets: 0, oversBowled: 0, runsConceded: 0
            })));
        } catch (err) {
            console.error('Failed to reset match:', err);
        }
    }, []);

    const resetAll = useCallback(async () => {
        try {
            await resetAllApi();
            setPlayers([]);
            setTeams(initialTeams);
            setMatch(initialMatch);
        } catch (err) {
            console.error('Failed to reset all:', err);
        }
    }, []);

    const archiveMatch = useCallback(async () => {
        try {
            // Save current state to history
            await matchApi.archive({
                match,
                players,
                teams
            });
            return true;
        } catch (err) {
            console.error('Failed to archive match:', err);
            return false;
        }
    }, [match, players, teams]);

    // Utility getters
    const getPlayer = useCallback((id) => players.find(p => p.id === id), [players]);

    const getTeamPlayers = useCallback((teamId) => {
        const teamKey = teamId === 'team-a' ? 'teamA' : 'teamB';
        return teams[teamKey].playerIds.map(id => getPlayer(id)).filter(Boolean);
    }, [teams, getPlayer]);

    const getUnassignedPlayers = useCallback(() => {
        const assignedIds = [...teams.teamA.playerIds, ...teams.teamB.playerIds];
        return players.filter(p => !assignedIds.includes(p.id));
    }, [players, teams]);

    const getBattingTeam = useCallback(() => {
        if (!match.battingTeamId) return null;
        return match.battingTeamId === 'team-a' ? teams.teamA : teams.teamB;
    }, [match.battingTeamId, teams]);

    const getBowlingTeam = useCallback(() => {
        if (!match.bowlingTeamId) return null;
        return match.bowlingTeamId === 'team-a' ? teams.teamA : teams.teamB;
    }, [match.bowlingTeamId, teams]);

    const getTarget = useCallback(() => {
        if (match.innings !== 2 || !match.firstInningsScore) return null;
        return match.firstInningsScore.runs + 1;
    }, [match.innings, match.firstInningsScore]);

    const getManOfMatch = useCallback(() => {
        if (players.length === 0) return null;

        const topScorer = players.reduce((best, player) =>
            player.runs > best.runs ? player : best
            , { runs: -1 });

        const topWicketTaker = players.reduce((best, player) =>
            player.wickets > best.wickets ? player : best
            , { wickets: -1 });

        if (topScorer.runs >= topWicketTaker.wickets * 20) {
            return topScorer.id ? topScorer : null;
        }
        return topWicketTaker.id ? topWicketTaker : null;
    }, [players]);

    const value = {
        players, teams, match, loading, error,
        addPlayer, updatePlayer, deletePlayer, resetPlayerStats,
        addPlayerToTeam, removePlayerFromTeam, updateTeamName,
        setupMatch, startMatch, recordBall, undoLastBall,
        selectBatsman, selectBowler, endInnings, startSecondInnings,
        completeMatch, resetMatch, resetAll, archiveMatch,
        getPlayer, getTeamPlayers, getUnassignedPlayers,
        getBattingTeam, getBowlingTeam, getTarget, getManOfMatch
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
}

export default AppContext;
