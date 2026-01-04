import React, { useState, useEffect, useRef } from 'react';
import { Coffee, Wallet, Send, Loader2, Terminal as TerminalIcon, X } from 'lucide-react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { parseEther } from 'viem';
import abiData from './abi.json';

const CONTRACT_ADDRESS = '0x49072199Ca43207500463bf1f562eFe32ce160Df';
const OWNER_ADDRESS = "0xb4daA0837Ac497Fa72913FA8878846b368030E4C";

const App = () => {
  const [memos, setMemos] = useState([]);
  const [logs, setLogs] = useState([]); // New state for live logs
  const [showTerminal, setShowTerminal] = useState(true);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("0.001");

  const { isConnected, address } = useAccount(); 
  const { data: hash, isPending, writeContract } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const logEndRef = useRef(null);

  // Auto-scroll the terminal
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  // WebSocket for Live Logs (Connecting to your Django/Redis stream)
  useEffect(() => {
    const wsUrl = API_URL.replace("http", "ws") + "/ws/logs/";
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs((prev) => [...prev.slice(-15), { ...data, time: new Date().toLocaleTimeString() }]);
    };

    return () => socket.close();
  }, [API_URL]);

  const fetchMemos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/memos/`);
      const data = await res.json();
      setMemos(data);
    } catch (err) {
      addLocalLog("Error fetching memos", "error");
    }
  };

  const addLocalLog = (msg, type) => {
    setLogs(prev => [...prev, { message: msg, type, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    fetchMemos();
    if (isConfirmed) {
        addLocalLog("Transaction Confirmed on Chain!", "success");
        fetchMemos();
    }
  }, [isConfirmed]);

  const handleBuyCoffee = async () => {
    if (!name || !message) return alert("Please fill in fields");
    addLocalLog("Initiating transaction...", "info");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: abiData.abi,
      functionName: 'buyCoffee',
      args: [name, message],
      value: parseEther(amount),
    });
  };

  const handleWithdraw = () => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: abiData.abi,
      functionName: 'withdrawTip',
    });
  };

  return (
    <div className="min-h-screen bg-[#E6D5B8] flex items-center justify-center p-2 sm:p-4 font-sans text-[#3E2723]">
      <div className="bg-[#FAF9F6] w-full max-w-6xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/50 relative">
        
        {/* LIVE TERMINAL LOGS (Absolute positioned overlay) */}
        {showTerminal && (
          <div className="absolute bottom-4 right-4 w-80 bg-black/90 text-green-400 p-3 rounded-lg font-mono text-xs shadow-2xl border border-green-900/50 z-50">
            <div className="flex justify-between mb-2 border-b border-green-900/30 pb-1">
              <span className="flex items-center gap-1"><TerminalIcon size={12}/> INDEXER_LOGS</span>
              <button onClick={() => setShowTerminal(false)}><X size={12}/></button>
            </div>
            <div className="h-32 overflow-y-auto custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className={`mb-1 ${log.type === 'error' ? 'text-red-400' : log.type === 'success' ? 'text-blue-400' : ''}`}>
                  [{log.time}] {log.message}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        )}

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
              <input type="text" placeholder="Your Name" onChange={(e) => setName(e.target.value)} className="w-full p-4 bg-[#F5F5F5] rounded-xl outline-none focus:ring-2 focus:ring-[#6F4E37]" />
              <textarea placeholder="Say something nice..." onChange={(e) => setMessage(e.target.value)} className="w-full p-4 bg-[#F5F5F5] rounded-xl outline-none focus:ring-2 focus:ring-[#6F4E37] h-24" />
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
          
          {address?.toLowerCase() === OWNER_ADDRESS.toLowerCase() && (
            <button onClick={handleWithdraw} className="mt-4 w-full py-3 border-2 border-[#6F4E37] text-[#6F4E37] rounded-xl font-bold hover:bg-[#FDFBF7] transition-all">
              Withdraw Contract Balance 💰
            </button>
          )}
        </div>

        {/* RIGHT SIDE: Wall */}
        <div className="w-full md:w-3/5 p-8 lg:p-12 bg-[#FDFBF7] border-l border-[#EFEBE9]">
          <h2 className="text-2xl font-bold mb-2">Wall of Memos</h2>
          <p className="text-[#8D6E63] mb-8">Recent Supporters</p>

          <div className="space-y-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {memos.length === 0 ? (
              <p className="text-center text-[#A1887F] mt-10 italic">No coffees yet. Be the first!</p>
            ) : (
              memos.map((memo, i) => (
                <div key={i} className="bg-white p-5 rounded-2xl flex items-center justify-between shadow-sm border border-[#F5F5F5] gap-4">
                  <div className="flex items-center gap-4">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${memo.name}`} className="w-12 h-12 bg-[#FFECB3] rounded-full border border-[#FFE082]" alt="avatar" />
                    <div>
                      <h4 className="font-bold text-[#3E2723]">{memo.name}</h4>
                      <p className="text-sm text-[#8D6E63]">{memo.message}</p>
                    </div>
                  </div>
                  <div className="bg-[#FBE9E7] px-3 py-1 rounded-full text-[10px] font-bold text-[#D84315]">
                    {memo.eth_amount && parseFloat(memo.eth_amount) > 0 
                    ? `${parseFloat(memo.eth_amount).toFixed(3)} ETH` 
                    : "0.001 ETH"}
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