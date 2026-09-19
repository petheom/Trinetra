import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Officer {
  badgeId: string;
  name: string;
  region: string;
}

export interface InspectionReport {
  id: string;
  productName: string;
  brand: string;
  category: string;
  inspectionDate: string;
  officerName: string;
  officerId: string;
  location: string;
  verdict: 'Compliant' | 'Non-Compliant' | 'Manual Review';
  violations?: string[];
  findings: string;
  ocrConfidence: string;
  imageUrl?: string | null;
}

interface TriNetraContextType {
  officer: Officer | null;
  login: (badgeId: string, name: string, region: string) => void;
  logout: () => void;
  reports: InspectionReport[];
  addReport: (report: Omit<InspectionReport, 'id' | 'inspectionDate' | 'officerName' | 'officerId'> & {
    id?: string;
    inspectionDate?: string;
    officerName?: string;
    officerId?: string;
  }) => InspectionReport;
}

const DEFAULT_REPORTS: InspectionReport[] = [
  {
    id: 'TRN-9841',
    productName: 'Everest Chana Masala (100g Carton)',
    brand: 'Everest Spices Pvt Ltd',
    category: 'Food & Beverages',
    inspectionDate: '18 Sep 2026, 10:42 AM',
    officerName: 'Inspector Rajesh Varma',
    officerId: 'INSP-DL-402',
    location: 'Central Supermarket, Connaught Place, New Delhi',
    verdict: 'Manual Review',
    violations: [
      'Rule 6(1)(d) - Dot-matrix manufacturing date partially obscured by crease',
    ],
    findings: 'Referred for secondary optical magnification and physical batch stamp verification.',
    ocrConfidence: '78.2%',
  },
  {
    id: 'TRN-9839',
    productName: 'GlowClean Herbal Face Wash (150ml)',
    brand: 'Aura Cosmetics Ltd',
    category: 'Personal Care & Cosmetics',
    inspectionDate: '18 Sep 2026, 10:15 AM',
    officerName: 'Inspector Sunita Sharma',
    officerId: 'INSP-DL-118',
    location: 'Westend Mall, Rajouri Garden, New Delhi',
    verdict: 'Non-Compliant',
    violations: [
      'Rule 6(1)(e) - Dual pricing sticker concealing original printed MRP',
      'Rule 18(2) - Selling packaged commodity at price exceeding statutory maximum',
    ],
    findings: 'Notice issued under Section 36 of Legal Metrology Act, 2009. Seizure memo recorded.',
    ocrConfidence: '96.8%',
  },
  {
    id: 'TRN-9835',
    productName: 'Fortune Sunlite Refined Sunflower Oil (1L Pouch)',
    brand: 'Adani Wilmar Ltd',
    category: 'Food & Beverages',
    inspectionDate: '18 Sep 2026, 09:50 AM',
    officerName: 'Inspector Rajesh Varma',
    officerId: 'INSP-DL-402',
    location: 'Wholesale Depot, Okhla Phase III, New Delhi',
    verdict: 'Compliant',
    findings: 'All statutory declarations (Net volume, MRP, FSSAI Lic, Batch & Expiry) verified compliant.',
    ocrConfidence: '98.5%',
  },
  {
    id: 'TRN-9828',
    productName: 'Sparkle Advanced Detergent Bar (4x250g Multi-pack)',
    brand: 'Sparkle Clean India',
    category: 'Household Commodities',
    inspectionDate: '17 Sep 2026, 04:30 PM',
    officerName: 'Inspector Amit Mehra',
    officerId: 'INSP-DL-305',
    location: 'Metro Cash & Carry, Shahdara, New Delhi',
    verdict: 'Compliant',
    findings: 'Individual unit sale price (USP per 100g) verified as per 2021 amended statutory rules.',
    ocrConfidence: '94.1%',
  },
  {
    id: 'TRN-9820',
    productName: 'Artisan Hazelnut Spread (350g Glass Jar)',
    brand: 'Imported Goods Direct',
    category: 'Food & Beverages',
    inspectionDate: '16 Sep 2026, 02:15 PM',
    officerName: 'Inspector Sunita Sharma',
    officerId: 'INSP-DL-118',
    location: 'Gourmet World, Saket, New Delhi',
    verdict: 'Non-Compliant',
    violations: [
      'Rule 6(1)(b) - Missing Indian Importer Complete Postal Address & Pin code',
      'Rule 6(1)(f) - Missing Country of Origin declaration tag',
    ],
    findings: 'Compoundable offense under Section 48. Stock quarantined pending importer response.',
    ocrConfidence: '95.0%',
  },
];

const TriNetraContext = createContext<TriNetraContextType | undefined>(undefined);

export function TriNetraProvider({ children }: { children: React.ReactNode }) {
  // Officer state backed by localStorage
  const [officer, setOfficer] = useState<Officer | null>(() => {
    try {
      const saved = localStorage.getItem('trinetra_officer');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Reports state backed by localStorage
  const [reports, setReports] = useState<InspectionReport[]>(() => {
    try {
      const saved = localStorage.getItem('trinetra_reports');
      return saved ? JSON.parse(saved) : DEFAULT_REPORTS;
    } catch {
      return DEFAULT_REPORTS;
    }
  });

  useEffect(() => {
    try {
      if (officer) {
        localStorage.setItem('trinetra_officer', JSON.stringify(officer));
      } else {
        localStorage.removeItem('trinetra_officer');
      }
    } catch (e) {
      console.warn('Failed to persist officer in localStorage:', e);
    }
  }, [officer]);

  useEffect(() => {
    try {
      localStorage.setItem('trinetra_reports', JSON.stringify(reports));
    } catch (e) {
      console.warn('Failed to persist reports in localStorage:', e);
    }
  }, [reports]);

  const login = (badgeId: string, name: string, region: string) => {
    setOfficer({ badgeId, name, region });
  };

  const logout = () => {
    setOfficer(null);
  };

  const addReport = (
    reportData: Omit<InspectionReport, 'id' | 'inspectionDate' | 'officerName' | 'officerId'> & {
      id?: string;
      inspectionDate?: string;
      officerName?: string;
      officerId?: string;
    }
  ): InspectionReport => {
    const newReport: InspectionReport = {
      ...reportData,
      id: reportData.id || `TRN-${Math.floor(1000 + Math.random() * 9000)}`,
      inspectionDate:
        reportData.inspectionDate ||
        `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      officerName: reportData.officerName || officer?.name || 'Inspector Rajesh Varma',
      officerId: reportData.officerId || officer?.badgeId || 'INSP-GJ-2041',
    };

    setReports((prev) => [newReport, ...prev]);
    return newReport;
  };

  return (
    <TriNetraContext.Provider value={{ officer, login, logout, reports, addReport }}>
      {children}
    </TriNetraContext.Provider>
  );
}

export function useTriNetra() {
  const context = useContext(TriNetraContext);
  if (!context) {
    throw new Error('useTriNetra must be used within a TriNetraProvider');
  }
  return context;
}
