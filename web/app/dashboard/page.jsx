'use client';
import React, { useState } from 'react';
import '../../styles/DashboardInventory.scss';

import { Radio } from 'antd';
import { FiArrowUpRight } from 'react-icons/fi';

import { Line } from '@ant-design/plots';

const optionsWithDisabled = [
  { label: 'Weekly', value: 'Weekly' },
  { label: 'Monthly', value: 'Monthly' },
];

const data = [
  { day: 'Mo', value: 3 },
  { day: 'Tu', value: 4 },
  { day: 'Wed', value: 3.5 },
  { day: 'Th', value: 5 },
  { day: 'Fr', value: 4.2 },
  { day: 'Sa', value: 4.8 },
  { day: 'Su', value: 3.7 },
];

const config = {
  data,
  xField: 'day',
  yField: 'value',

  autoFit: true,

  colors: ['#FF6B3B'],

  theme: 'classicDark',
  point: {
    shapeField: 'square',
    sizeField: 4,
  },
  interaction: {
    tooltip: {
      marker: false,
    },
  },
  style: {
    lineWidth: 3,
  },
};

const Dashboard = () => {
  const [value4, setValue4] = useState('Weekly');

  const onChange4 = ({ target: { value } }) => {
    console.log('radio4 checked', value);
    setValue4(value);
  };

  return (
    <div className="dashboard-inventory">
      <div className="dashboard-inventory__top">
        <div className="dashboard-inventory__top__graph">
          <div className="dashboard-inventory__top__graph__head">
            <p className="caption-2">Wallet Value</p>
            <Radio.Group
              options={optionsWithDisabled}
              onChange={onChange4}
              value={value4}
              optionType="button"
              buttonStyle="solid"
            />
          </div>
          <div className="dashboard-inventory__top__graph__stats">
            <h4 className="heading-4">
              <span>$845,900</span> <FiArrowUpRight />
            </h4>
            <div className="dashboard-inventory__top__graph__stats__percent">
              <p className="p-4">+2.5%</p>
              <p className="p-5">Last 24hr</p>
            </div>
          </div>
          <div className="dashboard-inventory__top__graph__graph">
            <div className="graph-container">
              <Line {...config} />
            </div>
          </div>
        </div>
        <div className="dashboard-inventory__top__gainer item-card">
          <p className="caption-1">Top Gainer</p>
          <div className="item-body">
            <p className="p-4">+18.4%</p>
            <img
              src="/assets/home/products/Audemars-piguet-Royaloak.webp"
              className="item-img"
              alt=""
            />
            <p className="p-4">Gained</p>
          </div>
          <p className="caption-2">
            Audemars Piguet Royal Oak Extra Thin, 2019
          </p>
        </div>
        <div className="dashboard-inventory__top__valued item-card">
          <p className="caption-1">Most Valued</p>
          <div className="item-body">
            <p className="p-4">$5631</p>
            <img
              src="/assets/home/products/Audemars-piguet-Royaloak.webp"
              className="item-img"
              alt=""
            />
            <p className="p-4">Fraction Value</p>
          </div>
          <p className="caption-2">
            Audemars Piguet Royal Oak Extra Thin, 2019
          </p>
        </div>
      </div>
      <div className="dashboard-inventory__body">Table</div>
    </div>
  );
};

export default Dashboard;
