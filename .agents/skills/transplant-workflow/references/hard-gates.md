# Hard Gate Enforcement

## 1. I/E Confirm Review Gate

**Location**: Before transition to Stage 6 (Initial Screening)
```typescript
if (targetStage === 'initial-screening') {
  const ieReview = await getDecision(caseId, 'ie-review');
  if (!ieReview || ieReview.outcome !== 'proceed') {
    throw new GateBlockedError('I/E confirm review required before screening');
  }
}
```

## 2. Medicare 2728 Document Gate

**Location**: Before transition to Stage 9 (Medical Records Review)
```typescript
if (targetStage === 'medical-records-review') {
  const doc2728 = await getDocument(caseId, 'medicare-2728');
  if (!doc2728 || doc2728.validationStatus !== 'valid') {
    throw new GateBlockedError('Validated 2728 required for medical records review');
  }
}
```

## 3. Specialist Reviews Gate

**Location**: Before transition to Stage 11 (Final Decision)
```typescript
if (targetStage === 'final-decision') {
  const specialists = ['dietitian', 'social-worker', 'nephrology'];
  for (const spec of specialists) {
    const review = await getSpecialistReview(caseId, spec);
    if (!review || review.status === 'pending') {
      throw new GateBlockedError(`${spec} review required for final decision`);
    }
  }
}
```

## 4. Education Gate

**Location**: Before transition to Stage 13 (Scheduling)
```typescript
if (targetStage === 'scheduling') {
  const education = await getEducationProgress(caseId);
  const required = ['video', 'form', 'guidance'];
  const incomplete = required.filter(item => !education[item]?.completed);
  if (incomplete.length > 0) {
    throw new GateBlockedError(`Education items incomplete: ${incomplete.join(', ')}`);
  }
}
```