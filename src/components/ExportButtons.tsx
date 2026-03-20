'use client';

import dynamic from 'next/dynamic';
import { Report } from '@/lib/types';
import { Loader2 } from 'lucide-react';

// This completely prevents jspdf/html2canvas from loading during SSR
const ExportButtonsClient = dynamic(
  () => import('./ExportButtonsClient'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-300 text-white rounded-xl font-medium text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      </div>
    ),
  }
);

interface ExportButtonsProps {
  report: Report;
}

export default function ExportButtons({ report }: ExportButtonsProps) {
  return <ExportButtonsClient report={report} />;
}