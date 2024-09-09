import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Use Routes instead of Switch
import ExcelImport from './components/ExcelImport';
import DataTable from './components/DataTable';
import ChartVisualization from './components/ChartVisualization';
import ScenarioManager from './components/ScenarioManager';
import './index.css';

function App() {
  const [data, setData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [budget, setBudget] = useState(0);
  const [scenarios, setScenarios] = useState([]);

  const handleDataImport = (importedData) => {
    setData(importedData);
    setOriginalData(JSON.parse(JSON.stringify(importedData)));
  };


  const handleScenarioSave = (scenario) => {
    setScenarios([...scenarios, scenario]);
  };

  const handleScenarioLoad = (scenarioData) => {
    setData(scenarioData);
  };

  const handleScenarioDelete = (index) => {
    const newScenarios = scenarios.filter((_, i) => i !== index);
    setScenarios(newScenarios);
  };

  const handleResetToOriginal = () => {
    setData(JSON.parse(JSON.stringify(originalData)));
  };

  return (
    <Router>
      <div className="App">

        <Routes> {/* Use Routes instead of Switch */}
          <Route 
            exact 
            path="/" 
            element={
              <>
                <ExcelImport onDataImport={handleDataImport} />
                {data && (
                  <>

                    <div className="table-container">
                    <DataTable 
                      data={data} 
                      setData={setData}
                      budget={budget} 
                    />
                    </div>

                    <ChartVisualization data={data} setData={setData} budget={budget} />

                    <ScenarioManager
                      data={data}
                      onScenarioSave={handleScenarioSave}
                      onScenarioLoad={handleScenarioLoad}
                      onScenarioDelete={handleScenarioDelete}
                      scenarios={scenarios}
                    />
                    <button onClick={handleResetToOriginal}>Orjinaline Dön</button>
                  </>
                )}
              </>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
