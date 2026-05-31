import React from 'react';

const ExerciseCard = ({ exercise, onSelect, onAdd }) => {
    return (
        <div className="bg-card backdrop-blur-xl rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border border-border group">
            {exercise.gifUrl && (
                <div className="relative overflow-hidden">
                    <img src={exercise.gifUrl} alt={exercise.name} className="w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                </div>
            )}
            <div className="p-6 relative">
                <h3 className="text-xl font-black mb-3 text-foreground tracking-tight">{exercise.name}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-primary/20 text-primary border border-primary/20 text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wider">{exercise.category}</span>
                    <span className="bg-secondary/20 text-secondary border border-secondary/20 text-xs px-3 py-1 rounded-full uppercase font-bold tracking-wider">{exercise.difficulty}</span>
                </div>
                <p className="text-muted-foreground text-sm mb-2"><strong className="text-foreground">Muscles:</strong> {exercise.targetMuscles.join(', ')}</p>
                <p className="text-muted-foreground text-sm mb-4"><strong className="text-foreground">Equipment:</strong> {exercise.equipment}</p>
                {exercise.gifUrl && exercise.gifUrl.includes('placehold.co') && (
                    <p className="text-xs text-muted-foreground italic mb-4">* Animation coming soon</p>
                )}

                {onAdd && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onAdd(exercise); }}
                        className="w-full mb-3 bg-green-500/20 text-green-400 border border-green-500/50 py-3 rounded-xl font-bold hover:bg-green-500/30 transition duration-300 shadow-[0_0_15px_rgba(0,255,0,0.1)]"
                    >
                        Add to Workout +
                    </button>
                )}

                {onSelect && (
                    <button
                        onClick={() => onSelect(exercise)}
                        className="w-full bg-primary text-black py-3 rounded-xl font-bold hover:bg-primary/90 transition duration-300 shadow-[0_0_15px_rgba(204,255,0,0.2)]"
                    >
                        View Details
                    </button>
                )}
            </div>
        </div>
    );
};

export default ExerciseCard;
