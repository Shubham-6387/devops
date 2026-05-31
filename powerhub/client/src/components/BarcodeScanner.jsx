import React, { useEffect, useRef, useState } from 'react';
import Quagga from 'quagga';

const BarcodeScanner = ({ onDetected }) => {
    const scannerRef = useRef(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (scannerRef.current) {
            Quagga.init(
                {
                    inputStream: {
                        name: 'Live',
                        type: 'LiveStream',
                        target: scannerRef.current,
                        constraints: {
                            width: 640,
                            height: 480,
                            facingMode: 'environment', // Rear camera
                        },
                    },
                    decoder: {
                        readers: ['ean_reader', 'ean_8_reader', 'upc_reader'],
                    },
                },
                (err) => {
                    if (err) {
                        console.error(err);
                        setError('Error initializing camera. Please check permissions.');
                        return;
                    }
                    Quagga.start();
                }
            );

            Quagga.onDetected((data) => {
                onDetected(data.codeResult.code);
                Quagga.stop(); // Stop scanning after detection
            });

            return () => {
                Quagga.stop();
                Quagga.offDetected();
            };
        }
    }, [onDetected]);

    return (
        <div className="relative">
            {error && <div className="text-red-500 mb-2">{error}</div>}
            <div
                ref={scannerRef}
                className="w-full h-64 bg-black rounded-lg overflow-hidden"
            ></div>
            <p className="text-center text-sm text-gray-500 mt-2">
                Point your camera at a food barcode
            </p>
        </div>
    );
};

export default BarcodeScanner;
