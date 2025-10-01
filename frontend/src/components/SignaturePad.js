import React, { useRef, useEffect, useState } from 'react';

const SignaturePad = ({ onSave, onClose }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    
    // Set canvas styles
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setContext(ctx);

    // Clear canvas with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const getTouchPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    if (!context) return;
    
    setIsDrawing(true);
    setIsEmpty(false);
    const pos = e.type.includes('touch') ? getTouchPos(e) : getMousePos(e);
    context.beginPath();
    context.moveTo(pos.x, pos.y);
  };

  const draw = (e) => {
    e.preventDefault();
    if (!isDrawing || !context) return;
    
    const pos = e.type.includes('touch') ? getTouchPos(e) : getMousePos(e);
    context.lineTo(pos.x, pos.y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !context) return;
    
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const signature = canvas.toDataURL('image/png');
    onSave(signature);
  };

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    if (!canvas) return true;
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] !== 0) return false; // If any pixel is not transparent
    }
    return true;
  };

  // Update isEmpty state whenever drawing occurs
  useEffect(() => {
    if (!isDrawing && context) {
      setIsEmpty(isCanvasEmpty());
    }
  }, [isDrawing, context]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#333',
        padding: '2rem',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h3>Sign Report</h3>
        <p style={{ color: '#ccc', marginBottom: '1rem' }}>
          Draw your signature in the box below using your mouse or touch screen:
        </p>
        
        <canvas
          ref={canvasRef}
          width={400}
          height={200}
          style={{
            border: '2px solid #555',
            backgroundColor: '#ffffff',
            cursor: 'crosshair',
            display: 'block',
            margin: '0 auto',
            touchAction: 'none'
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '1rem',
          gap: '1rem'
        }}>
          <button 
            className="btn btn-secondary" 
            onClick={clearSignature}
            style={{ flex: 1 }}
          >
            Clear
          </button>
          <button 
            className="btn btn-primary" 
            onClick={saveSignature}
            disabled={isEmpty}
            style={{ flex: 1 }}
          >
            Save Signature
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;