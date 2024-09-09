import React, { useState, useMemo } from "react";
import "../index.css"; // Import the CSS file for styling

function DataTable({ data, setData }) {
  const [sortConfig, setSortConfig] = useState(null);
  const [groupBy, setGroupBy] = useState(null);
  const [warning, setWarning] = useState("");
  const [budget, setBudget] = useState(0);
  const [distributedTotal, setDistributedTotal] = useState(0);
  const [lockedProjects, setLockedProjects] = useState([]);

  const handleBudgetChange = (newBudget) => {
    setBudget(newBudget);
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    } else if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "descending"
    ) {
      direction = "none";
    }
    setSortConfig({ key, direction });
  };

  const handleResetSort = () => {
    setSortConfig(null);
  };

  const handleGroupBy = (key) => {
    setGroupBy(key);
  };

  const distributeInitialBudget = () => {
    const updatedData = data.map((row) => ({
      ...row,
      "Bu ay ödenecek tutar": Math.max(0, Math.round(budget / data.length)),
    }));
    setData(updatedData);
    const newDistributedTotal = updatedData.reduce(
      (sum, row) => sum + row["Bu ay ödenecek tutar"],
      0
    );
    setDistributedTotal(newDistributedTotal);
    setWarning(""); // Clear warning if everything is okay
  };

  const redistributeBudget = () => {
    const totalRemaining = data.reduce(
      (sum, row) =>
        !lockedProjects.includes(row.index) ? sum + row["Kalan Ödenecek Tutar"] : sum,
      0
    );
    const updatedData = data.map((row, index) => ({
      ...row,
      "Bu ay ödenecek tutar": lockedProjects.includes(index)
        ? row["Bu ay ödenecek tutar"]
        : Math.max(0, Math.round((row["Kalan Ödenecek Tutar"] / totalRemaining) * budget)),
    }));
    setData(updatedData);
    const newDistributedTotal = updatedData.reduce(
      (sum, row) => sum + row["Bu ay ödenecek tutar"],
      0
    );
    setDistributedTotal(newDistributedTotal);
    setWarning(""); // Clear warning if everything is okay
  };

  const handleCellEdit = (index, value) => {
    const newData = [...data];
    const newValue = Number(value);

    // Check if newValue is negative
    if (newValue < 0) {
      setWarning("Negatif değer giremezsiniz!");
      return;
    }

    newData[index]["Bu ay ödenecek tutar"] = newValue;
    setData(newData);

    // Recalculate distributed budget
    const newDistributedTotal = newData.reduce(
      (sum, row) => sum + row["Bu ay ödenecek tutar"],
      0
    );
    setDistributedTotal(newDistributedTotal);

    setWarning(""); // Clear warning if everything is okay
  };

  const handleLockProject = (index) => {
    if (lockedProjects.includes(index)) {
      setLockedProjects(lockedProjects.filter((i) => i !== index));
    } else {
      setLockedProjects([...lockedProjects, index]);
    }
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null && sortConfig.direction !== "none") {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const groupedData = useMemo(() => {
    if (!groupBy) return sortedData;
    const groups = {};
    sortedData.forEach((item, index) => {
      const groupKey = item[groupBy];
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push({ ...item, index });
    });
    return groups;
  }, [sortedData, groupBy]);

  const calculateGroupTotal = (items) => {
    return items.reduce((sum, item) => sum + item["Bu ay ödenecek tutar"], 0);
  };

  return (
    <div>
      {warning && <p style={{ color: "red" }}>{warning}</p>}
      <div className="controls">
        <p>Toplam Bütçe:</p>
        <input
          type="number"
          value={budget}
          onChange={(e) => handleBudgetChange(Number(e.target.value))}
          placeholder="Toplam bütçeyi girin"
        />
        <button onClick={distributeInitialBudget}>Bütçeyi İlk Kez Dağıt</button>
        <button onClick={redistributeBudget}>Bütçeyi Yeniden Dağıt</button>
        <span
          className={`distributed-total ${
            distributedTotal > budget ? "exceed" : ""
          }`}
        >
          Dağıtılan Bütçe: {distributedTotal}
        </span>
      </div>
      <select onChange={(e) => handleGroupBy(e.target.value)}>
        <option value="">Gruplandırma Yok</option>
        {Object.keys(data[0] || {}).map((key) => (
          <option key={key} value={key}>
            {key}
          </option>
        ))}
      </select>
      <table>
        <thead>
          <tr>
            <th></th>
            {Object.keys(data[0] || {}).map((key) => (
              <th key={key}>
                {key}
                <button className="sort-button" onClick={() => handleSort(key)}>
                  {sortConfig && sortConfig.key === key
                    ? sortConfig.direction === "ascending"
                      ? "▲"
                      : sortConfig.direction === "descending"
                        ? "▼"
                        : "⇵"
                    : "⇵"}
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
                    <td></td>
                    <td colSpan={Object.keys(data[0] || {}).length}>
                      <strong>{group}</strong> (Toplam:{" "}
                      {calculateGroupTotal(items)})
                    </td>
                  </tr>
                  {items.map((item, index) => (
                    <tr
                      key={index}
                      style={{
                        backgroundColor:
                          lockedProjects.includes(item.index)
                            ? "#e6e6e6" // Light gray background for locked projects
                            : item["Bu ay ödenecek tutar"] === 0
                              ? "#f8d7da" // Light red background for 0 budget rows
                              : "inherit",
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={lockedProjects.includes(item.index)}
                          onChange={() => handleLockProject(item.index)}
                        />
                      </td>
                      {Object.keys(item).map((key, idx) => (
                        <td key={idx}>
                          {key === "Bu ay ödenecek tutar" ? (
                            <input
                              type="number"
                              title="Bu ay ödenecek tutar"
                              value={item[key]}
                              onChange={(e) =>
                                handleCellEdit(item.index, e.target.value)
                              }
                              disabled={lockedProjects.includes(item.index)}
                            />
                          ) : (
                            item[key]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </React.Fragment>
              ))
            : sortedData.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor:
                      lockedProjects.includes(index)
                        ? "#e6e6e6" // Light gray background for locked projects
                        : item["Bu ay ödenecek tutar"] === 0
                          ? "#f8d7da" // Light red background for 0 budget rows
                          : "inherit",
                  }}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={lockedProjects.includes(index)}
                      onChange={() => handleLockProject(index)}
                    />
                  </td>
                  {Object.keys(item).map((key, idx) => (
                    <td key={idx}>
                      {key === "Bu ay ödenecek tutar" ? (
                        <input
                          type="number"
                          title="Bu ay ödenecek tutar"
                          value={item[key]}
                          onChange={(e) => handleCellEdit(index, e.target.value)}
                          disabled={lockedProjects.includes(index)}
                        />
                      ) : (
                        item[key]
                      )}
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