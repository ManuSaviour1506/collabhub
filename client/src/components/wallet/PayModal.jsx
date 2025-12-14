import { useState } from 'react';
import api from '../../services/api';

const PayModal = ({ receiverId, receiverName, onClose }) => {
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = JSON.parse(localStorage.getItem('user')).token;
      
      // Call the Transfer Endpoint we built in Step 4
      const { data } = await api.post('/wallet/transfer', 
        { receiverId, amount: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ type: 'success', text: `Successfully sent ${amount} coins!` });
      setTimeout(() => onClose(), 2000); // Close after 2s
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Transaction failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800">✕</button>
        
        <h2 className="text-xl font-bold mb-4 text-gray-800">Pay {receiverName}</h2>
        <p className="text-sm text-gray-600 mb-4">Send CollabCoins for their help or mentorship.</p>

        {message && (
          <div className={`p-2 mb-4 text-sm rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handlePay}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2 font-bold">Amount</label>
            <input 
              type="number" 
              min="1" 
              className="w-full border p-2 rounded focus:ring-2 focus:ring-yellow-500 outline-none"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-500 text-white font-bold py-2 rounded hover:bg-yellow-600 transition disabled:bg-gray-300"
          >
            {loading ? 'Processing...' : `Send ${amount} Coins`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PayModal;