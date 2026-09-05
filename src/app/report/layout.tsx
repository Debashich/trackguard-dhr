import React from 'react';
import { ReportProvider } from '@/lib/ReportContext';

export default function ReportLayout({ children }: { children: React.ReactNode }) {
  return <ReportProvider>{children}</ReportProvider>;
}
