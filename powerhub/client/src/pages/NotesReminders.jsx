import React, { useState, useEffect } from 'react';
import axios from 'axios';

const NotesReminders = () => {
    const [notes, setNotes] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [newNote, setNewNote] = useState({ title: '', content: '' });
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user ? user.token : null;
            const [notesRes, tasksRes] = await Promise.all([
                axios.get('http://localhost:5000/api/v1/workouts/notes', { headers: { Authorization: `Bearer ${token}` } }),
                axios.get('http://localhost:5000/api/v1/workouts/tasks', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setNotes(notesRes.data);
            setTasks(tasksRes.data);
        } catch (err) {
            console.error(err);
        }
    };

    const addNote = async () => {
        if (!newNote.title || !newNote.content) return;
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user ? user.token : null;
            const res = await axios.post('http://localhost:5000/api/v1/workouts/notes', newNote, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotes([res.data, ...notes]);
            setNewNote({ title: '', content: '' });
        } catch (err) {
            console.error(err);
        }
    };

    const addTask = async () => {
        if (!newTask) return;
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user ? user.token : null;
            const res = await axios.post('http://localhost:5000/api/v1/workouts/tasks', { content: newTask }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks([res.data, ...tasks]);
            setNewTask('');
        } catch (err) {
            console.error(err);
        }
    };

    const toggleTask = async (id, currentStatus) => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = user ? user.token : null;
            await axios.put(`http://localhost:5000/api/v1/workouts/tasks/${id}`, { isCompleted: !currentStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTasks(tasks.map(t => t._id === id ? { ...t, isCompleted: !currentStatus } : t));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="container mx-auto p-6 pb-24 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Notes Section */}
            <div className="bg-card backdrop-blur-xl border border-border p-8 rounded-3xl shadow-xl h-full flex flex-col">
                <h2 className="text-3xl font-black mb-6 text-foreground tracking-tight">Workout Notes</h2>
                <div className="mb-6 space-y-3">
                    <input
                        type="text"
                        placeholder="Title"
                        value={newNote.title}
                        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                        className="w-full p-4 bg-muted border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                    <textarea
                        placeholder="Content"
                        value={newNote.content}
                        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                        className="w-full p-4 bg-muted border border-border rounded-xl max-h-32 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-all custom-scrollbar"
                    />
                    <button onClick={addNote} className="bg-primary text-black font-bold px-6 py-3 rounded-xl hover:bg-primary/90 w-full transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)]">
                        Add Note
                    </button>
                </div>
                <div className="space-y-4 overflow-y-auto flex-grow custom-scrollbar pr-2 max-h-[500px]">
                    {notes.map(note => (
                        <div key={note._id} className="bg-yellow-400/10 p-5 rounded-2xl border border-yellow-400/20 relative group hover:border-yellow-400/40 transition-all">
                            <h4 className="font-bold text-yellow-100 text-lg mb-1">{note.title}</h4>
                            <p className="text-sm text-yellow-50/80 mb-2 leading-relaxed">{note.content}</p>
                            <span className="text-xs text-yellow-500/60 font-mono">{new Date(note.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tasks Section */}
            <div className="bg-card backdrop-blur-xl border border-border p-8 rounded-3xl shadow-xl h-full flex flex-col">
                <h2 className="text-3xl font-black mb-6 text-foreground tracking-tight">Daily Tasks</h2>
                <div className="flex gap-3 mb-6">
                    <input
                        type="text"
                        placeholder="New Task..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        className="flex-1 p-4 bg-muted border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary transition-all"
                    />
                    <button onClick={addTask} className="bg-secondary text-black font-bold px-6 py-3 rounded-xl hover:bg-secondary/90 transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                        Add
                    </button>
                </div>
                <ul className="space-y-3 overflow-y-auto flex-grow custom-scrollbar pr-2 max-h-[500px]">
                    {tasks.map(task => (
                        <li key={task._id} className="flex items-center gap-4 p-4 hover:bg-muted rounded-xl transition-all border border-transparent hover:border-border group">
                            <input
                                type="checkbox"
                                checked={task.isCompleted}
                                onChange={() => toggleTask(task._id, task.isCompleted)}
                                className="w-6 h-6 text-secondary rounded focus:ring-secondary bg-muted border-border cursor-pointer"
                            />
                            <span className={`text-lg font-medium transition-all ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                {task.content}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default NotesReminders;
