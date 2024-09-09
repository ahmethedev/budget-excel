// src/components/DataTable.js
import React, { useState, useMemo } from 'react';

function DataTable({ data, setData, budget }) {
  const [sortConfig, setSortConfig] = useState(null);
  const [groupBy, setGroupBy] = useState(null);
  const [warning, setWarning] = useState("");

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleResetSort = () => {
    setSortConfig(null);
  };

  const handleGroupBy = (key) => {
    setGroupBy(key);
  };

  const distributeBudget = () => {
    const totalRemaining = data.reduce((sum, row) => sum + row['Kalan Ödenecek Tutar'], 0);
    const updatedData = data.map(row => ({
      ...row,
      "Bu ay ödenecek tutar": Math.max(0, Math.round((row['Kalan Ödenecek Tutar'] / totalRemaining) * budget))
    }));
    setData(updatedData);
  };

  const handleCellEdit = (index, value) => {
    const newData = [...data];
    const newValue = Number(value);
    
    // Check if newValue is negative
    if (newValue < 0) {
      setWarning("Negatif değer giremezsiniz!");
      return;
    }

    const totalAmountExcludingCurrent = newData.reduce((acc, item, idx) => {
      return idx === index ? acc : acc + item["Bu ay ödenecek tutar"];
    }, 0);

    if (totalAmountExcludingCurrent + newValue > budget) {
      setWarning("Toplam tutar, bütçeyi aşamaz!");
      return;
    }

    newData[index]["Bu ay ödenecek tutar"] = newValue;
    setData(newData);
    setWarning(""); // Clear warning if everything is okay
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const groupedData = useMemo(() => {
    if (!groupBy) return sortedData;
    const groups = {};
    sortedData.forEach(item => {
      const groupKey = item[groupBy];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    });
    return groups;
  }, [sortedData, groupBy]);

  const calculateGroupTotal = (items) => {
    return items.reduce((sum, item) => sum + item["Bu ay ödenecek tutar"], 0);
  };

  return (
    <div>
      {warning && <p style={{ color: 'red' }}>{warning}</p>}
      <button onClick={distributeBudget}>Bütçeyi Dağıt</button>
      <select onChange={(e) => handleGroupBy(e.target.value)}>
        <option value="">Gruplandırma Yok</option>
        {Object.keys(data[0] || {}).map(key => (
          <option key={key} value={key}>{key}</option>
        ))}
      </select>
      <button onClick={handleResetSort}>Sıralamayı Sıfırla</button>
      <table>
        <thead>
          <tr>
            {Object.keys(data[0] || {}).map(key => (
              <th key={key}>
                {key}
                <button className="sort-button" onClick={() => handleSort(key)}>
                  {sortConfig && sortConfig.key === key
                    ? sortConfig.direction === 'ascending' ? '▲' : '▼'
                    : '⇵'}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groupBy
            ? Object.entries(groupedData).map(([group, items]) => (
                <React.Fragment key={group}>
                  <tr className="group-header">
                    <td colSpan={Object.keys(data[0] || {}).length}>
                      <strong>{group}</strong> (Toplam: {calculateGroupTotal(items)})
                    </td>
                  </tr>
                  {items.map((item, index) => (
                    <tr key={index}>
                      {Object.keys(item).map((key, idx) => (
                        <td key={idx}>
                          {key === "Bu ay ödenecek tutar"
                            ? <input
                                type="number"
                                value={item[key]}
                                onChange={(e) => handleCellEdit(index, e.target.value)}
                              />
                            : item[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))
            : sortedData.map((item, index) => (
                <tr key={index}>
                  {Object.keys(item).map((key, idx) => (
                    <td key={idx}>
                      {key === "Bu ay ödenecek tutar"
                        ? <input
                            type="number"
                            value={item[key]}
                            onChange={(e) => handleCellEdit(index, e.target.value)}
                          />
                        : item[key]}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
