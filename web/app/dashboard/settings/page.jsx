'use client';
import '../../../styles/DashboardSettings.scss';
import { Button, Input, Select, message } from 'antd';

import { HiOutlineLogout } from 'react-icons/hi';

const SettingsPage = () => {
  return (
    <div className="settings">
      <div className="settings__row">
        <div className="settings__col">
          <p className="caption-3">CURRENCY PREFERENCE</p>
          <Select
            size="large"
            showSearch
            style={{
              width: '100%',
            }}
            placeholder="Search to Select"
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').includes(input)
            }
            filterSort={(optionA, optionB) =>
              (optionA?.label ?? '')
                .toLowerCase()
                .localeCompare((optionB?.label ?? '').toLowerCase())
            }
            options={[
              {
                value: '1',
                label: '$USD', // United States Dollar
              },
              {
                value: '2',
                label: '€EUR', // Euro
              },
              {
                value: '3',
                label: '¥JPY', // Japanese Yen
              },
              {
                value: '4',
                label: '£GBP', // British Pound Sterling
              },
              {
                value: '5',
                label: '$AUD', // Australian Dollar
              },
              {
                value: '6',
                label: '₽RUB', // Russian Ruble
              },
            ]}
          />
        </div>
        <div className="settings__col">
          <p className="caption-3">WALLET (ACCOUNT)</p>
          <Input
            suffix={
              <Button
                onClick={() => {
                  message.success('Gonna Delete This!');
                }}
                danger
                size="small"
                type="primary"
              >
                Delete
              </Button>
            }
            value={'0x473895634895hjfgd7834sdgyerterhgr'}
            size="large"
            placeholder="Enter Your"
            disabled={true}
          />
        </div>
      </div>

      <div className="settings__row-half ">
        <div className="empty-placeholder"></div>
        <Button
          type="default"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
          }}
          size="large"
        >
          LOG OUT
          <HiOutlineLogout style={{ fontSize: '2rem' }} />
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
