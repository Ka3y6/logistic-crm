import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import './Charts.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  ArcElement
);

const Charts = () => {
  const worldwideSalesData = {
    labels: ["2016", "2017", "2018", "2019", "2020", "2021", "2022"],
    datasets: [
      {
        label: "USA",
        data: [15, 30, 55, 65, 60, 80, 95],
        backgroundColor: "rgba(0, 156, 255, .7)"
      },
      {
        label: "UK",
        data: [8, 35, 40, 60, 70, 55, 75],
        backgroundColor: "rgba(0, 156, 255, .5)"
      },
      {
        label: "AU",
        data: [12, 25, 45, 55, 65, 70, 60],
        backgroundColor: "rgba(0, 156, 255, .3)"
      }
    ]
  };

  const salesRevenueData = {
    labels: ["2016", "2017", "2018", "2019", "2020", "2021", "2022"],
    datasets: [
      {
        label: "Продажи",
        data: [15, 30, 55, 45, 70, 65, 85],
        backgroundColor: "rgba(0, 156, 255, .5)",
        fill: true
      },
      {
        label: "Доход",
        data: [99, 135, 170, 130, 190, 180, 270],
        backgroundColor: "rgba(0, 156, 255, .3)",
        fill: true
      }
    ]
  };

  const pieData = {
    labels: ["Италия", "Франция", "Испания", "США", "Аргентина"],
    datasets: [{
      data: [55, 49, 44, 24, 15],
      backgroundColor: [
        "rgba(0, 156, 255, .7)",
        "rgba(0, 156, 255, .6)",
        "rgba(0, 156, 255, .5)",
        "rgba(0, 156, 255, .4)",
        "rgba(0, 156, 255, .3)"
      ]
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div className="charts-container">
      <div className="chart-card">
        <h3>Мировые продажи</h3>
        <Bar options={options} data={worldwideSalesData} />
      </div>
      <div className="chart-card">
        <h3>Продажи и доход</h3>
        <Line options={options} data={salesRevenueData} />
      </div>
      <div className="chart-card">
        <h3>Распределение по странам</h3>
        <Pie options={options} data={pieData} />
      </div>
      <div className="chart-card">
        <h3>Доля рынка</h3>
        <Doughnut options={options} data={pieData} />
      </div>
    </div>
  );
};

export default Charts; 