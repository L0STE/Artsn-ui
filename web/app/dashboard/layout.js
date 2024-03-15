import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import React from 'react';

const layout = ({ children }) => {
  return (
    <div>
      <DashboardLayout>{children}</DashboardLayout>
    </div>
  );
};

export default layout;
