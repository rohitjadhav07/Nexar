import React from 'react'

function App() {
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Nexar - Test</h1>
      <p>If you can see this, React is working!</p>
      <button onClick={() => alert('Button works!')}>
        Test Button
      </button>
    </div>
  )
}

export default App
