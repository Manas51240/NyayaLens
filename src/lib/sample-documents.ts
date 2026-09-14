import { LegalDocument } from '@/types/legal';

export const SAMPLE_DOCUMENTS: LegalDocument[] = [
  {
    id: 'sample-employment-agreement',
    title: 'Executive & Senior Engineer Employment Agreement',
    fileName: 'Employment_Agreement_Apex_Technologies.pdf',
    fileType: 'pdf',
    fileSize: 452300,
    uploadedAt: '2025-01-15T10:30:00Z',
    documentType: 'Employment Agreement',
    parties: [
      { name: 'Apex Cloud Solutions, Inc.', role: 'Employer' },
      { name: 'Alex Morgan', role: 'Employee' }
    ],
    effectiveDate: '2025-02-01',
    expirationDate: 'Indefinite (At-Will)',
    jurisdiction: 'State of California, County of Santa Clara',
    plainLanguageSummary:
      'This is a full-time employment agreement for a Senior Engineering role. While offering a competitive base salary and equity participation, it contains several high-priority review clauses: an expansive IP assignment clause that may capture personal inventions, a post-employment non-solicitation covenant, and a mandatory binding arbitration provision with a waiver of jury trial and class actions. Additionally, severance is conditioned on a broad general release of claims.',
    keyDates: [
      { label: 'Commencement Date', date: 'February 1, 2025', isCritical: true },
      { label: 'Probationary Review Period', date: 'May 1, 2025', isCritical: false },
      { label: 'Equity Cliff (1 Year)', date: 'February 1, 2026', isCritical: true }
    ],
    tags: ['Employment', 'Tech', 'IP Assignment', 'Arbitration'],
    rawText: `EMPLOYMENT AGREEMENT & PROPRIETARY INFORMATION ASSIGNMENT
THIS EMPLOYMENT AGREEMENT (the "Agreement") is entered into as of January 15, 2025, by and between Apex Cloud Solutions, Inc., a Delaware corporation ("Company"), and Alex Morgan ("Employee").

SECTION 1. POSITION AND DUTIES
1.1 Employment. Company hereby employs Employee as Principal Software Architect, reporting to the Chief Technology Officer.
1.2 At-Will Employment. Employee's employment with the Company is "at-will." Both Employee and Company may terminate the employment relationship at any time, with or without cause, and with or without advance notice.

SECTION 2. COMPENSATION AND BENEFITS
2.1 Base Salary. The Company shall pay Employee a base salary of $210,000 per annum, payable in accordance with Company standard payroll practices.
2.2 Incentive Equity. Subject to Board approval, Employee will be granted stock options for 45,000 shares of Common Stock, vesting over four (4) years with a one (1) year cliff.
2.3 Clawback Provision. Any performance bonuses paid shall be subject to recoupment or clawback within twenty-four (24) months if the financial results upon which they were based are subsequently restated.

SECTION 3. PROPRIETARY INFORMATION AND INVENTIONS ASSIGNMENT
3.1 Comprehensive Assignment. Employee hereby assigns to Company all right, title, and interest in and to any and all inventions, discoveries, designs, software, improvements, and trade secrets created, conceived, reduced to practice, or developed by Employee, solely or jointly with others, during the term of employment, whether or not during normal business hours and whether or not using Company equipment, if related directly or indirectly to the business of the Company or resulting from any work performed for Company.
3.2 Prior Inventions. Inventions created prior to employment must be listed on Exhibit A. Failure to disclose shall constitute an irrebuttable presumption that such invention was created during employment.

SECTION 4. RESTRICTIVE COVENANTS
4.1 Non-Solicitation of Customers and Employees. During employment and for a period of twelve (12) months immediately following termination of employment for any reason, Employee shall not directly or indirectly solicit, induce, or attempt to induce any employee, contractor, or customer of the Company to terminate or modify their relationship with the Company.
4.2 Non-Compete Undertaking. To the extent permitted by applicable law, Employee agrees not to engage in or provide services to any competing cloud infrastructure enterprise within a fifty (50) mile radius for six (6) months post-termination.

SECTION 5. DISPUTE RESOLUTION AND MANDATORY ARBITRATION
5.1 Binding Arbitration. Any dispute, controversy, or claim arising out of or relating to this Agreement or Employee's employment shall be settled exclusively by final and binding individual arbitration administered by JAMS in Santa Clara County, California.
5.2 Waiver of Jury Trial and Class Action. EMPLOYEE EXPRESSLY WAIVES ANY RIGHT TO A JURY TRIAL. EMPLOYEE FURTHER WAIVES ANY RIGHT TO PARTICIPATE AS A CLASS REPRESENTATIVE OR CLASS MEMBER IN ANY CLASS ACTION LAWSUIT OR CLASS ARBITRATION AGAINST THE COMPANY.

SECTION 6. SEVERANCE AND RELEASE
6.1 Termination Without Cause. If Company terminates Employee without Cause, Employee shall receive two (2) months base salary continuation, strictly conditioned upon Employee executing, within twenty-one (21) days, a comprehensive general release of all claims against Company and its affiliates.`,
    clauses: [
      {
        id: 'c1-ip-assignment',
        title: 'Broad Intellectual Property Assignment',
        category: 'Intellectual Property',
        originalText:
          'Employee hereby assigns to Company all right, title, and interest in and to any and all inventions, discoveries, designs, software, improvements, and trade secrets created, conceived, reduced to practice, or developed by Employee... whether or not during normal business hours and whether or not using Company equipment, if related directly or indirectly to the business of the Company.',
        plainEnglishTranslation:
          'The employer claims ownership over any software, designs, or inventions you develop during your employment period—even if developed on your personal time, outside working hours, and on your own personal computer, if it touches on the company’s broad business domain.',
        sourceSection: 'Section 3.1 (Comprehensive Assignment)',
        pageOrRef: 'Page 2, Section 3.1',
        severity: 'high',
        confidence: 94,
        suggestedAction:
          'Clarify carve-outs for side projects and ensure California Labor Code Section 2870 statutory exclusions are explicitly incorporated.'
      },
      {
        id: 'c2-arbitration-waiver',
        title: 'Mandatory Individual Arbitration & Class Action Waiver',
        category: 'Dispute Resolution',
        originalText:
          'Any dispute, controversy, or claim... shall be settled exclusively by final and binding individual arbitration... EMPLOYEE EXPRESSLY WAIVES ANY RIGHT TO A JURY TRIAL. EMPLOYEE FURTHER WAIVES ANY RIGHT TO PARTICIPATE AS A CLASS REPRESENTATIVE OR CLASS MEMBER IN ANY CLASS ACTION LAWSUIT.',
        plainEnglishTranslation:
          'If you have an employment dispute (such as unpaid wages, discrimination, or breach of contract), you cannot file a case in public court or join a collective class action. You must submit your dispute to private binding arbitration.',
        sourceSection: 'Section 5.1 & 5.2 (Dispute Resolution)',
        pageOrRef: 'Page 3, Section 5',
        severity: 'high',
        confidence: 96,
        suggestedAction:
          'Discuss with an attorney whether the employer pays all arbitration filing fees and whether statutory claims can be severed.'
      },
      {
        id: 'c3-non-compete',
        title: 'Post-Employment Non-Compete Provision',
        category: 'Restrictive Covenants',
        originalText:
          'Employee agrees not to engage in or provide services to any competing cloud infrastructure enterprise within a fifty (50) mile radius for six (6) months post-termination.',
        plainEnglishTranslation:
          'The contract seeks to stop you from working for a competing cloud company within 50 miles for 6 months after leaving.',
        sourceSection: 'Section 4.2 (Non-Compete Undertaking)',
        pageOrRef: 'Page 3, Section 4.2',
        severity: 'high',
        confidence: 98,
        suggestedAction:
          'Note: In California (Cal. Bus. & Prof. Code § 16600), post-employment non-compete clauses are generally void and unenforceable by statute. Verify with California legal counsel.'
      },
      {
        id: 'c4-bonus-clawback',
        title: '24-Month Performance Bonus Clawback',
        category: 'Compensation',
        originalText:
          'Any performance bonuses paid shall be subject to recoupment or clawback within twenty-four (24) months if the financial results upon which they were based are subsequently restated.',
        plainEnglishTranslation:
          'If the company restates its financial reports up to two years later, it can demand that you return bonuses you previously earned and received.',
        sourceSection: 'Section 2.3 (Clawback Provision)',
        pageOrRef: 'Page 1, Section 2.3',
        severity: 'medium',
        confidence: 91,
        suggestedAction:
          'Confirm whether clawback requires individual misconduct on your part or applies automatically even if you had no involvement in accounting errors.'
      }
    ],
    obligations: [
      {
        id: 'ob-1',
        party: 'Employee',
        description: 'Disclose all prior inventions and intellectual property on Exhibit A prior to signing.',
        deadline: 'Prior to contract execution',
        isRecurring: false,
        consequences: 'Irrebuttable presumption that undisclosed inventions belong to Company',
        sourceSection: 'Section 3.2'
      },
      {
        id: 'ob-2',
        party: 'Employee',
        description: 'Refrain from soliciting Company staff or clients for 12 months post-employment.',
        deadline: '12 months after separation',
        isRecurring: true,
        frequency: 'Continuous during restricted period',
        consequences: 'Potential injunctive relief and damages claim',
        sourceSection: 'Section 4.1'
      },
      {
        id: 'ob-3',
        party: 'Company',
        description: 'Provide 2 months salary continuation if terminated without Cause, subject to release.',
        deadline: 'Within standard payroll cycle post-release',
        isRecurring: false,
        consequences: 'Forfeiture if release is not executed within 21 days',
        sourceSection: 'Section 6.1'
      }
    ],
    risks: [
      {
        id: 'risk-1',
        category: 'restrictive covenants',
        severity: 'high',
        title: 'Potentially Unlawful Post-Employment Non-Compete',
        explanation:
          'The document includes a 6-month non-compete within a 50-mile radius. In California, post-termination non-compete covenants are generally void as a matter of public policy under Business and Professions Code § 16600, and recent statutory amendments require employers to notify employees that such clauses are void.',
        sourceSection: 'Section 4.2',
        pageOrRef: 'Page 3',
        quote: 'Employee agrees not to engage in or provide services to any competing cloud infrastructure enterprise within a fifty (50) mile radius for six (6) months post-termination.',
        confidence: 97,
        reviewRecommendation: 'Request company counsel to strike Section 4.2 entirely in accordance with California law.',
        suggestedQuestionForLawyer: 'Should we request removal of Section 4.2 given California SB 699 and AB 1076 protections?'
      },
      {
        id: 'risk-2',
        category: 'unusual obligations',
        severity: 'high',
        title: 'Overly Broad Assignment of Off-Hours Inventions',
        explanation:
          'Section 3.1 claims inventions made "whether or not during normal business hours and whether or not using Company equipment." Without statutory qualification, this could compromise personal open-source projects or unrelated side software.',
        sourceSection: 'Section 3.1',
        pageOrRef: 'Page 2',
        quote: 'whether or not during normal business hours and whether or not using Company equipment, if related directly or indirectly to the business of the Company',
        confidence: 93,
        reviewRecommendation: 'Incorporate explicit statutory language guaranteeing Employee retains ownership of independent inventions created without Company resources.',
        suggestedQuestionForLawyer: 'How can we carve out my existing GitHub projects and future hobby applications in Exhibit A?'
      },
      {
        id: 'risk-3',
        category: 'dispute resolution',
        severity: 'medium',
        title: 'Mandatory Binding Arbitration with Class Action Waiver',
        explanation:
          'The clause requires confidential JAMS arbitration and waives trial by jury and class actions. While common in corporate agreements, it limits procedural avenues in the event of systemic or individual employment disputes.',
        sourceSection: 'Section 5.1 & 5.2',
        pageOrRef: 'Page 3',
        quote: 'EMPLOYEE EXPRESSLY WAIVES ANY RIGHT TO A JURY TRIAL. EMPLOYEE FURTHER WAIVES ANY RIGHT TO PARTICIPATE AS A CLASS REPRESENTATIVE',
        confidence: 95,
        reviewRecommendation: 'Verify that employer bears all arbitration administrative costs above initial court equivalent filing fee.',
        suggestedQuestionForLawyer: 'Does this arbitration agreement comply with California Armendariz procedural fairness rules?'
      },
      {
        id: 'risk-4',
        category: 'penalties',
        severity: 'medium',
        title: 'Broad Clawback of Performance Bonuses',
        explanation:
          'Allows Company to recoup paid bonuses for up to 24 months upon financial restatement, without requiring a showing of fault, fraud, or negligence by the Employee.',
        sourceSection: 'Section 2.3',
        pageOrRef: 'Page 1',
        quote: 'Any performance bonuses paid shall be subject to recoupment or clawback within twenty-four (24) months if the financial results upon which they were based are subsequently restated.',
        confidence: 88,
        reviewRecommendation: 'Seek language specifying that clawback only applies if restatement is caused directly by Employee gross misconduct.',
        suggestedQuestionForLawyer: 'Is this clawback standard for non-executive engineering positions, and can we limit it to willful misconduct?'
      }
    ],
    actionItems: [
      {
        id: 'act-1',
        priority: 'high',
        action: 'Prepare comprehensive Exhibit A detailing all personal code, patents, and projects.',
        timeline: 'Before signing',
        category: 'Intellectual Property Protection',
        suggestedQuestionsForLawyer: [
          'What degree of specificity is recommended for Exhibit A disclosures?',
          'Does listing a personal open source repo protect future contributions?'
        ],
        documentsToGather: ['List of personal GitHub repositories', 'Registered domain names', 'Existing patent filings']
      },
      {
        id: 'act-2',
        priority: 'high',
        action: 'Request strike of Section 4.2 Non-Compete provision.',
        timeline: 'During contract negotiation',
        category: 'Restrictive Covenants',
        suggestedQuestionsForLawyer: [
          'Can the employer penalize me for requesting removal of an unenforceable California non-compete?'
        ],
        documentsToGather: ['Company offer letter', 'Standard California Labor Code Section 2870 notice']
      },
      {
        id: 'act-3',
        priority: 'medium',
        action: 'Review Severance release timeline and negotiate 3 months continuation.',
        timeline: 'Within 5 business days',
        category: 'Severance Terms',
        suggestedQuestionsForLawyer: [
          'Is 2 months severance typical for this seniority level in the Bay Area?'
        ]
      }
    ],
    consultationBrief: {
      documentPurpose: 'Employment Agreement for Principal Software Architect position at Apex Cloud Solutions, Inc.',
      parties: [
        { name: 'Apex Cloud Solutions, Inc.', role: 'Employer (Delaware Corp)' },
        { name: 'Alex Morgan', role: 'Employee (Individual)' }
      ],
      governingLawAndJurisdiction: 'California law; mandatory arbitration in Santa Clara County, CA.',
      keyBusinessTerms: [
        'Base compensation: $210,000 per year',
        'Equity grant: 45,000 Common Stock options with 1-year cliff / 4-year vest',
        'Severance: 2 months salary continuation upon termination without cause'
      ],
      highPriorityConcerns: [
        'Section 4.2 non-compete clause conflicts with Cal. Bus. & Prof. Code § 16600',
        'Section 3.1 IP assignment lacks statutory carve-outs for off-hours personal inventions',
        'Section 2.3 bonus clawback triggers on accounting restatements regardless of fault'
      ],
      questionsForCounsel: [
        {
          topic: 'California Non-Compete Legality',
          question: 'Does the inclusion of Section 4.2 create legal exposure for the employer under recent California statutory updates, and should we request it be formally stricken?',
          rationale: 'California law voids employee non-competes and requires employers to issue retraction notices.'
        },
        {
          topic: 'IP Carve-Out Exhibit',
          question: 'How should I structure the prior inventions disclosure in Exhibit A to protect pre-existing personal open source libraries?',
          rationale: 'Failure to list creates an irrebuttable presumption of company ownership.'
        },
        {
          topic: 'Arbitration Agreement Enforceability',
          question: 'Does Section 5 comply with California Armendariz requirements regarding employer-funded forum fees?',
          rationale: 'Mandatory arbitration agreements must satisfy due process standards to be enforceable.'
        }
      ],
      relevantSectionsToHighlight: [
        'Section 2.3 (Clawback)',
        'Section 3.1 (Invention Assignment)',
        'Section 4.2 (Non-Compete)',
        'Section 5.1-5.2 (Arbitration & Class Action Waiver)'
      ],
      disclaimerNotice:
        'Notice: This consultation brief was generated by NyayaLens AI to structure your initial attorney meeting and prioritize discussion points. It does not provide legal advice, legal representation, or a definitive legal opinion.'
    }
  },
  {
    id: 'sample-commercial-lease',
    title: 'Triple-Net (NNN) Commercial Suite Lease Agreement',
    fileName: 'Commercial_Lease_Metropolitan_Tower.pdf',
    fileType: 'pdf',
    fileSize: 684200,
    uploadedAt: '2025-01-18T14:15:00Z',
    documentType: 'Commercial Lease Agreement',
    parties: [
      { name: 'Metropolitan Real Estate Holdings LLC', role: 'Landlord' },
      { name: 'BlueStar Hospitality Partners LLC', role: 'Tenant' }
    ],
    effectiveDate: '2025-03-01',
    expirationDate: '2030-02-28 (5 Years)',
    jurisdiction: 'State of New York, County of New York',
    plainLanguageSummary:
      'A 5-year commercial lease for Suite 400. This is a strict Triple Net (NNN) lease where the tenant is responsible for base rent plus proportionate shares of real property taxes, building insurance, and capital common area operating expenses. Significant clauses include a 200% holdover rent penalty, personal guarantee requirement by managing members, and a 3-mile radius restriction against opening affiliated businesses.',
    keyDates: [
      { label: 'Lease Commencement', date: 'March 1, 2025', isCritical: true },
      { label: 'Rent Abatement Expiry (Free Rent)', date: 'June 1, 2025', isCritical: true },
      { label: 'Notice Window for 5-Year Extension', date: 'August 31, 2029', isCritical: true }
    ],
    tags: ['Real Estate', 'Commercial Lease', 'Triple Net', 'Personal Guarantee'],
    rawText: `COMMERCIAL LEASE AGREEMENT (TRIPLE NET)
METROPOLITAN TOWER, NEW YORK, NY

ARTICLE 1. PREMISES AND TERM
1.1 Demised Premises. Landlord hereby leases to Tenant Suite 400 (approximately 3,200 rentable square feet).
1.2 Term. The Term shall be five (5) consecutive years commencing on March 1, 2025 ("Commencement Date").

ARTICLE 2. RENT AND OPERATING EXPENSES (TRIPLE NET)
2.1 Base Monthly Rent. Tenant agrees to pay Landlord Base Rent of $16,000.00 per month, escalating by 3.5% annually.
2.2 Additional Rent (Triple Net). Tenant shall pay its Proportionate Share (14.2%) of all Operating Expenses, including Real Estate Taxes, Insurance Premiums, and Capital Improvements amortized over their useful life.
2.3 Uncapped Operating Cost Escalations. Operating Expenses shall not be subject to any annual percentage cap.

ARTICLE 3. SECURITY DEPOSIT AND PERSONAL GUARANTEE
3.1 Security Deposit. Tenant shall deposit $48,000.00 (3 months rent) upon execution.
3.2 Unconditional Personal Guarantee. The performance of all Tenant obligations shall be unconditionally guaranteed jointly and severally by John Doe and Jane Smith in their individual capacities pursuant to Exhibit D ("Good Guy Guarantee").

ARTICLE 4. ALTERATIONS AND REPAIRS
4.1 Tenant Maintenance. Tenant shall, at its sole cost, maintain, repair, and replace all HVAC units serving the Premises.
4.2 Surrender Condition. Upon expiration, Tenant must restore Premises to original shell condition unless Landlord waives in writing.

ARTICLE 5. RESTRICTIVE COVENANTS AND EXCLUSIVITY
5.1 Radius Restriction. During the Term and any renewals, Tenant, its principals, and affiliates shall not own, operate, or franchise any similar food or beverage establishment within a three (3) mile radius of the Building.

ARTICLE 6. HOLDOVER AND DEFAULT
6.1 Holdover Damages. If Tenant remains in possession after expiration without written consent, Tenant shall pay Holdover Rent equal to two hundred percent (200%) of the most recent Base Rent plus full indemnity for Landlord consequential damages.`,
    clauses: [
      {
        id: 'cl-lease-1',
        title: 'Uncapped Operating Expenses (Triple Net Pass-Through)',
        category: 'Payment',
        originalText:
          'Tenant shall pay its Proportionate Share (14.2%) of all Operating Expenses, including Real Estate Taxes, Insurance Premiums, and Capital Improvements... Operating Expenses shall not be subject to any annual percentage cap.',
        plainEnglishTranslation:
          'You are responsible for 14.2% of all building costs, including tax hikes and major building renovations, with no yearly ceiling or cap.',
        sourceSection: 'Article 2, Section 2.2 & 2.3',
        pageOrRef: 'Page 3, Article 2',
        severity: 'high',
        confidence: 96,
        suggestedAction:
          'Negotiate a 5% cumulative annual cap on controllable operating expenses and exclude capital replacements.'
      },
      {
        id: 'cl-lease-2',
        title: '200% Holdover Penalty Rent',
        category: 'Penalties',
        originalText:
          'If Tenant remains in possession after expiration... Tenant shall pay Holdover Rent equal to two hundred percent (200%) of the most recent Base Rent plus full indemnity for Landlord consequential damages.',
        plainEnglishTranslation:
          'If you stay in the space past lease expiration while moving or negotiating an extension, rent doubles immediately, and you are liable for any damages Landlord suffers if an incoming tenant sues.',
        sourceSection: 'Article 6, Section 6.1',
        pageOrRef: 'Page 8, Article 6',
        severity: 'high',
        confidence: 95,
        suggestedAction:
          'Reduce holdover rate to 125% for the first 30 days and eliminate consequential damages.'
      },
      {
        id: 'cl-lease-3',
        title: 'Three-Mile Radius Restriction',
        category: 'Restrictive Covenants',
        originalText:
          'Tenant, its principals, and affiliates shall not own, operate, or franchise any similar food or beverage establishment within a three (3) mile radius of the Building.',
        plainEnglishTranslation:
          'You and your business partners cannot open another location or affiliated restaurant within a 3-mile radius in Manhattan during the 5-year lease.',
        sourceSection: 'Article 5, Section 5.1',
        pageOrRef: 'Page 6, Article 5',
        severity: 'medium',
        confidence: 92,
        suggestedAction:
          'Narrow radius to 0.5 miles or exclude pre-existing brands and distinct dining concepts.'
      }
    ],
    obligations: [
      {
        id: 'obl-lease-1',
        party: 'Tenant',
        description: 'Maintain, repair, and replace HVAC units serving Suite 400 at Tenant expense.',
        deadline: 'Ongoing throughout lease term',
        isRecurring: true,
        frequency: 'Quarterly maintenance contracts required',
        consequences: 'Landlord performs work at 115% administrative markup',
        sourceSection: 'Article 4, Section 4.1'
      },
      {
        id: 'obl-lease-2',
        party: 'Tenant',
        description: 'Provide written notice of intent to exercise 5-year extension option.',
        deadline: 'Not later than 180 days prior to lease expiration (August 31, 2029)',
        isRecurring: false,
        consequences: 'Irrevocable forfeiture of renewal option',
        sourceSection: 'Article 1, Section 1.3'
      }
    ],
    risks: [
      {
        id: 'risk-lease-1',
        category: 'liability',
        severity: 'high',
        title: 'Uncapped Consequential Damages in Holdover Clause',
        explanation:
          'In addition to a punitive 200% rent penalty, the holdover clause exposes the tenant to consequential damages if a successor tenant cancels their lease.',
        sourceSection: 'Article 6.1',
        quote: 'Tenant shall pay Holdover Rent equal to two hundred percent (200%) of the most recent Base Rent plus full indemnity for Landlord consequential damages.',
        confidence: 96,
        reviewRecommendation: 'Seek waiver of consequential damages and limit holdover rent to 125%-150%.',
        suggestedQuestionForLawyer: 'How can we cap holdover liability to avoid ruinous successor tenant claims?'
      },
      {
        id: 'risk-lease-2',
        category: 'payment',
        severity: 'high',
        title: 'Uncapped Operating Expenses (CAM Pass-Through)',
        explanation:
          'Section 2.3 explicitly denies any cap on operating costs. In an older building, sudden roof or structural repairs could result in unpredictable multi-thousand dollar monthly assessments.',
        sourceSection: 'Article 2.3',
        quote: 'Operating Expenses shall not be subject to any annual percentage cap.',
        confidence: 94,
        reviewRecommendation: 'Insist on a 5% cap on controllable common area maintenance (CAM) costs.',
        suggestedQuestionForLawyer: 'What CAM exclusions are market standard for midtown commercial leases?'
      },
      {
        id: 'risk-lease-3',
        category: 'restrictive covenants',
        severity: 'medium',
        title: '3-Mile Radius Restriction on Affiliated Ventures',
        explanation:
          'A 3-mile radius in New York City covers nearly all of Midtown and Downtown, severely limiting future expansion or pop-up locations for the hospitality group.',
        sourceSection: 'Article 5.1',
        quote: 'shall not own, operate, or franchise any similar food or beverage establishment within a three (3) mile radius',
        confidence: 92,
        reviewRecommendation: 'Propose reducing restriction to 10 city blocks or distinct concept names.',
        suggestedQuestionForLawyer: 'Can we carve out future catering operations and distinct cuisine concepts?'
      }
    ],
    actionItems: [
      {
        id: 'act-lease-1',
        priority: 'high',
        action: 'Request professional HVAC inspection before signing to document existing unit condition.',
        timeline: 'Before signing lease',
        category: 'Due Diligence',
        suggestedQuestionsForLawyer: ['Can we limit tenant obligation to repair, while landlord handles capital replacement?'],
        documentsToGather: ['HVAC service records from past 2 years', 'Building MEP specs']
      },
      {
        id: 'act-lease-2',
        priority: 'high',
        action: 'Review personal guarantee scope with real estate counsel.',
        timeline: 'Within 7 business days',
        category: 'Guarantor Protection',
        suggestedQuestionsForLawyer: ['Can we convert this to a standard Good Guy Guarantee that terminates upon surrender?']
      }
    ],
    consultationBrief: {
      documentPurpose: '5-Year Commercial Lease for Suite 400 at Metropolitan Tower.',
      parties: [
        { name: 'Metropolitan Real Estate Holdings LLC', role: 'Landlord' },
        { name: 'BlueStar Hospitality Partners LLC', role: 'Tenant' }
      ],
      governingLawAndJurisdiction: 'New York State law, New York County venue.',
      keyBusinessTerms: [
        'Base Rent: $16,000/mo with 3.5% annual escalation',
        'Triple Net: 14.2% proportionate share of operating costs and taxes',
        'Security Deposit: $48,000'
      ],
      highPriorityConcerns: [
        'Uncapped NNN operating expenses include capital improvements',
        '200% holdover rent plus consequential damages',
        'Personal guarantee required by individual partners'
      ],
      questionsForCounsel: [
        {
          topic: 'Operating Expense Caps',
          question: 'Can we insert a 5% cap on controllable CAM expenses and specifically exclude capital improvements?',
          rationale: 'Protect against sudden spikes in landlord capital expenditures.'
        },
        {
          topic: 'Good Guy Guarantee Terms',
          question: 'Does the draft guarantee terminate upon surrender of space with 90 days notice, or does liability continue through the 5 years?',
          rationale: 'Avoid personal insolvency risk for managing partners.'
        }
      ],
      relevantSectionsToHighlight: ['Article 2.2-2.3 (NNN)', 'Article 3.2 (Guarantee)', 'Article 6.1 (Holdover)'],
      disclaimerNotice:
        'Notice: This consultation brief was generated by NyayaLens AI to structure your initial attorney meeting and prioritize discussion points. It does not provide legal advice, legal representation, or a definitive legal opinion.'
    }
  },
  {
    id: 'sample-saas-msa',
    title: 'Enterprise Master Services Agreement (SaaS Vendor)',
    fileName: 'Enterprise_Cloud_MSA_v2.docx',
    fileType: 'docx',
    fileSize: 312000,
    uploadedAt: '2025-01-20T16:45:00Z',
    documentType: 'Master Services Agreement (SaaS)',
    parties: [
      { name: 'OmniData Cloud Solutions LLC', role: 'Provider' },
      { name: 'Horizon Global Enterprises Inc.', role: 'Customer' }
    ],
    effectiveDate: '2025-04-01',
    expirationDate: '2026-03-31 (Annual Auto-Renew)',
    jurisdiction: 'State of Delaware',
    plainLanguageSummary:
      'A multi-tier SaaS platform licensing agreement. Key commercial terms include an automatic renewal clause requiring 90-day advance notice to cancel, a one-sided limitation of liability capping Provider damages to 1 month of subscription fees while Customer liability remains uncapped, and unilateral right for the Provider to modify service terms and pricing with 30 days email notice.',
    keyDates: [
      { label: 'Effective Date', date: 'April 1, 2025', isCritical: true },
      { label: 'Auto-Renewal Notice Deadline', date: 'December 31, 2025 (90 Days Prior)', isCritical: true }
    ],
    tags: ['SaaS', 'Vendor Contract', 'Limitation of Liability', 'Auto-Renewal'],
    rawText: `MASTER SERVICES AGREEMENT
THIS MASTER SERVICES AGREEMENT is made between OmniData Cloud Solutions LLC ("Provider") and Horizon Global Enterprises Inc. ("Customer").

SECTION 1. SUBSCRIPTION AND ACCESS
1.1 Cloud Services. Provider grants Customer a non-exclusive, non-transferable subscription to access the OmniData Platform.

SECTION 2. TERM AND AUTOMATIC RENEWAL
2.1 Term. Initial term of one (1) year.
2.2 Automatic Renewal. This Agreement shall automatically renew for successive one-year terms unless either party gives written notice of non-renewal at least ninety (90) days prior to the expiration of the then-current term.

SECTION 3. FEES AND PAYMENT
3.1 Payment Terms. Invoices are payable Net 15 days from invoice date. Overdue balances accrue 1.5% interest per month.
3.2 Price Modifications. Provider reserves the right to increase annual subscription fees by up to 12% upon thirty (30) days prior written notice.

SECTION 4. LIMITATION OF LIABILITY
4.1 Provider Cap. TO THE MAXIMUM EXTENT PERMITTED BY LAW, PROVIDER'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS OF ANY KIND SHALL BE STRICTLY LIMITED TO THE FEES ACTUALLY PAID BY CUSTOMER IN THE ONE (1) MONTH PRECEDING THE CLAIM.
4.2 Customer Liability. Customer's liability for breach of confidentiality, IP infringement, or indemnification shall not be subject to any financial cap.

SECTION 5. DATA PRIVACY AND SECURITY
5.1 Customer Data. Customer retains ownership of Customer Data. Provider may utilize anonymized aggregated data for model training and product enhancement.
5.2 Security Standard. Provider will maintain commercially reasonable administrative and technical safeguards.`,
    clauses: [
      {
        id: 'cl-saas-1',
        title: 'Asymmetric 1-Month Liability Cap',
        category: 'Liability',
        originalText:
          "PROVIDER'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS OF ANY KIND SHALL BE STRICTLY LIMITED TO THE FEES ACTUALLY PAID BY CUSTOMER IN THE ONE (1) MONTH PRECEDING THE CLAIM.",
        plainEnglishTranslation:
          'If the software suffers a catastrophic outage, data loss, or security failure, the most you can recover is equal to just 1 month of your subscription fee—even if damages cost millions.',
        sourceSection: 'Section 4.1 (Limitation of Liability)',
        pageOrRef: 'Page 4, Section 4.1',
        severity: 'high',
        confidence: 97,
        suggestedAction:
          'Demand a mutual liability cap equal to 12 months of total fees paid, with standard carve-outs for data breaches and gross negligence.'
      },
      {
        id: 'cl-saas-2',
        title: '90-Day Advance Auto-Renewal Notice Window',
        category: 'Renewal',
        originalText:
          'automatically renew for successive one-year terms unless either party gives written notice of non-renewal at least ninety (90) days prior to the expiration',
        plainEnglishTranslation:
          'If you decide not to renew, you must provide written notice a full 3 months before your contract anniversary. If you miss that date by even one day, you are locked in for another full year.',
        sourceSection: 'Section 2.2 (Automatic Renewal)',
        pageOrRef: 'Page 2, Section 2.2',
        severity: 'medium',
        confidence: 94,
        suggestedAction:
          'Reduce notice window from 90 days to 30 days and add a requirement for Provider to send a 60-day reminder.'
      }
    ],
    obligations: [
      {
        id: 'obl-saas-1',
        party: 'Customer',
        description: 'Provide written notice of non-renewal at least 90 days before annual anniversary.',
        deadline: 'December 31, 2025',
        isRecurring: true,
        frequency: 'Annually before renewal date',
        consequences: 'Automatic renewal and lock-in for full additional year of fees',
        sourceSection: 'Section 2.2'
      }
    ],
    risks: [
      {
        id: 'risk-saas-1',
        category: 'liability',
        severity: 'high',
        title: 'Severely Asymmetric 1-Month Liability Cap',
        explanation:
          'The vendor caps its maximum liability at 1 single month of paid fees, leaving customer unprotected in the event of a significant data breach, service loss, or regulatory fines.',
        sourceSection: 'Section 4.1',
        quote: "PROVIDER'S TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS OF ANY KIND SHALL BE STRICTLY LIMITED TO THE FEES ACTUALLY PAID BY CUSTOMER IN THE ONE (1) MONTH PRECEDING THE CLAIM.",
        confidence: 98,
        reviewRecommendation: 'Require a 12-month trailing fee cap and a separate super-cap for data protection breaches.',
        suggestedQuestionForLawyer: 'What is standard liability exposure for enterprise SaaS procurement in this tier?'
      },
      {
        id: 'risk-saas-2',
        category: 'renewal',
        severity: 'medium',
        title: 'Strict 90-Day Auto-Renewal Trap',
        explanation:
          '90 days advance notice is unusually long for software agreements and often catches procurement teams off guard, triggering involuntary multi-thousand dollar renewals.',
        sourceSection: 'Section 2.2',
        quote: 'unless either party gives written notice of non-renewal at least ninety (90) days prior to the expiration',
        confidence: 92,
        reviewRecommendation: 'Negotiate down to 30 days written notice.',
        suggestedQuestionForLawyer: 'Can we add a reminder obligation requiring the vendor to notify us 30 days before the notice deadline?'
      }
    ],
    actionItems: [
      {
        id: 'act-saas-1',
        priority: 'high',
        action: 'Put December 15, 2025 calendar alert for 90-day renewal deadline.',
        timeline: 'Immediately upon execution',
        category: 'Contract Administration',
        suggestedQuestionsForLawyer: ['Does email notice suffice, or is certified mail required?']
      }
    ],
    consultationBrief: {
      documentPurpose: 'Cloud SaaS Platform Subscription Agreement with OmniData.',
      parties: [
        { name: 'OmniData Cloud Solutions LLC', role: 'Provider' },
        { name: 'Horizon Global Enterprises Inc.', role: 'Customer' }
      ],
      governingLawAndJurisdiction: 'Delaware law.',
      keyBusinessTerms: [
        'Annual contract with 90-day auto-renewal notice requirement',
        'Net 15 payment terms with 1.5% monthly late interest',
        'Annual price increase of up to 12% on 30-day notice'
      ],
      highPriorityConcerns: [
        'Provider liability capped at 1 month of fees',
        'Customer data may be utilized in aggregated models without explicit opt-out',
        'Strict 90-day renewal notice window'
      ],
      questionsForCounsel: [
        {
          topic: 'Limitation of Liability',
          question: 'Can we negotiate a 12-month cap on liability with an indemnification carve-out?',
          rationale: 'A 1-month cap creates unacceptable risk exposure in the event of an outage or data loss.'
        }
      ],
      relevantSectionsToHighlight: ['Section 2.2 (Auto-Renewal)', 'Section 4.1 (Liability)', 'Section 5.1 (Data Usage)'],
      disclaimerNotice:
        'Notice: This consultation brief was generated by NyayaLens AI to structure your initial attorney meeting and prioritize discussion points. It does not provide legal advice, legal representation, or a definitive legal opinion.'
    }
  },
  {
    id: 'sample-nda-mutual',
    title: 'Standard Mutual Non-Disclosure Agreement (v1 Base)',
    fileName: 'Mutual_NDA_Standard_v1.docx',
    fileType: 'docx',
    fileSize: 184000,
    uploadedAt: '2025-01-22T09:00:00Z',
    documentType: 'Non-Disclosure Agreement',
    parties: [
      { name: 'VentureLabs Inc.', role: 'Disclosing / Receiving Party' },
      { name: 'CyberShield Systems LLC', role: 'Disclosing / Receiving Party' }
    ],
    effectiveDate: '2025-01-20',
    expirationDate: '2027-01-20 (2 Years)',
    jurisdiction: 'State of Delaware',
    plainLanguageSummary:
      'A mutual, two-way Non-Disclosure Agreement for preliminary strategic partnership evaluations. Both parties protect confidential information disclosed for a 2-year duration. Standard exceptions apply (public knowledge, prior possession, independent development). Disputes are governed by Delaware law with mutual fee-shifting for the prevailing party.',
    keyDates: [
      { label: 'Execution Date', date: 'January 20, 2025', isCritical: false },
      { label: 'Confidentiality Expiration', date: 'January 20, 2027', isCritical: true }
    ],
    tags: ['NDA', 'Mutual', 'Confidentiality', 'Delaware'],
    rawText: `MUTUAL NON-DISCLOSURE AGREEMENT
This Mutual Non-Disclosure Agreement is made as of January 20, 2025, between VentureLabs Inc. ("Party A") and CyberShield Systems LLC ("Party B").

1. PURPOSE
The parties wish to explore a potential strategic business collaboration ("Purpose").

2. CONFIDENTIAL INFORMATION
Confidential Information means all technical, business, financial, or product information disclosed by either party, whether oral or written, marked as confidential or that reasonably should be understood to be confidential.

3. OBLIGATIONS OF RECEIVING PARTY
The Receiving Party shall: (a) hold Confidential Information in strict confidence, exercising at least the same degree of care used for its own confidential information; (b) restrict disclosure solely to employees with a need-to-know; and (c) not use information except for the Purpose.

4. EXCLUSIONS
Confidential Information does not include information that: (a) is or becomes publicly known without breach; (b) was in Receiving Party's possession prior to disclosure; (c) is independently developed without reference to disclosed information; or (d) is rightfully received from a third party.

5. TERM AND SURVIVAL
This Agreement shall remain in effect for two (2) years from the Effective Date, after which confidentiality obligations shall survive for an additional three (3) years.

6. GOVERNING LAW AND ATTORNEYS' FEES
Governing law: Delaware. The prevailing party in any action to enforce this Agreement shall be entitled to recover reasonable attorneys' fees and costs.`,
    clauses: [
      {
        id: 'cl-nda-1',
        title: 'Mutual Protection Standard',
        category: 'Confidentiality',
        originalText:
          'The Receiving Party shall: (a) hold Confidential Information in strict confidence... exercising at least the same degree of care used for its own confidential information',
        plainEnglishTranslation:
          'Both sides have equal duties to keep each other’s business secrets safe using reasonable commercial standards.',
        sourceSection: 'Section 3',
        pageOrRef: 'Page 1, Section 3',
        severity: 'low',
        confidence: 98,
        suggestedAction: 'Acceptable balanced standard.'
      }
    ],
    obligations: [
      {
        id: 'obl-nda-1',
        party: 'Both Parties',
        description: 'Maintain strict confidentiality of disclosed proprietary materials for 3 years post-term.',
        deadline: 'January 20, 2030',
        isRecurring: true,
        frequency: 'Continuous',
        consequences: 'Injunctive relief and reasonable attorney fees',
        sourceSection: 'Section 3 & 5'
      }
    ],
    risks: [
      {
        id: 'risk-nda-1',
        category: 'confidentiality',
        severity: 'low',
        title: '3-Year Post-Term Survival Period',
        explanation: 'Standard duration for commercial confidentiality; trade secrets should ideally be protected indefinitely.',
        sourceSection: 'Section 5',
        quote: 'shall remain in effect for two (2) years... after which confidentiality obligations shall survive for an additional three (3) years.',
        confidence: 95,
        reviewRecommendation: 'Consider adding explicit perpetual protection for trade secrets.',
        suggestedQuestionForLawyer: 'Should we carve out trade secrets from the 3-year survival limit?'
      }
    ],
    actionItems: [
      {
        id: 'act-nda-1',
        priority: 'low',
        action: 'Ensure all disclosed design docs are stamped "CONFIDENTIAL - VENTURELABS".',
        timeline: 'At all meetings',
        category: 'Compliance',
        suggestedQuestionsForLawyer: []
      }
    ],
    consultationBrief: {
      documentPurpose: 'Mutual NDA for preliminary strategic collaboration talks.',
      parties: [
        { name: 'VentureLabs Inc.', role: 'Party A' },
        { name: 'CyberShield Systems LLC', role: 'Party B' }
      ],
      governingLawAndJurisdiction: 'Delaware law.',
      keyBusinessTerms: ['2-year term with 3-year survival', 'Mutual duty of reasonable care', 'Mutual fee shifting'],
      highPriorityConcerns: ['Trade secrets expire after 3-year survival period rather than perpetual protection'],
      questionsForCounsel: [
        {
          topic: 'Trade Secret Longevity',
          question: 'Should we carve out source code and core trade secrets to survive indefinitely rather than 3 years?',
          rationale: 'Software algorithms retain value beyond 3 years.'
        }
      ],
      relevantSectionsToHighlight: ['Section 2', 'Section 5'],
      disclaimerNotice:
        'Notice: This consultation brief was generated by NyayaLens AI to structure your initial attorney meeting and prioritize discussion points. It does not provide legal advice, legal representation, or a definitive legal opinion.'
    }
  }
];

export const SAMPLE_NDA_V2_REVISED: LegalDocument = {
  id: 'sample-nda-vendor-revised',
  title: 'Vendor Modified NDA (v2 Counterparty Redline)',
  fileName: 'Mutual_NDA_Vendor_Redline_v2.docx',
  fileType: 'docx',
  fileSize: 198000,
  uploadedAt: '2025-01-24T11:20:00Z',
  documentType: 'Non-Disclosure Agreement (Redline)',
  parties: [
    { name: 'VentureLabs Inc.', role: 'Receiving Party' },
    { name: 'CyberShield Systems LLC', role: 'Disclosing Party' }
  ],
  effectiveDate: '2025-01-24',
  expirationDate: '2030-01-24 (5 Years)',
  jurisdiction: 'State of New York',
  plainLanguageSummary:
    'Vendor modified redline version of the NDA. Changes the agreement from mutual to largely unilateral (one-way in favor of CyberShield), extends survival from 3 years to 10 years, removes prevailing party attorney fees clause, and changes jurisdiction to New York.',
  keyDates: [{ label: 'Effective Date', date: 'January 24, 2025', isCritical: false }],
  tags: ['NDA', 'Vendor Redline', 'Unilateral', 'Comparison Target'],
  rawText: `MUTUAL NON-DISCLOSURE AGREEMENT (AMENDED REDLINE)
SECTION 1. PURPOSE: Evaluation of strategic business collaboration.
SECTION 2. CONFIDENTIAL INFORMATION: Expanded to include all oral conversations without requirement of written confirmation.
SECTION 3. OBLIGATIONS: Receiving Party (VentureLabs) shall maintain confidentiality for ten (10) years. Disclosing Party (CyberShield) shall have no reciprocal obligation regarding information received from VentureLabs.
SECTION 4. REMEDIES: Disclosing Party shall be entitled to immediate liquidated damages of $100,000 per violation.
SECTION 5. GOVERNING LAW: State of New York. Prevailing party fee shifting is deleted.`,
  clauses: [],
  obligations: [],
  risks: [],
  actionItems: [],
  consultationBrief: {
    documentPurpose: 'Vendor redline of standard NDA.',
    parties: [],
    governingLawAndJurisdiction: 'New York',
    keyBusinessTerms: [],
    highPriorityConcerns: [],
    questionsForCounsel: [],
    relevantSectionsToHighlight: [],
    disclaimerNotice: 'Consultation Brief'
  }
};
