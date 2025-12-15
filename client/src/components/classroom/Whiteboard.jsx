import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// Determine API URL based on environment
const ENDPOINT = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL.replace('/api', '') 
  : "http://localhost:5001";

const Whiteboard = ({ roomId, user }) => {
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [selectedColor, setSelectedColor] = useState('black');

  useEffect(() => {
    // 1. Init Socket
    socketRef.current = io(ENDPOINT);
    socketRef.current.emit("join room", roomId);

    // 2. Init Canvas
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set Canvas Size dynamically
    const setCanvasSize = () => {
        canvas.width = canvas.parentElement.offsetWidth || window.innerWidth * 0.8;
        canvas.height = 600;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Configuration
    let drawing = false;
    let current = { x: 0, y: 0 };

    // --- DRAWING FUNCTIONS ---
    const drawLine = (x0, y0, x1, y1, color, emit) => {
      context.beginPath();
      context.moveTo(x0, y0);
      context.lineTo(x1, y1);
      context.strokeStyle = color;
      context.lineWidth = 3;
      context.lineCap = 'round'; // Makes lines smoother
      context.stroke();
      context.closePath();

      if (!emit) return;
      
      const w = canvas.width;
      const h = canvas.height;

      socketRef.current.emit('drawing', {
        x0: x0 / w,
        y0: y0 / h,
        x1: x1 / w,
        y1: y1 / h,
        color,
        room: roomId
      });
    };

    // --- EVENT LISTENERS (FIXED) ---
    const onMouseDown = (e) => {
      drawing = true;
      // FIX: Use e.offsetX instead of e.nativeEvent.offsetX
      current.x = e.offsetX;
      current.y = e.offsetY;
    };

    const onMouseMove = (e) => {
      if (!drawing) return;
      
      // FIX: Use e.offsetX instead of e.nativeEvent.offsetX
      drawLine(
        current.x, 
        current.y, 
        e.offsetX, 
        e.offsetY, 
        selectedColor, 
        true
      );
      current.x = e.offsetX;
      current.y = e.offsetY;
    };

    const onMouseUp = (e) => {
      if (!drawing) return;
      drawing = false;
      
      // FIX: Use e.offsetX instead of e.nativeEvent.offsetX
      drawLine(
        current.x, 
        current.y, 
        e.offsetX, 
        e.offsetY, 
        selectedColor, 
        true
      );
    };

    // --- SOCKET LISTENERS ---
    const onDrawingEvent = (data) => {
      const w = canvas.width;
      const h = canvas.height;
      drawLine(data.x0 * w, data.y0 * h, data.x1 * w, data.y1 * h, data.color);
    };

    const onClearEvent = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };

    // Attach Listeners
    canvas.addEventListener('mousedown', onMouseDown, false);
    canvas.addEventListener('mouseup', onMouseUp, false);
    canvas.addEventListener('mouseout', onMouseUp, false);
    canvas.addEventListener('mousemove', onMouseMove, false);

    // Socket Events
    socketRef.current.on('drawing', onDrawingEvent);
    socketRef.current.on('clear board', onClearEvent);

    // Cleanup
    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseout', onMouseUp);
      canvas.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', setCanvasSize);
      socketRef.current.disconnect();
    };
  }, [roomId, selectedColor]); // Re-run if room or color changes

  const clearBoard = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    socketRef.current.emit('clear board', roomId);
  };

  return (
    <div className="flex flex-col items-center w-full">
      
      {/* Tools */}
      <div className="flex gap-4 mb-4 bg-white p-2 rounded shadow border">
        {['black', 'red', 'green', 'blue', 'orange'].map(color => (
          <div 
            key={color}
            onClick={() => setSelectedColor(color)}
            className={`w-8 h-8 rounded-full cursor-pointer border border-gray-200 ${selectedColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
            style={{ backgroundColor: color }}
          />
        ))}
        <button onClick={clearBoard} className="ml-4 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
          Clear Board
        </button>
      </div>

      {/* Canvas */}
      <canvas 
        ref={canvasRef} 
        className="bg-white shadow-lg rounded cursor-crosshair border border-gray-300 touch-none w-full"
        style={{ maxWidth: '100%', height: '600px' }}
      />
    </div>
  );
};

export default Whiteboard;