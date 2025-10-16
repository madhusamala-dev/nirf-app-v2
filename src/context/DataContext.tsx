import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface TLRScores {
  // Student Strength fields
  nt: number; // Total sanctioned approved intake (UG + PG)
  ne: number; // Total enrolled students (UG + PG)
  np: number; // Total doctoral students enrolled till previous academic year
  ss: number; // Student Strength (calculated)
  
  // Faculty-Student Ratio fields
  f: number;  // Full-time regular faculty count
  fsr: number; // Faculty Student Ratio (calculated)
  
  // Other TLR fields
  fqe: number; // Faculty with PhD
  fru: number; // Financial Resources and their Utilization
  total: number;
}

export interface ResearchScores {
  pu: number;
  qp: number;
  iprf: number;
  fppp: number;
  total: number;
}

export interface GraduationScores {
  gph: number;
  gue: number;
  gms: number;
  grd: number;
  total: number;
}

export interface OutreachScores {
  rd: number;
  wd: number;
  escs: number;
  pcs: number;
  total: number;
}

export interface PerceptionScores {
  pr: number;
  total: number;
}

export type SectionData = TLRScores | ResearchScores | GraduationScores | OutreachScores | PerceptionScores;

export interface FormSection {
  data: SectionData;
  coordinatorEmail: string;
  lastModified: Date;
  modifiedBy: 'coordinator' | 'admin';
  adminNotes?: string;
}

export interface Scores {
  tlr: TLRScores;
  research: ResearchScores;
  graduation: GraduationScores;
  outreach: OutreachScores;
  perception: PerceptionScores;
  overall: number;
}

// Extended TLR data to include program selections and intake data
export interface TLRFormData extends TLRScores {
  selectedPrograms: string[];
  programIntakes: Array<{
    program: string;
    '2024-25': number;
    '2023-24': number;
    '2022-23': number;
    '2021-22': number;
    total: number;
  }>;
  studentEnrollments: Array<{
    program: string;
    maleStudents: number;
    femaleStudents: number;
    totalStudents: number;
  }>;
}

export interface Submission {
  id: string;
  collegeName: string;
  coordinatorName: string;
  coordinatorEmail: string;
  scores: Scores;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submittedAt?: Date;
  reviewedAt?: Date;
  comments?: string;
  sections: {
    tlr: FormSection;
    research: FormSection;
    graduation: FormSection;
    outreach: FormSection;
    perception: FormSection;
  };
}

interface DataContextType {
  scores: Scores;
  submissions: Submission[];
  currentSubmission: Submission | null;
  isEditing: boolean;
  tlrFormData: TLRFormData;
  updateTLRData: (data: Partial<TLRScores>) => Promise<boolean>;
  updateTLRFormData: (data: Partial<TLRFormData>) => Promise<boolean>;
  updateResearchData: (data: Partial<ResearchScores>) => Promise<boolean>;
  updateGraduationData: (data: Partial<GraduationScores>) => Promise<boolean>;
  updateOutreachData: (data: Partial<OutreachScores>) => Promise<boolean>;
  updatePerceptionData: (data: Partial<PerceptionScores>) => Promise<boolean>;
  submitForApproval: () => void;
  approveSubmission: (id: string, comments: string) => void;
  rejectSubmission: (id: string, comments: string) => void;
  editSubmission: (id: string) => void;
  saveSubmissionChanges: () => void;
  cancelEdit: () => void;
  adminUpdateSection: (sectionName: keyof Submission['sections'], data: SectionData & { adminNotes?: string }, adminEmail: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  SCORES: 'nirf_scores',
  TLR_FORM_DATA: 'nirf_tlr_form_data',
  SUBMISSIONS: 'nirf_submissions'
};

// Default values
const defaultTLRScores: TLRScores = { nt: 0, ne: 0, np: 0, ss: 0, f: 0, fsr: 0, fqe: 0, fru: 0, total: 0 };
const defaultTLRFormData: TLRFormData = {
  ...defaultTLRScores,
  selectedPrograms: [],
  programIntakes: [],
  studentEnrollments: []
};

const defaultScores: Scores = {
  tlr: defaultTLRScores,
  research: { pu: 0, qp: 0, iprf: 0, fppp: 0, total: 0 },
  graduation: { gph: 0, gue: 0, gms: 0, grd: 0, total: 0 },
  outreach: { rd: 0, wd: 0, escs: 0, pcs: 0, total: 0 },
  perception: { pr: 0, total: 0 },
  overall: 0
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load initial data from localStorage
  const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return defaultValue;
    }
  };

  const [scores, setScores] = useState<Scores>(() => loadFromStorage(STORAGE_KEYS.SCORES, defaultScores));
  const [tlrFormData, setTLRFormData] = useState<TLRFormData>(() => loadFromStorage(STORAGE_KEYS.TLR_FORM_DATA, defaultTLRFormData));
  const [submissions, setSubmissions] = useState<Submission[]>(() => loadFromStorage(STORAGE_KEYS.SUBMISSIONS, []));
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SCORES, JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TLR_FORM_DATA, JSON.stringify(tlrFormData));
  }, [tlrFormData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  // Calculate Student Strength using NIRF formula
  const calculateStudentStrength = (nt: number, ne: number, np: number): number => {
    // NIRF formula: SS = f(NT, NE) × 15 + f(NP) × 5
    // For now, implementing f(NT,NE) and f(NP) as normalized functions
    // This can be updated when NIRF provides the exact functions
    
    const fNTNE = nt > 0 ? Math.min(ne / nt, 1) : 0; // Enrollment ratio, capped at 1
    const fNP = np > 0 ? Math.min(np / 100, 1) : 0; // Normalized doctoral enrollment
    
    const ss = (fNTNE * 15) + (fNP * 5);
    return Math.min(ss, 20); // Cap at 20 marks as per NIRF guidelines
  };

  // Calculate Faculty-Student Ratio using NIRF formula
  const calculateFSR = (f: number, nt: number, np: number): number => {
    // NIRF formula: FSR = 30 × [15 × (F/N)]
    // N = NT + NP
    // Expected ratio is 1:15 to score maximum marks
    // For F/N < 1:50, FSR will be set to zero
    
    const n = nt + np; // Total students (sanctioned intake + doctoral)
    
    if (n === 0 || f === 0) return 0;
    
    const ratio = f / n; // Faculty to student ratio
    
    // If ratio is less than 1:50 (0.02), set FSR to zero
    if (ratio < 1/50) return 0;
    
    // Calculate FSR score
    // At 1:15 ratio (0.0667), FSR should be maximum (30 marks)
    const idealRatio = 1/15; // 0.0667
    const fsrScore = 30 * Math.min(ratio / idealRatio, 1);
    
    return Math.min(fsrScore, 30); // Cap at 30 marks
  };

  // Calculate overall score whenever individual scores change
  useEffect(() => {
    const overall = (
      scores.tlr.total * 0.30 +
      scores.research.total * 0.30 +
      scores.graduation.total * 0.20 +
      scores.outreach.total * 0.10 +
      scores.perception.total * 0.10
    );
    
    setScores(prev => ({ ...prev, overall }));
  }, [scores.tlr.total, scores.research.total, scores.graduation.total, scores.outreach.total, scores.perception.total]);

  const updateTLRData = async (data: Partial<TLRScores>): Promise<boolean> => {
    try {
      setScores(prev => {
        const newTLR = { ...prev.tlr, ...data };
        
        // Recalculate SS if NT, NE, or NP changed
        if ('nt' in data || 'ne' in data || 'np' in data) {
          newTLR.ss = calculateStudentStrength(newTLR.nt, newTLR.ne, newTLR.np);
        }
        
        // Recalculate FSR if F, NT, or NP changed
        if ('f' in data || 'nt' in data || 'np' in data) {
          newTLR.fsr = calculateFSR(newTLR.f, newTLR.nt, newTLR.np);
        }
        
        // Calculate total if not provided
        if (!data.total) {
          newTLR.total = newTLR.ss + newTLR.fsr + newTLR.fqe + newTLR.fru;
        }
        
        return { ...prev, tlr: newTLR };
      });

      // Also update the TLR form data
      setTLRFormData(prev => ({
        ...prev,
        ...data,
        ss: data.ss || calculateStudentStrength(data.nt || prev.nt, data.ne || prev.ne, data.np || prev.np),
        fsr: data.fsr || calculateFSR(data.f || prev.f, data.nt || prev.nt, data.np || prev.np)
      }));

      return true;
    } catch (error) {
      console.error('Error updating TLR data:', error);
      return false;
    }
  };

  const updateTLRFormData = async (data: Partial<TLRFormData>): Promise<boolean> => {
    try {
      setTLRFormData(prev => {
        const updated = { ...prev, ...data };
        
        // Recalculate SS and FSR if relevant fields changed
        if ('nt' in data || 'ne' in data || 'np' in data) {
          updated.ss = calculateStudentStrength(updated.nt, updated.ne, updated.np);
        }
        
        if ('f' in data || 'nt' in data || 'np' in data) {
          updated.fsr = calculateFSR(updated.f, updated.nt, updated.np);
        }
        
        updated.total = updated.ss + updated.fsr + updated.fqe + updated.fru;
        
        return updated;
      });

      // Also update the main scores
      const tlrScoreData: Partial<TLRScores> = {};
      Object.keys(data).forEach(key => {
        if (key in defaultTLRScores) {
          const typedKey = key as keyof TLRScores;
          const typedData = data as Partial<TLRFormData>;
          tlrScoreData[typedKey] = typedData[typedKey];
        }
      });

      if (Object.keys(tlrScoreData).length > 0) {
        await updateTLRData(tlrScoreData);
      }

      return true;
    } catch (error) {
      console.error('Error updating TLR form data:', error);
      return false;
    }
  };

  const updateResearchData = async (data: Partial<ResearchScores>): Promise<boolean> => {
    try {
      setScores(prev => {
        const newResearch = { ...prev.research, ...data };
        if (!data.total) {
          newResearch.total = newResearch.pu + newResearch.qp + newResearch.iprf + newResearch.fppp;
        }
        return { ...prev, research: newResearch };
      });
      return true;
    } catch (error) {
      console.error('Error updating Research data:', error);
      return false;
    }
  };

  const updateGraduationData = async (data: Partial<GraduationScores>): Promise<boolean> => {
    try {
      setScores(prev => {
        const newGraduation = { ...prev.graduation, ...data };
        if (!data.total) {
          newGraduation.total = newGraduation.gph + newGraduation.gue + newGraduation.gms + newGraduation.grd;
        }
        return { ...prev, graduation: newGraduation };
      });
      return true;
    } catch (error) {
      console.error('Error updating Graduation data:', error);
      return false;
    }
  };

  const updateOutreachData = async (data: Partial<OutreachScores>): Promise<boolean> => {
    try {
      setScores(prev => {
        const newOutreach = { ...prev.outreach, ...data };
        if (!data.total) {
          newOutreach.total = newOutreach.rd + newOutreach.wd + newOutreach.escs + newOutreach.pcs;
        }
        return { ...prev, outreach: newOutreach };
      });
      return true;
    } catch (error) {
      console.error('Error updating Outreach data:', error);
      return false;
    }
  };

  const updatePerceptionData = async (data: Partial<PerceptionScores>): Promise<boolean> => {
    try {
      setScores(prev => {
        const newPerception = { ...prev.perception, ...data };
        if (!data.total) {
          newPerception.total = newPerception.pr;
        }
        return { ...prev, perception: newPerception };
      });
      return true;
    } catch (error) {
      console.error('Error updating Perception data:', error);
      return false;
    }
  };

  const submitForApproval = () => {
    const newSubmission: Submission = {
      id: Date.now().toString(),
      collegeName: 'IIT Delhi',
      coordinatorName: 'Dr. Rajesh Kumar',
      coordinatorEmail: 'coordinator@iitdelhi.ac.in',
      scores: { ...scores },
      status: 'submitted',
      submittedAt: new Date(),
      sections: {
        tlr: {
          data: scores.tlr,
          coordinatorEmail: 'coordinator@iitdelhi.ac.in',
          lastModified: new Date(),
          modifiedBy: 'coordinator'
        },
        research: {
          data: scores.research,
          coordinatorEmail: 'coordinator@iitdelhi.ac.in',
          lastModified: new Date(),
          modifiedBy: 'coordinator'
        },
        graduation: {
          data: scores.graduation,
          coordinatorEmail: 'coordinator@iitdelhi.ac.in',
          lastModified: new Date(),
          modifiedBy: 'coordinator'
        },
        outreach: {
          data: scores.outreach,
          coordinatorEmail: 'coordinator@iitdelhi.ac.in',
          lastModified: new Date(),
          modifiedBy: 'coordinator'
        },
        perception: {
          data: scores.perception,
          coordinatorEmail: 'coordinator@iitdelhi.ac.in',
          lastModified: new Date(),
          modifiedBy: 'coordinator'
        }
      }
    };

    setSubmissions(prev => [...prev, newSubmission]);
  };

  const approveSubmission = (id: string, comments: string) => {
    setSubmissions(prev =>
      prev.map(sub =>
        sub.id === id
          ? { ...sub, status: 'approved' as const, reviewedAt: new Date(), comments }
          : sub
      )
    );
  };

  const rejectSubmission = (id: string, comments: string) => {
    setSubmissions(prev =>
      prev.map(sub =>
        sub.id === id
          ? { ...sub, status: 'rejected' as const, reviewedAt: new Date(), comments }
          : sub
      )
    );
  };

  const editSubmission = (id: string) => {
    const submission = submissions.find(sub => sub.id === id);
    if (submission) {
      setCurrentSubmission(submission);
      setScores(submission.scores);
      setIsEditing(true);
    }
  };

  const saveSubmissionChanges = () => {
    if (currentSubmission) {
      setSubmissions(prev =>
        prev.map(sub =>
          sub.id === currentSubmission.id
            ? { ...sub, scores: { ...scores } }
            : sub
        )
      );
      setCurrentSubmission(null);
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    setCurrentSubmission(null);
    setIsEditing(false);
    // Reset scores to original state
    setScores(defaultScores);
    setTLRFormData(defaultTLRFormData);
  };

  const calculateOverallScore = (scores: Scores) => {
    return (
      scores.tlr.total * 0.30 +
      scores.research.total * 0.30 +
      scores.graduation.total * 0.20 +
      scores.outreach.total * 0.10 +
      scores.perception.total * 0.10
    );
  };

  const adminUpdateSection = (sectionName: keyof Submission['sections'], data: SectionData & { adminNotes?: string }, adminEmail: string) => {
    console.log('DataContext adminUpdateSection called with:', { sectionName, data, adminEmail });
    
    // Extract admin notes from data
    const { adminNotes, ...scoreData } = data;
    
    // Special handling for TLR section to recalculate SS and FSR
    if (sectionName === 'tlr') {
      const tlrData = scoreData as Partial<TLRScores>;
      if ('nt' in tlrData || 'ne' in tlrData || 'np' in tlrData) {
        (tlrData as TLRScores).ss = calculateStudentStrength(tlrData.nt || 0, tlrData.ne || 0, tlrData.np || 0);
      }
      if ('f' in tlrData || 'nt' in tlrData || 'np' in tlrData) {
        (tlrData as TLRScores).fsr = calculateFSR(tlrData.f || 0, tlrData.nt || 0, tlrData.np || 0);
      }
      (tlrData as TLRScores).total = (tlrData as TLRScores).ss + (tlrData as TLRScores).fsr + (tlrData as TLRScores).fqe + (tlrData as TLRScores).fru;
    }
    
    setSubmissions(prev => {
      const updatedSubmissions = prev.map(submission => {
        const updatedSubmission = {
          ...submission,
          sections: {
            ...submission.sections,
            [sectionName]: {
              ...submission.sections[sectionName],
              data: { ...scoreData } as SectionData,
              lastModified: new Date(),
              modifiedBy: 'admin' as const,
              adminNotes: adminNotes || submission.sections[sectionName]?.adminNotes
            }
          },
          scores: {
            ...submission.scores,
            [sectionName]: scoreData,
            overall: calculateOverallScore({
              ...submission.scores,
              [sectionName]: scoreData
            })
          }
        };
        
        console.log('Updated submission in DataContext:', updatedSubmission);
        return updatedSubmission;
      });
      
      console.log('All updated submissions:', updatedSubmissions);
      return updatedSubmissions;
    });
  };

  const value = {
    scores,
    submissions,
    currentSubmission,
    isEditing,
    tlrFormData,
    updateTLRData,
    updateTLRFormData,
    updateResearchData,
    updateGraduationData,
    updateOutreachData,
    updatePerceptionData,
    submitForApproval,
    approveSubmission,
    rejectSubmission,
    editSubmission,
    saveSubmissionChanges,
    cancelEdit,
    adminUpdateSection
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};