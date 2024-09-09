// src/components/ChartVisualization.js
import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import dragDataPlugin from 'chartjs-plugin-dragdata';
ChartJS.register(...registerables, dragDataPlugin);

function ChartVisualization({ data, setData, budget }) {
  const prepareChartData = () => {
    // Proje Adı ve Firma Adı'na göre veri hazırlamak
    const projectData = data.reduce((acc, item) => {
      acc[item['Proje Adı']] = (acc[item['Proje Adı']] || 0) + item['Bu ay ödenecek tutar'];
      return acc;
    }, {});

    const firmData = data.reduce((acc, item) => {
      acc[item['Firma Adı']] = (acc[item['Firma Adı']] || 0) + item['Bu ay ödenecek tutar'];
      return acc;
    }, {});

    // Ödeme Takip Numarasına göre veri hazırlamak
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
          dragData: true,
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
          dragData: true,
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
          dragData: true,
        }],
      },
    };
  };

  const { projectData, firmData, paymentTrackingData } = prepareChartData();

  const updateDataFromChart = (label, newValue) => {
    const newData = [...data];
    let totalCurrent = newData.reduce((sum, row) => sum + row['Bu ay ödenecek tutar'], 0);

    if (totalCurrent <= budget) {
      const newDataAdjusted = newData.map(item => {
        if (item['Proje Adı'] === label || item['Firma Adı'] === label || item['Ödeme Takip No'] === label) {
          return { ...item, 'Bu ay ödenecek tutar': newValue };
        }
        return item;
      });

      // Toplam bütçeyi aşmamak için diğer değerleri güncelle
      const totalNewValue = newDataAdjusted.reduce((sum, row) => sum + row['Bu ay ödenecek tutar'], 0);
      if (totalNewValue > budget) {
        const diff = totalNewValue - budget;
        newDataAdjusted.forEach(item => {
          if (item['Proje Adı'] !== label && item['Firma Adı'] !== label && item['Ödeme Takip No'] !== label) {
            item['Bu ay ödenecek tutar'] = Math.max(0, item['Bu ay ödenecek tutar'] - diff / (newDataAdjusted.length - 1));
          }
        });
      }

      setData(newDataAdjusted);
    }
  };

  const handleDragEnd = (e, datasetIndex, index, value) => {
    const label = projectData.labels[index] || firmData.labels[index] || paymentTrackingData.labels[index];
    updateDataFromChart(label, Math.max(0, value));
  };

  return (
    <div>
      <h2>Projelere Göre Bu Ay Ödenecek Tutar</h2>
      <div className="chart-container">
        <Bar 
          data={projectData} 
          options={{
            plugins: {
              dragData: {
                round: 1,
                onDragEnd: handleDragEnd,
              }
            }
          }} 
        />
      </div>
      <h2>Firmalara Göre Bu Ay Ödenecek Tutar</h2>
      <div className="chart-container">
        <Pie 
          data={firmData}
          options={{
            plugins: {
              dragData: {
                round: 1,
                dragX: false,
                dragY: true,
                onDragEnd: handleDragEnd,
              }
            }
          }}
        />
      </div>
      <h2>Ödeme Takip Numarasına Göre Bu Ay Ödenecek Tutar</h2>
      <div className="chart-container">
        <Bar
          data={paymentTrackingData}
          options={{
            plugins: {
              dragData: {
                round: 1,
                onDragEnd: handleDragEnd,
              }
            }
          }}
        />
      </div>
    </div>
  );
}

export default ChartVisualization;
