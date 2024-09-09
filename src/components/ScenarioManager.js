// src/components/ScenarioManager.js
import React, { useState } from 'react';
import * as XLSX from 'xlsx';

function ScenarioManager({ data, onScenarioSave, onScenarioLoad, onScenarioDelete, scenarios }) {
  const [scenarioName, setScenarioName] = useState('');

  const handleSaveScenario = () => {
    if (scenarioName) {
      onScenarioSave({ name: scenarioName, data: JSON.parse(JSON.stringify(data)) });
      setScenarioName('');
    }
  };

  const handleLoadScenario = (scenario) => {
    onScenarioLoad(JSON.parse(JSON.stringify(scenario.data)));
  };

  const handleDeleteScenario = (index) => {
    onScenarioDelete(index);
  };

  const handleExportScenario = (scenario) => {
    const ws = XLSX.utils.json_to_sheet(scenario.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Scenario");
    XLSX.writeFile(wb, `${scenario.name}.xlsx`);
  };

  return (
    <div>
      <h2>Senaryo Yönetimi</h2>
      <input
        type="text"
        value={scenarioName}
        onChange={(e) => setScenarioName(e.target.value)}
        placeholder="Senaryo Adı"
      />
      <button onClick={handleSaveScenario}>Senaryoyu Kaydet</button>
      <h3>Kaydedilen Senaryolar</h3>
      <ul>
        {scenarios.map((scenario, index) => (
          <li key={index}>
            {scenario.name}
            <button onClick={() => handleLoadScenario(scenario)}>Yükle</button>
            <button onClick={() => handleDeleteScenario(index)}>Sil</button>
            <button onClick={() => handleExportScenario(scenario)}>Excel'e Aktar</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ScenarioManager;