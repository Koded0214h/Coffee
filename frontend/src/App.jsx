import React, { useState, useEffect } from 'react';
import { Coffee, Wallet, Send, Loader2 } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther } from 'viem';
import abiData from './abi.json';

const CONTRACT_ADDRESS = '0x49072199Ca43207500463bf1f562eFe32ce160Df';

const App = () => {
  const [memos, setMemos] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("0.001");

  const { isConnected } = useAccount();
  const { data: hash, error, isPending, writeContract } = useWriteContract();

  // This hook tracks the transaction progress
  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ hash });

  // 1. Fetch Memos from Django

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const fetchMemos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/memos/`);
      const data = await res.json();
      setMemos(data);
    } catch (err) {
      console.error("Django API Error:", err);
    }
  };

  useEffect(() => {
    fetchMemos();
    // Refresh list when a transaction is confirmed
    if (isConfirmed) fetchMemos();
  }, [isConfirmed]);

  // 2. Buy Coffee Function
  const handleBuyCoffee = async () => {
    if (!name || !message) return alert("Please fill in fields");
    
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: abiData.abi,
      functionName: 'buyCoffee',
      args: [name, message],
      value: parseEther(amount),
    });
  };

  return (
    <div className="min-h-screen bg-[#E6D5B8] flex items-center justify-center p-2 sm:p-4 font-sans text-[#3E2723]">
      <div className="bg-[#FAF9F6] w-full max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/50">
        
        {/* LEFT SIDE: Form */}
        <div className="w-full md:w-2/5 p-8 md:p-12 bg-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-12">
              <div className="w-12 h-12 bg-[#D7CCC8] rounded-full overflow-hidden border-2 border-[#6F4E37]">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=Felix`} alt="avatar" />
              </div>
              <ConnectButton chainStatus="none" showBalance={false} />
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight mb-2 uppercase">Buy me a Coffee</h1>
            <div className="h-1 w-16 bg-[#A1887F] mb-8 rounded-full"></div>

            <p className="text-[#8D6E63] font-medium mb-6">Show some love!</p>
            
            <div className="flex gap-3 mb-8">
              {["0.001", "0.003", "0.005"].map((val) => (
                <button 
                  key={val} 
                  onClick={() => setAmount(val)}
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all font-bold text-sm ${amount === val ? 'border-[#6F4E37] bg-[#6F4E37] text-white' : 'border-[#D7CCC8]'}`}
                >
                  {val}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Your Name"
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-[#F5F5F5] rounded-xl outline-none focus:ring-2 focus:ring-[#6F4E37]"
              />
              <textarea 
                placeholder="Say something nice..."
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-4 bg-[#F5F5F5] rounded-xl outline-none focus:ring-2 focus:ring-[#6F4E37] h-24"
              />
            </div>
          </div>

          <button 
            disabled={!isConnected || isPending || isConfirming}
            onClick={handleBuyCoffee}
            className="w-full mt-8 py-4 bg-[#6F4E37] text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#4E342E] transition-all shadow-lg disabled:opacity-50"
          >
            {isPending || isConfirming ? <Loader2 className="animate-spin" /> : <Coffee size={20} />}
            {isConfirming ? "CONFIRMING..." : `SEND ${amount} ETH`}
          </button>
        </div>

        {/* RIGHT SIDE: Wall */}
        <div className="w-full md:w-3/5 p-4 sm:p-6 md:p-8 lg:p-12 bg-[#FDFBF7] border-l border-[#EFEBE9]">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">Wall of Memos</h2>
          <p className="text-[#8D6E63] mb-6 sm:mb-8">Recent Supporters</p>

          <div className="space-y-3 sm:space-y-4 h-[400px] sm:h-[500px] md:h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {memos.length === 0 ? (
              <p className="text-center text-[#A1887F] mt-8 sm:mt-10 italic">No coffees yet. Be the first!</p>
            ) : (
              memos.map((memo, i) => (
                <div key={i} className="bg-white p-3 sm:p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm border border-[#F5F5F5] gap-2 sm:gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${memo.name}`}
                      className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FFECB3] rounded-full border border-[#FFE082] flex-shrink-0"
                      alt="avatar"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[#3E2723] truncate">{memo.name}</h4>
                      <p className="text-xs sm:text-sm text-[#8D6E63] line-clamp-2">{memo.message}</p>
                    </div>
                  </div>
                  <div className="bg-[#FBE9E7] px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold text-[#D84315] flex-shrink-0">
                    {memo.eth_amount || "0.001"} ETH
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;