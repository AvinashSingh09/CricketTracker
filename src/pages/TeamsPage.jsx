import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function TeamsPage() {
    const {
        players,
        teams,
        addPlayerToTeam,
        removePlayerFromTeam,
        updateTeamName,
        getUnassignedPlayers
    } = useApp();

    const [editingTeam, setEditingTeam] = useState(null);
    const [teamNameInput, setTeamNameInput] = useState('');

    const unassignedPlayers = getUnassignedPlayers();
    const teamAPlayers = teams.teamA.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean);
    const teamBPlayers = teams.teamB.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean);

    const handleTeamNameEdit = (teamId) => {
        const team = teamId === 'team-a' ? teams.teamA : teams.teamB;
        setEditingTeam(teamId);
        setTeamNameInput(team.name);
    };

    const handleTeamNameSave = () => {
        if (teamNameInput.trim() && editingTeam) {
            updateTeamName(editingTeam, teamNameInput.trim());
        }
        setEditingTeam(null);
        setTeamNameInput('');
    };

    const PlayerChip = ({ player, teamId, onRemove }) => (
        <div className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${teamId === 'team-a'
            ? 'border-blue-500/40 bg-blue-500/10'
            : teamId === 'team-b'
                ? 'border-yellow-500/40 bg-yellow-500/10'
                : 'border-[#2A3F5F] bg-[#243352]'
            }`}>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold ${teamId === 'team-a' ? 'avatar-blue' : teamId === 'team-b' ? 'avatar-gold' : 'avatar-green'
                }`}>
                {player.name.charAt(0).toUpperCase()}
            </div>
            <span className="flex-1 font-medium text-sm">{player.name}</span>
            {onRemove && (
                <button
                    onClick={() => onRemove(player.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );

    if (players.length === 0) {
        return (
            <div className="animate-fade-in">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-1">Teams</h1>
                    <p className="text-gray-400 text-sm">Create your two teams</p>
                </div>
                <div className="card text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#243352] flex items-center justify-center text-3xl">
                        👥
                    </div>
                    <p className="text-gray-300 font-medium">No players available</p>
                    <p className="text-gray-500 text-sm mt-1">Add players first before creating teams</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Teams</h1>
                <p className="text-gray-400 text-sm">Assign players to teams</p>
            </div>

            {/* Unassigned Players */}
            {unassignedPlayers.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Available Players
                        </span>
                        <span className="px-2 py-0.5 bg-[#243352] rounded-md text-xs font-bold text-gray-300">
                            {unassignedPlayers.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {unassignedPlayers.map(player => (
                            <div
                                key={player.id}
                                className="flex items-center gap-3 p-3 bg-[#1A2744] border border-[#2A3F5F] rounded-lg hover:border-[#3B5278] transition-all"
                            >
                                <div className="w-9 h-9 rounded-lg avatar-green flex items-center justify-center text-sm font-bold">
                                    {player.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="flex-1 font-medium text-sm truncate">{player.name}</span>
                                <div className="flex gap-1.5">
                                    <button
                                        onClick={() => addPlayerToTeam(player.id, 'team-a')}
                                        className="px-3 py-1.5 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-md hover:bg-blue-500/30 transition-colors border border-blue-500/30"
                                    >
                                        → A
                                    </button>
                                    <button
                                        onClick={() => addPlayerToTeam(player.id, 'team-b')}
                                        className="px-3 py-1.5 text-xs font-semibold bg-yellow-500/20 text-yellow-400 rounded-md hover:bg-yellow-500/30 transition-colors border border-yellow-500/30"
                                    >
                                        → B
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Teams Grid */}
            <div className="grid md:grid-cols-2 gap-4">
                {/* Team A */}
                <div className="card team-card team-a">
                    <div className="flex items-center justify-between mb-4">
                        {editingTeam === 'team-a' ? (
                            <div className="flex items-center gap-2 flex-1">
                                <input
                                    type="text"
                                    value={teamNameInput}
                                    onChange={(e) => setTeamNameInput(e.target.value)}
                                    className="input py-2 text-lg font-bold"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleTeamNameSave();
                                        if (e.key === 'Escape') setEditingTeam(null);
                                    }}
                                />
                                <button onClick={handleTeamNameSave} className="btn btn-primary py-2 px-4 text-sm">
                                    Save
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/10 shadow-lg">
                                        <img src="/A.png" alt="Team A" className="w-full h-full object-contain filter drop-shadow" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-blue-400">{teams.teamA.name}</h3>
                                        <p className="text-xs text-gray-500">{teamAPlayers.length} player{teamAPlayers.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleTeamNameEdit('team-a')}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>

                    {teamAPlayers.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-[#2A3F5F] rounded-xl">
                            <p className="text-gray-500 text-sm">No players yet</p>
                            <p className="text-gray-600 text-xs mt-1">Tap "→ A" to add players</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {teamAPlayers.map(player => (
                                <PlayerChip
                                    key={player.id}
                                    player={player}
                                    teamId="team-a"
                                    onRemove={(id) => removePlayerFromTeam(id, 'team-a')}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Team B */}
                <div className="card team-card team-b">
                    <div className="flex items-center justify-between mb-4">
                        {editingTeam === 'team-b' ? (
                            <div className="flex items-center gap-2 flex-1">
                                <input
                                    type="text"
                                    value={teamNameInput}
                                    onChange={(e) => setTeamNameInput(e.target.value)}
                                    className="input py-2 text-lg font-bold"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleTeamNameSave();
                                        if (e.key === 'Escape') setEditingTeam(null);
                                    }}
                                />
                                <button onClick={handleTeamNameSave} className="btn btn-primary py-2 px-4 text-sm">
                                    Save
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/10 shadow-lg">
                                        <img src="/B.png" alt="Team B" className="w-full h-full object-contain filter drop-shadow" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-yellow-400">{teams.teamB.name}</h3>
                                        <p className="text-xs text-gray-500">{teamBPlayers.length} player{teamBPlayers.length !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleTeamNameEdit('team-b')}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>

                    {teamBPlayers.length === 0 ? (
                        <div className="text-center py-10 border-2 border-dashed border-[#2A3F5F] rounded-xl">
                            <p className="text-gray-500 text-sm">No players yet</p>
                            <p className="text-gray-600 text-xs mt-1">Tap "→ B" to add players</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {teamBPlayers.map(player => (
                                <PlayerChip
                                    key={player.id}
                                    player={player}
                                    teamId="team-b"
                                    onRemove={(id) => removePlayerFromTeam(id, 'team-b')}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Validation Messages */}
            {(teamAPlayers.length === 0 || teamBPlayers.length === 0) && unassignedPlayers.length === 0 && (
                <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Both teams need at least 1 player to start a match</span>
                </div>
            )}
        </div>
    );
}
