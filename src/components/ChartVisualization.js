import React, { useState, useRef } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

ChartJS.register(...registerables);

function ChartVisualization({ data, setData, budget }) {
  const [popupData, setPopupData] = useState({ open: false, label: '', currentValue: 0 });
  const chartRefs = {
    project: useRef(null),
    firm: useRef(null),
    payment: useRef(null),
  };

  const prepareChartData = () => {
    const projectData = data.reduce((acc, item) => {
      acc[item['Proje Adı']] = (acc[item['Proje Adı']] || 0) + item['Bu ay ödenecek tutar'];
      return acc;
    }, {});

    const firmData = data.reduce((acc, item) => {
      acc[item['Firma Adı']] = (acc[item['Firma Adı']] || 0) + item['Bu ay ödenecek tutar'];
      return acc;
    }, {});

    const paymentTrackingData = data.reduce((acc, item) => {
      acc[item['Ödeme Takip No']] = (acc[item['Ödeme Takip No']] || 0) + item['Bu ay ödenecek tutar'];
      return acc;
    }, {});

    return {
      projectData: {
        labels: Object.keys(projectData),
        datasets: [{
          label: 'Projelere Göre Ödenecek Tutar',
          data: Object.values(projectData),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
        }],
      },
      firmData: {
        labels: Object.keys(firmData),
        datasets: [{
          label: 'Firmalara Göre Ödenecek Tutar',
          data: Object.values(firmData),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
        }],
      },
      paymentTrackingData: {
        labels: Object.keys(paymentTrackingData),
        datasets: [{
          label: 'Ödeme Takip Numarasına Göre Ödenecek Tutar',
          data: Object.values(paymentTrackingData),
          backgroundColor: [
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
          ],
        }],
      },
    };
  };

  const { projectData, firmData, paymentTrackingData } = prepareChartData();

  const updateDataFromChart = (label, newValue) => {
    const newData = [...data];
    const updatedData = newData.map(item => {
      if (item['Proje Adı'] === label || item['Firma Adı'] === label || item['Ödeme Takip No'] === label) {
        return { ...item, 'Bu ay ödenecek tutar': newValue };
      }
      return item;
    });
    setData(updatedData);
  };

  const handleDoubleClick = (label, currentValue) => {
    const newValue = parseFloat(prompt(`Yeni değer girin: (Mevcut: ${currentValue})`, currentValue));
    if (!isNaN(newValue) && newValue >= 0) {
      updateDataFromChart(label, newValue);
    }
  };

  const handleChartClick = (chartRef, event) => {
    const chart = chartRef.current;
    if (chart) {
      const elements = chart.getElementsAtEventForMode(event.nativeEvent, 'nearest', { intersect: true }, false);
      if (elements.length > 0) {
        const index = elements[0].index;
        const label = chart.data.labels[index];
        const currentValue = chart.data.datasets[0].data[index];
        handleDoubleClick(label, currentValue);
      }
    }
  };

  return (
    <div>
      <h2>Projelere Göre Bu Ay Ödenecek Tutar</h2>
      <div className="chart-container" onDoubleClick={(e) => handleChartClick(chartRefs.project, e)}>
        <Bar ref={chartRefs.project} data={projectData} />
      </div>
      <h2>Firmalara Göre Bu Ay Ödenecek Tutar</h2>
      <div className="chart-container" onDoubleClick={(e) => handleChartClick(chartRefs.firm, e)}>
        <Pie ref={chartRefs.firm} data={firmData} />
      </div>
      <h2>Ödeme Takip Numarasına Göre Bu Ay Ödenecek Tutar</h2>
      <div className="chart-container" onDoubleClick={(e) => handleChartClick(chartRefs.payment, e)}>
        <Bar ref={chartRefs.payment} data={paymentTrackingData} />
      </div>
    </div>
  );
}

export default ChartVisualization;
