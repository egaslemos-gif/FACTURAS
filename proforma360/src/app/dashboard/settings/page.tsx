"use client";

import { 
  RefreshCw, 
  Wifi, 
  FileText, 
  Users, 
  PackageOpen, 
  AlertCircle,
  Cloud
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-on-surface)] tracking-tight mb-2">
          Offline Sync Status
        </h1>
        <p className="text-[var(--color-on-surface-variant)] text-sm max-w-2xl leading-relaxed">
          Manage your connection and synchronize data created while operating in offline mode.
          Do not close the application during active synchronization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Sync Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-[var(--color-primary)] rounded-full flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-on-surface)]">Syncing Data...</h2>
                  <div className="flex items-center gap-1.5 text-sm text-[var(--color-on-surface-variant)] mt-1">
                    <Cloud className="w-4 h-4" />
                    Connecting to secure server
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-[10px] font-bold text-[var(--color-outline)] uppercase tracking-wider mb-1">Last Successful Sync</p>
                <p className="text-sm font-medium text-[var(--color-on-surface)]">Oct 24, 2024 • 09:41 AM</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm font-semibold text-[var(--color-on-surface)]">
                <span>Processing Quotations (3/12)</span>
                <span className="text-[var(--color-primary)]">25%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-[var(--color-surface-container)] rounded-full h-2.5 overflow-hidden">
                <div className="bg-[var(--color-primary)] h-2.5 rounded-full" style={{ width: '25%' }}></div>
              </div>
              
              <div className="text-right text-xs text-[var(--color-on-surface-variant)] font-medium">
                Estimated time remaining: ~2 mins
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50/50 px-6 py-4 border-t border-[var(--color-outline-variant)] flex items-center justify-end gap-3">
            <button className="px-5 py-2.5 text-sm font-semibold text-[var(--color-on-surface)] bg-white border border-[var(--color-outline-variant)] rounded-lg hover:bg-gray-50 transition-colors">
              Cancel Sync
            </button>
            <button className="px-5 py-2.5 text-sm font-semibold text-[var(--color-on-surface-variant)] bg-[var(--color-surface-container)] rounded-lg cursor-not-allowed flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Sync Now
            </button>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Network Status */}
          <div className="bg-white rounded-2xl border border-[var(--color-outline-variant)] shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center shrink-0">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--color-outline)] uppercase tracking-wider mb-0.5">Network Status</p>
              <p className="text-sm font-bold text-green-700">Online & Stable</p>
            </div>
          </div>

          {/* Pending Queue */}
          <div className="bg-white rounded-2xl border border-[var(--color-outline-variant)] shadow-sm p-6">
            <h3 className="text-lg font-bold text-[var(--color-on-surface)] mb-5">Pending Queue</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-on-surface-variant)]">
                  <FileText className="w-4 h-4" />
                  Quotations
                </div>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">12</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-on-surface-variant)]">
                  <Users className="w-4 h-4" />
                  New Clients
                </div>
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">3</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm font-medium text-[var(--color-on-surface-variant)]">
                  <PackageOpen className="w-4 h-4" />
                  Product Edits
                </div>
                <span className="px-2.5 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-bold">0</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* Offline Records Table */}
      <div className="bg-white rounded-2xl border border-[var(--color-outline-variant)] shadow-sm overflow-hidden mt-8">
        <div className="p-6 border-b border-[var(--color-outline-variant)] flex items-center justify-between bg-gray-50/30">
          <h3 className="text-lg font-bold text-[var(--color-on-surface)]">Offline Records</h3>
          <span className="px-3 py-1 bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] rounded-full text-xs font-bold tracking-wider">
            15 TOTAL
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-[var(--color-outline)] uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4"></th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Identifier / Name</th>
                <th className="px-6 py-4">Created Offline</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-outline-variant)]">
              {/* Row 1 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin-slow" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] font-medium">
                    <FileText className="w-4 h-4" />
                    Quotation
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-[var(--color-on-surface)]">
                  Q-2024-8901
                </td>
                <td className="px-6 py-4 text-[var(--color-on-surface-variant)]">
                  Oct 24, 10:15 AM
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                    Syncing...
                  </span>
                </td>
              </tr>
              
              {/* Row 2 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-[var(--color-outline)]">
                  <Cloud className="w-4 h-4" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] font-medium">
                    <FileText className="w-4 h-4" />
                    Quotation
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-[var(--color-on-surface)]">
                  Q-2024-8902
                </td>
                <td className="px-6 py-4 text-[var(--color-on-surface-variant)]">
                  Oct 24, 11:30 AM
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                    Pending
                  </span>
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="hover:bg-gray-50/50 transition-colors bg-red-50/30">
                <td className="px-6 py-4 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] font-medium">
                    <Users className="w-4 h-4" />
                    Client Record
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-[var(--color-on-surface)]">
                  Acme Corp Logistics
                </td>
                <td className="px-6 py-4 text-[var(--color-on-surface-variant)]">
                  Oct 24, 01:45 PM
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700">
                    Conflict Detected
                  </span>
                </td>
              </tr>

              {/* Row 4 */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 text-[var(--color-outline)]">
                  <Cloud className="w-4 h-4" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)] font-medium">
                    <FileText className="w-4 h-4" />
                    Quotation
                  </div>
                </td>
                <td className="px-6 py-4 font-bold text-[var(--color-on-surface)]">
                  Q-2024-8903
                </td>
                <td className="px-6 py-4 text-[var(--color-on-surface-variant)]">
                  Oct 24, 02:10 PM
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                    Pending
                  </span>
                </td>
              </tr>
              
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Required for the spin animation in Tailwind if not already configured in tailwind.config.ts */}
      <style dangerouslySetInnerHTML={{__html: `
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
      `}} />
    </div>
  );
}
