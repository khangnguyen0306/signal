import { useState } from 'react';
import './App.css';
import SignContract from './page/sign'; 

function App() {
  return (
    <div style={{ marginTop: '50px', textAlign: 'center',display:'flex', justifyContent:'center',flexDirection:'column',alignItems:'center',width:'100vw' }}>
      <h1>Ứng dụng ký hợp đồng</h1>
      <SignContract contractId="12345" /> 
    </div>
  );
}

export default App;