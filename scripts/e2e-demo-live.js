const fs = require('fs');
const path = require('path');

async function runLiveAudit() {
  console.log('===============================================================');
  console.log('NYAYALENS II2S EXCLUSIVE — LIVE SERVER END-TO-END AUDIT');
  console.log('===============================================================\n');

  const BASE_URL = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');

  // 1. Health Check
  console.log('[1/7] Testing /api/health...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  console.log('Health Status:', healthRes.status, healthData);
  if (healthRes.status !== 200) throw new Error('Health check failed');

  // 2. Upload NyayaLens_Demo_Legal_Agreement.pdf
  console.log('\n[2/7] Uploading NyayaLens_Demo_Legal_Agreement.pdf to /api/analyze...');
  const pdfPath = path.resolve(__dirname, '..', 'NyayaLens_Demo_Legal_Agreement.pdf');
  const pdfBuffer = fs.readFileSync(pdfPath);

  const formData = new FormData();
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  formData.append('file', blob, 'NyayaLens_Demo_Legal_Agreement.pdf');

  const uploadRes = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    body: formData,
  });

  const uploadData = await uploadRes.json();
  console.log('Upload Status:', uploadRes.status);
  if (!uploadRes.ok || !uploadData.document) {
    console.error('Upload Error:', uploadData);
    throw new Error('Upload failed');
  }

  const doc = uploadData.document;
  console.log('Document ID:', doc.id);
  console.log('Document Title:', doc.title);
  console.log('Document Type:', doc.documentType);
  console.log('Parties:', doc.parties);
  console.log('Jurisdiction:', doc.jurisdiction);
  console.log('Extracted Clauses Count:', doc.clauses.length);
  console.log('Identified Risks Count:', doc.risks.length);
  console.log('Obligations Count:', doc.obligations.length);

  // 3. Question 1: Termination Conditions
  console.log('\n[3/7] Asking Question 1: "What are the termination conditions in this agreement?"');
  const q1Res = await fetch(`${BASE_URL}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document: doc,
      question: 'What are the termination conditions in this agreement?',
    }),
  });
  const a1Payload = await q1Res.json();
  const a1Data = a1Payload.result;
  console.log('Q1 Response Status:', q1Res.status);
  console.log('Q1 Answer:\n', a1Data.answer);
  console.log('Q1 Grounded Evidence:\n', a1Data.groundedEvidence);
  console.log('Q1 notFoundInDocument:', a1Data.notFoundInDocument);

  if (a1Data.notFoundInDocument) throw new Error('Q1 unexpectedly returned notFound');
  if (!a1Data.answer.toLowerCase().includes('material breach') && !a1Data.answer.toLowerCase().includes('30 days') && !a1Data.answer.toLowerCase().includes('60 days')) {
    throw new Error('Q1 answer does not reflect termination terms');
  }

  // 4. Question 2: Payment Due Period
  console.log('\n[4/7] Asking Question 2: "What is the payment due period mentioned in the agreement?"');
  const q2Res = await fetch(`${BASE_URL}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document: doc,
      question: 'What is the payment due period mentioned in the agreement?',
    }),
  });
  const a2Payload = await q2Res.json();
  const a2Data = a2Payload.result;
  console.log('Q2 Response Status:', q2Res.status);
  console.log('Q2 Answer:\n', a2Data.answer);
  console.log('Q2 Grounded Evidence:\n', a2Data.groundedEvidence);
  console.log('Q2 notFoundInDocument:', a2Data.notFoundInDocument);

  if (a2Data.notFoundInDocument) throw new Error('Q2 unexpectedly returned notFound');
  if (!a2Data.answer.includes('30 days')) {
    throw new Error('Q2 answer does not identify 30 days payment window');
  }

  // 5. Question 3: CEO Favorite Food (Anti-Hallucination)
  console.log('\n[5/7] Asking Question 3 (Anti-Hallucination): "What is the CEO\'s favorite food?"');
  const q3Res = await fetch(`${BASE_URL}/api/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      document: doc,
      question: "What is the CEO's favorite food?",
    }),
  });
  const a3Payload = await q3Res.json();
  const a3Data = a3Payload.result;
  console.log('Q3 Response Status:', q3Res.status);
  console.log('Q3 Answer:\n', a3Data.answer);
  console.log('Q3 notFoundInDocument:', a3Data.notFoundInDocument);

  if (!a3Data.notFoundInDocument) throw new Error('Q3 should have notFoundInDocument: true');
  const lowerAnswer = a3Data.answer.toLowerCase();
  if (!lowerAnswer.includes('could not find') && !lowerAnswer.includes("couldn't find") && !lowerAnswer.includes('not found')) {
    throw new Error('Q3 did not communicate absence of info');
  }

  // 6. Upload Version 2 and Run Comparison
  console.log('\n[6/7] Uploading Version 2 (NyayaLens_Demo_Legal_Agreement_v2.pdf)...');
  const v2Path = path.resolve(__dirname, '..', 'NyayaLens_Demo_Legal_Agreement_v2.pdf');
  const v2Buffer = fs.readFileSync(v2Path);

  const formData2 = new FormData();
  const blob2 = new Blob([v2Buffer], { type: 'application/pdf' });
  formData2.append('file', blob2, 'NyayaLens_Demo_Legal_Agreement_v2.pdf');

  const upload2Res = await fetch(`${BASE_URL}/api/analyze`, {
    method: 'POST',
    body: formData2,
  });
  const upload2Data = await upload2Res.json();
  const doc2 = upload2Data.document;
  console.log('Doc2 ID:', doc2.id, doc2.title);

  console.log('\nRunning Semantic Comparison between Version 1 and Version 2...');
  const compareRes = await fetch(`${BASE_URL}/api/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ docA: doc, docB: doc2 }),
  });
  const compareData = await compareRes.json();
  console.log('Compare Status:', compareRes.status);
  const comparison = compareData.comparison;
  console.log('Comparison Executive Summary:\n', comparison.executiveSummary);

  const paymentDelta = comparison.categoryDeltas.payment.items.find(i => i.title.includes('Invoice') || i.category === 'payment');
  console.log('\nPayment Delta Detected:');
  console.log('Title:', paymentDelta?.title);
  console.log('Doc A:', paymentDelta?.docAContent);
  console.log('Doc B:', paymentDelta?.docBContent);

  const termDelta = comparison.categoryDeltas.termination.items.find(i => i.category === 'termination');
  console.log('\nTermination Notice Delta Detected:');
  console.log('Title:', termDelta?.title);
  console.log('Doc A:', termDelta?.docAContent);
  console.log('Doc B:', termDelta?.docBContent);

  if (!paymentDelta || !paymentDelta.docAContent.includes('30') || !paymentDelta.docBContent.includes('15')) {
    throw new Error('Payment delta (30 days -> 15 days) not detected properly');
  }

  if (!termDelta || !termDelta.docAContent.includes('60') || !termDelta.docBContent.includes('30')) {
    throw new Error('Termination delta (60 days -> 30 days) not detected properly');
  }

  // 7. Test Legal Language Analysis Module
  console.log('\n[7/7] Validating Legal Language Analysis (MAY, MUST, SHALL)...');
  const shallMatches = (doc.rawText.match(/\bshall\b/gi) || []).length;
  const mustMatches = (doc.rawText.match(/\bmust\b/gi) || []).length;
  const mayMatches = (doc.rawText.match(/\bmay\b/gi) || []).length;
  const subjectToMatches = (doc.rawText.match(/\bsubject\s+to\b/gi) || []).length;
  console.log('SHALL Count (Mandatory):', shallMatches);
  console.log('MUST Count (Mandatory):', mustMatches);
  console.log('MAY Count (Permissive):', mayMatches);
  console.log('SUBJECT TO Count (Conditions):', subjectToMatches);

  if (shallMatches < 5 || mayMatches < 3) {
    throw new Error('Legal language counts do not reflect document reality');
  }

  console.log('\n===============================================================');
  console.log('ALL LIVE END-TO-END VALIDATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('===============================================================');
}

runLiveAudit().catch((err) => {
  console.error('\n*** TEST FAILED ***', err);
  process.exit(1);
});

