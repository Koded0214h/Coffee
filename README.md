# ☕ Coffee dApp: Decentralized Support Platform

A full-stack Web3 application that allows users to "Buy me a Coffee" by sending ETH on the Sepolia Testnet. This project uses a **Hybrid Architecture**: blockchain for transactions and permanence, and a Django-based "Indexer" for high-performance data retrieval.

---

## ✨ Features

* **Direct ETH Transfers:** Tips go directly to the smart contract, with a secure withdrawal pattern for the owner.
* **On-Chain Memos:** Every coffee includes a name and message stored permanently on the Ethereum blockchain.
* **Fast Indexing:** A custom Python background worker listens for blockchain events and saves them to a database.
* **Real-Time UI:** Built with React and Tailwind CSS, featuring a "Wall of Memos" that loads instantly via REST API.
* **Responsive Design:** Fully mobile-friendly UI with unique avatars for every supporter.

---

## 🚀 Tech Stack

* **Frontend:** React, Vite, Tailwind CSS, [Wagmi](https://wagmi.sh/), [RainbowKit](https://www.rainbowkit.com/)
* **Backend:** Django, Django REST Framework, [Web3.py](https://web3py.readthedocs.io/)
* **Smart Contract:** Solidity (OpenZeppelin Ownable)
* **Infrastructure:** Alchemy (WebSocket RPC), Vercel (Frontend Hosting), Render (Backend Hosting)

---

## 🏗️ How It Works

Most dApps are slow because they fetch data directly from the blockchain every time a user loads the page. This app is different:

1. **User Sends Coffee:** The user triggers a transaction via MetaMask.
2. **Contract Emits Event:** The Solidity contract emits a `newMemo` event.
3. **Indexer Picks It Up:** The Django background worker (`listen.py`) sees the event via a WebSocket.
4. **Database Storage:** The memo is saved to the database.
5. **API Delivery:** The frontend fetches the memos from the Django API in milliseconds.

---

## 🛠️ Installation & Setup

### 1. Prerequisites

* Python 3.10+
* Node.js 18+
* An [Alchemy](https://www.alchemy.com/) API Key (Sepolia WebSocket)

### 2. Backend Setup

1. Navigate to the backend folder:
```bash
cd backend
```


2. Install dependencies:
```bash
pip install -r requirements.txt
```


3. Create a `.env` file and add your credentials:
```env
ALCHEMY_API_KEY=your_alchemy_websocket_key
CONTRACT_ADDRESS=0x49072199Ca43207500463bf1f562eFe32ce160Df
```


4. **Start the whole backend system:**
```bash
sh run.sh
```

*This single command runs database migrations, starts the blockchain event listener, and launches the Django API server.*

### 3. Frontend Setup

1. Navigate to the frontend folder:
```bash
cd frontend
```


2. Install dependencies:
```bash
npm install
```


3. Create a `.env` file:
```env
VITE_API_URL=http://127.0.0.1:8000
```


4. Start the development server:
```bash
npm run dev
```

---

## 🔒 Smart Contract Security

The contract uses the **Withdrawal Pattern**. ETH sent by supporters is held in the contract. Only the `owner` (the deployer) can call the `withdrawTip()` function to transfer the accumulated balance to their personal wallet.

---

## 📝 License

This project is licensed under the MIT License.

---

### Deployment Links

* **Frontend:** [https://coffee-five-psi.vercel.app/](https://coffee-five-psi.vercel.app/)
* **Contract Address:** `0x49072199Ca43207500463bf1f562eFe32ce160Df` (Sepolia)

