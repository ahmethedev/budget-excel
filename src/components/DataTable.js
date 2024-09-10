import React, { useState, useMemo, useCallback, useEffect } from "react";
import "../index.css";

function DataTable({ data, setData, budget, setBudget, distributedTotal, setDistributedTotal }) {
  const [sortConfig, setSortConfig] = useState(null);
  const [groupBy, setGroupBy] = useState(null);
  const [warning, setWarning] = useState("");
  const [lockedProjects, setLockedProjects] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [pinnedZeroProjects, setPinnedZeroProjects] = useState(false);

  const handleSort = useCallback((key) => {
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
  }, [sortConfig]);

  const handleResetSort = () => {
    setSortConfig(null);
  };

  const handleGroupBy = (key) => {
    setGroupBy(key);
    setSelectAll(false);
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
    setWarning("");
  };

  const redistributeBudget = () => {
    const unlockedProjects = data.filter((_, index) => !lockedProjects.includes(index));
    const totalUnlockedBudget = unlockedProjects.reduce(
      (sum, row) => sum + row["Kalan Ödenecek Tutar"],
      0
    );
    
    let remainingBudget = budget;
    
    const updatedData = data.map((row, index) => {
      if (lockedProjects.includes(index)) {
        remainingBudget -= row["Bu ay ödenecek tutar"];
        return row;
      } else {
        return { ...row, "Bu ay ödenecek tutar": 0 };
      }
    });

    for (let i = 0; i < updatedData.length; i++) {
      if (!lockedProjects.includes(i)) {
        const share = (updatedData[i]["Kalan Ödenecek Tutar"] / totalUnlockedBudget) * remainingBudget;
        updatedData[i]["Bu ay ödenecek tutar"] = Math.round(share);
        remainingBudget -= Math.round(share);
      }
    }

    // Distribute any remaining budget due to rounding
    let index = 0;
    while (remainingBudget > 0) {
      if (!lockedProjects.includes(index)) {
        updatedData[index]["Bu ay ödenecek tutar"] += 1;
        remainingBudget -= 1;
      }
      index = (index + 1) % updatedData.length;
    }

    setData(updatedData);
    const newDistributedTotal = updatedData.reduce(
      (sum, row) => sum + row["Bu ay ödenecek tutar"],
      0
    );
    setDistributedTotal(newDistributedTotal);
    setWarning("");
  };

  const handleCellEdit = (index, value, isGroupTotal = false) => {
    const newData = [...data];
    const newValue = Number(value);

    if (newValue < 0) {
      setWarning("Negatif değer giremezsiniz!");
      return;
    }

    if (isGroupTotal) {
      const groupItems = newData.filter(item => item[groupBy] === index);
      const oldGroupTotal = groupItems.reduce((sum, item) => sum + item["Bu ay ödenecek tutar"], 0);
      
      if (oldGroupTotal === 0 && newValue > 0) {
        const unlockedItems = groupItems.filter((item) => !lockedProjects.includes(data.indexOf(item)));
        const itemCount = unlockedItems.length;
        const valuePerItem = Math.floor(newValue / itemCount);
        const remainder = newValue % itemCount;
        
        unlockedItems.forEach((item, i) => {
          const itemIndex = data.indexOf(item);
          newData[itemIndex]["Bu ay ödenecek tutar"] = valuePerItem + (i < remainder ? 1 : 0);
        });
      } else if (newValue === 0) {
        groupItems.forEach((item) => {
          const itemIndex = data.indexOf(item);
          if (!lockedProjects.includes(itemIndex)) {
            newData[itemIndex]["Bu ay ödenecek tutar"] = 0;
          }
        });
      } else {
        const ratio = newValue / oldGroupTotal;
        groupItems.forEach((item) => {
          const itemIndex = data.indexOf(item);
          if (!lockedProjects.includes(itemIndex)) {
            newData[itemIndex]["Bu ay ödenecek tutar"] = Math.round(item["Bu ay ödenecek tutar"] * ratio);
          }
        });
      }
    } else {
      newData[index]["Bu ay ödenecek tutar"] = newValue;
    }

    setData(newData);

    const newDistributedTotal = newData.reduce(
      (sum, row) => sum + row["Bu ay ödenecek tutar"],
      0
    );
    setDistributedTotal(newDistributedTotal);

    setWarning("");
  };

  const handleLockProject = (index) => {
    setLockedProjects(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setLockedProjects(data.map((_, index) => index));
    } else {
      setLockedProjects([]);
    }
  };

  const handleSelectAllGroup = (groupItems) => {
    const groupIndexes = groupItems.map(item => data.indexOf(item));
    const allSelected = groupIndexes.every(index => lockedProjects.includes(index));
    
    if (allSelected) {
      setLockedProjects(prev => prev.filter(index => !groupIndexes.includes(index)));
    } else {
      setLockedProjects(prev => [...new Set([...prev, ...groupIndexes])]);
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

    if (pinnedZeroProjects) {
      sortableItems.sort((a, b) => {
        if (a["Bu ay ödenecek tutar"] === 0 && b["Bu ay ödenecek tutar"] !== 0) {
          return -1;
        }
        if (a["Bu ay ödenecek tutar"] !== 0 && b["Bu ay ödenecek tutar"] === 0) {
          return 1;
        }
        return 0;
      });
    }

    return sortableItems;
  }, [data, sortConfig, pinnedZeroProjects]);

  const groupedData = useMemo(() => {
    if (!groupBy) return sortedData;
    const groups = {};
    sortedData.forEach((item) => {
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

  const togglePinZeroProjects = () => {
    setPinnedZeroProjects(!pinnedZeroProjects);
  };

  const isSorted = sortConfig && sortConfig.direction !== "none";

  return (
    <div>
      {warning && <p style={{ color: "red" }}>{warning}</p>}
      <div className="controls">
        <p>Toplam Bütçe:</p>
        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(Number(e.target.value))}
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
        <button onClick={togglePinZeroProjects}>
          {pinnedZeroProjects ? "Sıfır Projeleri Çöz" : "Sıfır Projeleri Pinle"}
        </button>
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
            <th>
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAll}
              />
            </th>
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
                    <td>
                      <input
                        type="checkbox"
                        checked={items.every(item => lockedProjects.includes(data.indexOf(item)))}
                        onChange={() => handleSelectAllGroup(items)}
                      />
                    </td>
                    <td colSpan={Object.keys(data[0] || {}).length - 1}>
                      <strong>{group}</strong>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={calculateGroupTotal(items)}
                        onChange={(e) => handleCellEdit(group, e.target.value, true)}
                        disabled={items.every(item => lockedProjects.includes(data.indexOf(item))) || isSorted}
                      />
                    </td>
                  </tr>
                  {items.map((item) => {
                    const index = data.indexOf(item);
                    return (
                      <tr
                        key={index}
                        style={{
                          backgroundColor:
                            lockedProjects.includes(index)
                              ? "#e6e6e6"
                              : item["Bu ay ödenecek tutar"] === 0
                                ? "#f8d7da"
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
                        {Object.keys(item).map((key) => (
                          <td key={key}>
                            {key === "Bu ay ödenecek tutar" ? (
                              <input
                                type="number"
                                title="Bu ay ödenecek tutar"
                                value={item[key]}
                                onChange={(e) =>
                                  handleCellEdit(index, e.target.value)
                                }
                                disabled={lockedProjects.includes(index) || isSorted}
                              />
                            ) : (
                              item[key]
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            : sortedData.map((item, index) => (
                <tr
                  key={index}
                  style={{
                    backgroundColor:
                      lockedProjects.includes(index)
                        ? "#e6e6e6"
                        : item["Bu ay ödenecek tutar"] === 0
                          ? "#f8d7da"
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
                  {Object.keys(item).map((key) => (
                    <td key={key}>
                      {key === "Bu ay ödenecek tutar" ? (
                        <input
                          type="number"
                          title="Bu ay ödenecek tutar"
                          value={item[key]}
                          onChange={(e) => handleCellEdit(index, e.target.value)}
                          disabled={lockedProjects.includes(index) || isSorted}
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