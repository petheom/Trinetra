import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'Admin' | 'Field Officer';

export interface Officer {
  badgeId: string;
  name: string;
  region: string;
  role: UserRole;
}

export interface InspectionReport {
  id: string;
  productName: string;
  brand: string;
  category: string;
  inspectionDate: string;
  officerName: string;
  officerId: string;
  region: string;
  location: string;
  verdict: 'Compliant' | 'Non-Compliant' | 'Manual Review';
  violations?: string[];
  findings: string;
  ocrConfidence: string;
  imageUrl?: string | null;
}

interface TriNetraContextType {
  officer: Officer | null;
  login: (badgeId: string, name: string, region: string, role?: UserRole) => void;
  logout: () => void;
  reports: InspectionReport[];
  addReport: (report: Omit<InspectionReport, 'id' | 'inspectionDate' | 'officerName' | 'officerId' | 'region'> & {
    id?: string;
    inspectionDate?: string;
    officerName?: string;
    officerId?: string;
    region?: string;
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
    officerId: 'INSP-GJ-2041',
    region: 'Gujarat',
    location: 'Central Supermarket, C.G. Road, Ahmedabad, Gujarat',
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
    officerId: 'INSP-MH-118',
    region: 'Maharashtra',
    location: 'High Street Phoenix, Lower Parel, Mumbai, Maharashtra',
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
    officerName: 'Inspector Amit Mehra',
    officerId: 'INSP-GJ-305',
    region: 'Gujarat',
    location: 'Wholesale Agro Depot, Gondal Road, Rajkot, Gujarat',
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
    officerName: 'Inspector Devendra Joshi',
    officerId: 'INSP-DL-102',
    region: 'Delhi (NCT)',
    location: 'Connaught Place Retail Hub, New Delhi',
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
    officerName: 'Inspector K. Ramanathan',
    officerId: 'INSP-TN-504',
    region: 'Tamil Nadu',
    location: 'Express Avenue Hypermarket, Royapettah, Chennai, Tamil Nadu',
    verdict: 'Non-Compliant',
    violations: [
      'Rule 6(1)(b) - Missing Indian Importer Complete Postal Address & Pin code',
      'Rule 6(1)(f) - Missing Country of Origin declaration tag',
    ],
    findings: 'Compoundable offense under Section 48. Stock quarantined pending importer response.',
    ocrConfidence: '95.0%',
  },
  {
    id: 'TRN-9815',
    productName: 'Mysore Sandal Gold Bath Soap (3x125g)',
    brand: 'Karnataka Soaps & Detergents Ltd',
    category: 'Personal Care & Cosmetics',
    inspectionDate: '15 Sep 2026, 11:30 AM',
    officerName: 'Inspector H. Venkatesh',
    officerId: 'INSP-KA-412',
    region: 'Karnataka',
    location: 'Brigade Road Superstore, Bengaluru, Karnataka',
    verdict: 'Compliant',
    findings: 'All mandatory consumer care details and standard weight declarations verified compliant.',
    ocrConfidence: '97.2%',
  },
  {
    id: 'TRN-9808',
    productName: 'Ganga Premium Wheat Flour (10kg Bag)',
    brand: 'Northern Agro Milling',
    category: 'Food & Beverages',
    inspectionDate: '14 Sep 2026, 03:45 PM',
    officerName: 'Inspector Vikram Malhotra',
    officerId: 'INSP-UP-902',
    region: 'Uttar Pradesh',
    location: 'Hazratganj Wholesale Mandi, Lucknow, Uttar Pradesh',
    verdict: 'Non-Compliant',
    violations: [
      'Rule 6(1)(a) - Net quantity lettering height less than statutory minimum 4mm for 10kg package',
    ],
    findings: 'Deficiency notice issued to packer under Rule 9 of Metrology Packaging Rules.',
    ocrConfidence: '92.4%',
  },
];

const TriNetraContext = createContext<TriNetraContextType | undefined>(undefined);

export function TriNetraProvider({ children }: { children: React.ReactNode }) {
  // Officer state backed by activeSession and trinetra_officer with bulletproof fallbacks
  const [officer, setOfficer] = useState<Officer | null>(() => {
    try {
      const active = localStorage.getItem('activeSession') || localStorage.getItem('trinetra_officer');
      if (active) {
        const parsed = JSON.parse(active);
        if (parsed && typeof parsed === 'object' && parsed.badgeId) {
          const safeRole: UserRole =
            parsed.role === 'Admin' ? 'Admin' : 'Field Officer';
          const safeRegion: string =
            typeof parsed.region === 'string' && parsed.region.trim()
              ? parsed.region.trim()
              : 'Gujarat';

          return {
            badgeId: String(parsed.badgeId).trim(),
            name: String(parsed.name || 'Enforcement Officer').trim(),
            region: safeRegion,
            role: safeRole,
          };
        }
      }
      return null;
    } catch (err) {
      console.warn('Failed to parse officer session from storage:', err);
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
        localStorage.setItem('activeSession', JSON.stringify(officer));
        localStorage.setItem('trinetra_officer', JSON.stringify(officer));
      } else {
        localStorage.removeItem('activeSession');
        localStorage.removeItem('trinetra_officer');
      }
    } catch (e) {
      console.warn('Failed to persist activeSession in localStorage:', e);
    }
  }, [officer]);

  useEffect(() => {
    try {
      localStorage.setItem('trinetra_reports', JSON.stringify(reports));
    } catch (e) {
      console.warn('Failed to persist reports in localStorage:', e);
    }
  }, [reports]);

  const login = (
    badgeId: string,
    name: string,
    region: string,
    role: UserRole = 'Field Officer'
  ) => {
    const newOfficer: Officer = { badgeId, name, region, role };
    setOfficer(newOfficer);
    try {
      localStorage.setItem('activeSession', JSON.stringify(newOfficer));
      localStorage.setItem('trinetra_officer', JSON.stringify(newOfficer));
    } catch (e) {
      console.warn('Failed to write activeSession:', e);
    }
  };

  const logout = () => {
    setOfficer(null);
    try {
      localStorage.removeItem('activeSession');
      localStorage.removeItem('trinetra_officer');
    } catch (e) {
      console.warn('Failed to clear activeSession:', e);
    }
  };

  const addReport = (
    reportData: Omit<InspectionReport, 'id' | 'inspectionDate' | 'officerName' | 'officerId' | 'region'> & {
      id?: string;
      inspectionDate?: string;
      officerName?: string;
      officerId?: string;
      region?: string;
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
      region: reportData.region || officer?.region || 'Ahmedabad',
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
