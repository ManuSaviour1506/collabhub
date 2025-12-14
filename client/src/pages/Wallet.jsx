import { useState, useEffect } from 'react';
import api from '../services/api';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('user')).token;
        const { data } = await api.get('/wallet', {
           headers: { Authorization: `Bearer ${token}` }
        });
        setBalance(data.wallet.balance);
        setTransactions(data.transactions);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching wallet", error);
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-6">My Wallet</h2>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-8 rounded-2xl shadow-lg mb-8">
        <p className="text-lg opacity-80">Available Credits</p>
        <h1 className="text-5xl font-bold mt-2">{balance} <span className="text-2xl">CollabCoins</span></h1>
      </div>

      {/* Transaction History */}
      <h3 className="text-xl font-bold mb-4">Transaction History</h3>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? <p className="p-4">Loading...</p> : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((tx) => (
                <tr key={tx._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.type === 'CREDIT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tx.description}</td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.type === 'CREDIT' ? '+' : '-'}{tx.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Wallet;