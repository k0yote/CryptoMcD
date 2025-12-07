import { useState } from 'react';
import { QrCode, X, Upload } from 'lucide-react';

interface QRScannerProps {
  onScan: (address: string) => void;
}

export function QRScanner({ onScan }: QRScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsScanning(true);
      // Simulate QR code scanning
      setTimeout(() => {
        const mockAddress = '0x' + Math.random().toString(16).substring(2, 42).padEnd(40, '0');
        onScan(mockAddress);
        setIsScanning(false);
        setIsOpen(false);
      }, 1500);
    }
  };

  const handleCameraScan = () => {
    setIsScanning(true);
    // Simulate camera scanning
    setTimeout(() => {
      const mockAddress = '0x' + Math.random().toString(16).substring(2, 42).padEnd(40, '0');
      onScan(mockAddress);
      setIsScanning(false);
      setIsOpen(false);
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg transition-colors"
        title="Scan QR Code"
      >
        <QrCode className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-gray-900">Scan QR Code</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {isScanning ? (
              <div className="py-16 text-center">
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Scanning QR code...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Camera Scan */}
                <button
                  onClick={handleCameraScan}
                  className="w-full p-6 border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl transition-colors group"
                >
                  <QrCode className="w-12 h-12 text-gray-400 group-hover:text-indigo-600 mx-auto mb-3 transition-colors" />
                  <p className="text-gray-700 group-hover:text-indigo-600 transition-colors">
                    Open Camera to Scan
                  </p>
                </button>

                {/* Or Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                {/* Upload Image */}
                <label className="block w-full p-6 border-2 border-dashed border-gray-300 hover:border-indigo-500 rounded-xl transition-colors cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Upload className="w-12 h-12 text-gray-400 group-hover:text-indigo-600 mx-auto mb-3 transition-colors" />
                  <p className="text-gray-700 group-hover:text-indigo-600 transition-colors text-center">
                    Upload QR Code Image
                  </p>
                </label>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
