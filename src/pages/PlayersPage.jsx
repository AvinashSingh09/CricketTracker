import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function PlayersPage() {
    const { players, addPlayer, updatePlayer, deletePlayer } = useApp();
    const [newPlayerName, setNewPlayerName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [error, setError] = useState('');

    const handleAddPlayer = (e) => {
        e.preventDefault();
        setError('');

        if (!newPlayerName.trim()) {
            setError('Please enter a player name');
            return;
        }

        const success = addPlayer(newPlayerName);
        if (success) {
            setNewPlayerName('');
        } else {
            setError('Player already exists');
        }
    };

    const handleStartEdit = (player) => {
        setEditingId(player.id);
        setEditName(player.name);
    };

    const handleSaveEdit = (id) => {
        if (editName.trim()) {
            updatePlayer(id, { name: editName.trim() });
        }
        setEditingId(null);
        setEditName('');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditName('');
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Players</h1>
                <p className="text-gray-400 text-sm">Add players for the tournament</p>
            </div>

            {/* Add Player Form */}
            <form onSubmit={handleAddPlayer} className="mb-6">
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        placeholder="Enter player name..."
                        className="input flex-1"
                        maxLength={30}
                    />
                    <button type="submit" className="btn btn-primary whitespace-nowrap">
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                    </button>
                </div>
                {error && (
                    <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </p>
                )}
            </form>

            {/* Player Count */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-gray-400 text-sm">Total Players</span>
                <span className="px-2 py-0.5 bg-[#243352] rounded-md text-xs font-bold text-white">
                    {players.length}
                </span>
            </div>

            {/* Players List */}
            {players.length === 0 ? (
                <div className="card text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#243352] flex items-center justify-center text-3xl">
                        🏏
                    </div>
                    <p className="text-gray-300 font-medium">No players added yet</p>
                    <p className="text-gray-500 text-sm mt-1">Add players to start building your teams</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {players.map((player, index) => (
                        <div
                            key={player.id}
                            className="card flex items-center justify-between animate-slide-up p-4"
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            {editingId === player.id ? (
                                <div className="flex items-center gap-3 flex-1">
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className="input flex-1 py-2"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEdit(player.id);
                                            if (e.key === 'Escape') handleCancelEdit();
                                        }}
                                    />
                                    <button
                                        onClick={() => handleSaveEdit(player.id)}
                                        className="btn btn-primary text-sm py-2 px-4"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="btn btn-secondary text-sm py-2 px-4"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl avatar-green flex items-center justify-center font-bold text-lg">
                                            {player.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <span className="font-semibold">{player.name}</span>
                                            <p className="text-xs text-gray-500">Player #{index + 1}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleStartEdit(player)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => deletePlayer(player.id)}
                                            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-red-500/20 transition-colors"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
