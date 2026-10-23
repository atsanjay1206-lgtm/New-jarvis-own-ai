import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Download, 
  Upload, 
  Database, 
  Search, 
  ShieldCheck, 
  Clock 
} from 'lucide-react';
import { MemoryItem } from '../types/jarvis';
import { jarvisStorage } from '../services/storage';
import { soundEffects } from '../services/soundEffects';

interface MemoryBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoriesUpdated: () => void;
}

export const MemoryBankModal: React.FC<MemoryBankModalProps> = ({
  isOpen,
  onClose,
  onMemoriesUpdated,
}) => {
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editKey, setEditKey] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editCategory, setEditCategory] = useState<MemoryItem['category']>('General');

  const [isAdding, setIsAdding] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('Directive');

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen]);

  const loadMemories = async () => {
    const list = await jarvisStorage.getMemories();
    setMemories(list);
  };

  if (!isOpen) return null;

  const categories = ['All', 'User Profile', 'Directive', 'Device Specs', 'Preference', 'Protocol', 'General'];

  const filteredMemories = memories.filter(m => {
    const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
    const matchesQuery = searchQuery === '' ||
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const handleStartEdit = (m: MemoryItem) => {
    soundEffects.playClick();
    setEditingId(m.id);
    setEditKey(m.key);
    setEditValue(m.value);
    setEditCategory(m.category);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editKey.trim() || !editValue.trim()) return;
    soundEffects.playActionConfirmed();
    await jarvisStorage.saveMemory({
      id: editingId,
      key: editKey.trim(),
      value: editValue.trim(),
      category: editCategory,
      created: memories.find(m => m.id === editingId)?.created || Date.now(),
      updated: Date.now(),
      confidence: 1.0,
    });
    setEditingId(null);
    await loadMemories();
    onMemoriesUpdated();
  };

  const handleDelete = async (id: string) => {
    soundEffects.playClick();
    if (window.confirm("Purge this entry from durable memory, Sir?")) {
      await jarvisStorage.deleteMemory(id);
      await loadMemories();
      onMemoriesUpdated();
    }
  };

  const handleCreateNew = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    soundEffects.playActionConfirmed();
    await jarvisStorage.saveMemory({
      id: 'mem_' + Date.now(),
      key: newKey.trim(),
      value: newValue.trim(),
      category: newCategory,
      created: Date.now(),
      updated: Date.now(),
      confidence: 1.0,
    });
    setNewKey('');
    setNewValue('');
    setIsAdding(false);
    await loadMemories();
    onMemoriesUpdated();
  };

  const handleExport = async () => {
    soundEffects.playClick();
    const dataStr = await jarvisStorage.exportDatabase();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jarvis_memory_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      const success = await jarvisStorage.importDatabase(content);
      if (success) {
        soundEffects.playActionConfirmed();
        await loadMemories();
        onMemoriesUpdated();
        alert('Memory bank restored successfully, Sir.');
      } else {
        soundEffects.playAlert();
        alert('Failed to parse backup archive.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-[#050b14] border border-cyan-800/80 rounded-2xl flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-950 bg-[#071322]">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-mono text-sm sm:text-base font-bold text-cyan-200 tracking-wider">
                DURABLE MEMORY BANK // PERSISTENT CORE
              </h3>
              <p className="text-[11px] font-mono text-cyan-600">
                Encrypted local storage • IndexedDB architecture • Zero cloud leakage
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundEffects.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-cyan-500 hover:text-cyan-200 hover:bg-cyan-950/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Search, Filters & Export */}
        <div className="p-4 border-b border-cyan-950/80 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 text-cyan-600 absolute left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories, facts, directives..."
                className="w-full bg-[#0a1626] border border-cyan-900/60 rounded-lg pl-9 pr-3 py-1.5 text-xs text-cyan-100 placeholder-cyan-700 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={() => {
                soundEffects.playClick();
                setIsAdding(!isAdding);
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/60 text-cyan-300 text-xs font-mono font-semibold flex items-center gap-1.5 hover:bg-cyan-500/30 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW MEMORY</span>
            </button>
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  soundEffects.playClick();
                  setSelectedCategory(cat);
                }}
                className={`px-2.5 py-1 rounded whitespace-nowrap border transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'border-cyan-400 bg-cyan-950/60 text-cyan-200 font-bold'
                    : 'border-cyan-950 bg-cyan-950/20 text-cyan-600 hover:text-cyan-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Add Memory Form if active */}
        {isAdding && (
          <div className="p-4 bg-cyan-950/30 border-b border-cyan-900/60 flex flex-col gap-2.5">
            <span className="text-xs font-mono font-bold text-cyan-300">ADD DIRECTIVE TO PERSISTENT MEMORY</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Memory Key / Label (e.g. Master Moniker)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="bg-[#0a1626] border border-cyan-900 rounded p-2 text-xs text-cyan-100"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                className="bg-[#0a1626] border border-cyan-900 rounded p-2 text-xs text-cyan-300 font-mono"
              >
                <option value="User Profile">User Profile</option>
                <option value="Directive">Directive</option>
                <option value="Device Specs">Device Specs</option>
                <option value="Preference">Preference</option>
                <option value="Protocol">Protocol</option>
                <option value="General">General</option>
              </select>
            </div>
            <textarea
              placeholder="Detailed memory content or instruction..."
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              rows={2}
              className="bg-[#0a1626] border border-cyan-900 rounded p-2 text-xs text-cyan-100"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 rounded text-xs text-cyan-600 hover:text-cyan-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNew}
                className="px-4 py-1 rounded bg-cyan-500 text-black font-semibold text-xs font-mono hover:bg-cyan-400"
              >
                Commit to Storage
              </button>
            </div>
          </div>
        )}

        {/* Memories List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5">
          {filteredMemories.length === 0 ? (
            <div className="text-center py-12 text-xs font-mono text-cyan-700">
              No matching records found in local memory bank.
            </div>
          ) : (
            filteredMemories.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-xl border border-cyan-900/60 bg-[#071322]/60 flex flex-col gap-2"
              >
                {editingId === m.id ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={editKey}
                      onChange={(e) => setEditKey(e.target.value)}
                      className="bg-[#0a1626] border border-cyan-800 rounded p-1.5 text-xs text-cyan-200"
                    />
                    <textarea
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      rows={2}
                      className="bg-[#0a1626] border border-cyan-800 rounded p-1.5 text-xs text-cyan-100"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 rounded text-xs text-cyan-600 hover:text-cyan-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="px-3 py-1 rounded bg-cyan-500 text-black text-xs font-mono font-bold flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-cyan-300">{m.key}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-900 bg-cyan-950/40 text-cyan-400">
                          {m.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStartEdit(m)}
                          className="p-1 text-cyan-600 hover:text-cyan-300 cursor-pointer"
                          title="Edit Memory"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-1 text-red-600 hover:text-red-400 cursor-pointer"
                          title="Purge Memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{m.value}</p>
                    <div className="text-[10px] font-mono text-cyan-700 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>Last updated: {new Date(m.updated).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Backup controls */}
        <div className="px-5 py-3 border-t border-cyan-950 bg-[#071322] flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-cyan-600 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted local database ({memories.length} records)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-2.5 py-1 rounded border border-cyan-900 bg-cyan-950/40 text-cyan-400 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
              title="Download JSON Database Archive"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
            <label
              className="px-2.5 py-1 rounded border border-cyan-900 bg-cyan-950/40 text-cyan-400 hover:text-cyan-200 flex items-center gap-1 cursor-pointer"
              title="Upload and Restore JSON Backup"
            >
              <Upload className="w-3 h-3" />
              <span>Import</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
