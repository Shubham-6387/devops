import { useState } from 'react';
import BarcodeScanner from '../components/BarcodeScanner';
import scanService from '../services/scanService';

const ScanFood = () => {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const startScan = () => {
        setScanning(true);
        setResult(null);
        setError(null);
    };

    const handleDetected = async (barcode) => {
        setScanning(false);
        setLoading(true);
        try {
            const data = await scanService.scanBarcode(barcode);
            setResult(data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch product data');
        } finally {
            setLoading(false);
        }
    };

    const manualSearch = async (e) => {
        e.preventDefault();
        const barcode = e.target.barcode.value;
        if (barcode) {
            await handleDetected(barcode);
        }
    };

    return (
        <div className="min-h-screen pb-24">
            <div className="max-w-2xl mx-auto p-4">
                <h1 className="text-4xl font-black text-foreground mb-8 text-center tracking-tight">
                    Scan Food
                </h1>

                {/* Controls */}
                <div className="bg-card backdrop-blur-xl border border-border p-8 rounded-3xl shadow-2xl mb-8">
                    {!scanning && !loading && !result && (
                        <div className="text-center">
                            <button
                                onClick={startScan}
                                className="bg-primary text-black font-bold py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:bg-primary/90 transition duration-300 w-full md:w-auto mb-6 transform hover:scale-105"
                            >
                                Scan Barcode
                            </button>
                            <div className="relative flex py-5 items-center">
                                <div className="flex-grow border-t border-border"></div>
                                <span className="flex-shrink mx-4 text-muted-foreground font-medium">OR</span>
                                <div className="flex-grow border-t border-border"></div>
                            </div>
                            <form onSubmit={manualSearch} className="flex gap-3">
                                <input
                                    type="text"
                                    name="barcode"
                                    placeholder="Enter barcode manually"
                                    className="flex-1 p-3 bg-muted border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                />
                                <button
                                    type="submit"
                                    className="bg-muted text-foreground px-6 py-3 rounded-xl hover:bg-muted/80 font-bold transition-all border border-border"
                                >
                                    Go
                                </button>
                            </form>
                        </div>
                    )}

                    {scanning && (
                        <div className="rounded-xl overflow-hidden border border-primary/50 shadow-[0_0_30px_rgba(204,255,0,0.1)]">
                            <BarcodeScanner onDetected={handleDetected} />
                        </div>
                    )}

                    {loading && (
                        <div className="text-center py-10">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mx-auto mb-4"></div>
                            <p className="text-muted-foreground animate-pulse">Analyzing Nutrition...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-center">
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-6 py-4 rounded-xl relative mb-4">
                                {error}
                            </div>
                            <button
                                onClick={() => { setError(null); setResult(null); }}
                                className="text-primary hover:text-primary/80 font-bold underline decoration-2 underline-offset-4"
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                </div>

                {/* Results */}
                {result && (
                    <div className="bg-card backdrop-blur-xl border border-border p-6 rounded-3xl shadow-2xl animate-fade-in">
                        <div className="flex flex-col md:flex-row gap-8">
                            {/* Product Info */}
                            <div className="md:w-1/3">
                                {result.imageUrl ? (
                                    <div className="bg-white rounded-xl p-4 shadow-inner">
                                        <img src={result.imageUrl} alt={result.productName} className="w-full h-auto object-contain mix-blend-multiply" />
                                    </div>
                                ) : (
                                    <div className="w-full h-40 bg-muted rounded-xl flex items-center justify-center text-muted-foreground border border-border">No Image</div>
                                )}
                            </div>

                            {/* Analysis */}
                            <div className="md:w-2/3">
                                <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">{result.productName}</h2>
                                <p className="text-sm text-muted-foreground mb-6 font-mono">Barcode: {result.barcode}</p>

                                {/* Health Score */}
                                {result.nutritionAvailable ? (
                                    <div className="flex items-center mb-8 bg-muted p-4 rounded-2xl border border-border">
                                        <div className={`
                                        w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-black text-black shadow-lg mr-6
                                        ${result.healthScore >= 70 ? 'bg-green-400 shadow-green-400/20' : result.healthScore >= 40 ? 'bg-yellow-400 shadow-yellow-400/20' : 'bg-red-400 shadow-red-400/20'}
                                    `}>
                                            {result.healthScore}
                                        </div>
                                        <div>
                                            <p className="font-bold text-muted-foreground text-sm uppercase tracking-wider mb-1">Health Score</p>
                                            <p className="text-lg font-medium text-foreground">
                                                {result.healthScore >= 70 ? 'Excellent Choice 🚀' : result.healthScore >= 40 ? 'Moderate 👍' : 'Unhealthy ⚠️'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center mb-8 bg-muted p-4 rounded-2xl border border-border">
                                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-lg mr-6 bg-gray-600">
                                            N/A
                                        </div>
                                        <div>
                                            <p className="font-bold text-muted-foreground text-sm uppercase tracking-wider mb-1">Health Score</p>
                                            <p className="text-lg font-medium text-muted-foreground">Insufficient Data</p>
                                        </div>
                                    </div>
                                )}

                                {/* Warnings */}
                                {result.warnings.length > 0 && (
                                    <div className="mb-8">
                                        {result.warnings.map((warning, index) => (
                                            <span key={index} className="inline-flex items-center bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-1.5 rounded-full font-bold tracking-wide mr-2 mb-2">
                                                ⚠️ {warning}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Nutrition Facts */}
                                {result.nutritionAvailable ? (
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="bg-muted p-4 rounded-xl border border-border">
                                            <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-1">Calories</span>
                                            <span className="font-black text-xl text-foreground">{result.calories} <span className="text-xs font-normal text-muted-foreground">kcal</span></span>
                                        </div>
                                        <div className="bg-muted p-4 rounded-xl border border-border">
                                            <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-1">Protein</span>
                                            <span className="font-black text-xl text-primary">{result.protein}g</span>
                                        </div>
                                        <div className="bg-muted p-4 rounded-xl border border-border">
                                            <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-1">Sugar</span>
                                            <span className="font-black text-xl text-foreground">{result.sugar}g</span>
                                        </div>
                                        <div className="bg-muted p-4 rounded-xl border border-border">
                                            <span className="block text-muted-foreground text-xs uppercase tracking-wider mb-1">Fat</span>
                                            <span className="font-black text-xl text-foreground">{result.fat}g</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-muted p-6 rounded-xl border border-border text-center text-muted-foreground text-sm">
                                        Nutrition data currently unavailable for this product.
                                    </div>
                                )}

                                <button
                                    onClick={() => setResult(null)}
                                    className="mt-8 w-full bg-muted text-foreground font-bold py-4 px-6 rounded-xl hover:bg-muted/80 transition duration-300 border border-border"
                                >
                                    Scan Another Product
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScanFood;
