import './App.css'
import { useState } from 'react'
import CSVReader from './components/CSVReader';
import DataDisplay from './components/DataDisplay';

function App() {

  const [inputData, setInputData] = useState([]);

  return (
    <>
      <CSVReader setInputData={setInputData}/>
      <DataDisplay inputData={inputData}/>
    </>
  )
}

export default App
