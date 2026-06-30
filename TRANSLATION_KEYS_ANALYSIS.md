# Translation Keys Analysis - ExpenseTracker Frontend

## Executive Summary
- **Total Unique Keys Used in Frontend:** 88 keys
- **Missing Keys from translations.js:** 39 keys
- **Analysis Date:** April 27, 2026

---

## 1. COMMON SECTION

###  Keys Currently Used & Found in translations.js
- `common.loading`
- `common.logout`
- `common.menu`
- `common.toggleTheme`
- `common.cancel`
- `common.save`

---

## 2. NAVIGATION SECTION (nav.)

###  Keys Currently Used & Found in translations.js
- `nav.dashboard`
- `nav.transactions`
- `nav.budgets`
- `nav.reports`
- `nav.settings`
- `nav.logout`

---

## 3. DASHBOARD SECTION

###  Keys Currently Used & Found in translations.js
- `dashboard.title`
- `dashboard.subtitle`
- `dashboard.totalBalance`
- `dashboard.monthlySpend`
- `dashboard.monthlyIncome`
- `dashboard.positiveBalance`
- `dashboard.negativeBalance`
- `dashboard.thisMonthExpenses`
- `dashboard.thisMonthIncome`
- `dashboard.recentTransactions`
- `dashboard.seeAll`
- `dashboard.noTransactions`
- `dashboard.createFirst`
- `dashboard.loadingTransactions`

---

## 4. TRANSACTIONS SECTION

###  Keys Currently Used & Found in translations.js
- `transactions.title`
- `transactions.subtitle`
- `transactions.allTransactions`
- `transactions.income`
- `transactions.expenses`
- `transactions.filter`
- `transactions.search`
- `transactions.quickStats`
- `transactions.recentActivity`
- `transactions.transaction` (singular)
- `transactions.transactions` (plural)
- `transactions.loading`

###  MISSING Keys Not Found in translations.js
1. **`transactions.netBalance`** - Used in transaction.jsx line 199
   - Label: "Net Balance" or similar
   
2. **`transactions.incomeMinusExpenses`** - Used in transaction.jsx line 200
   - Note/description for net balance calculation
   
3. **`transactions.fetchingData`** - Used in transaction.jsx line 223
   - Message while loading transaction data
   
4. **`transactions.adjustFilters`** - Used in transaction.jsx line 236
   - Empty state message suggesting to adjust filters
   
5. **`transactions.createFirstTransaction`** - Used in transaction.jsx line 237
   - Empty state message suggesting to create first transaction

---

## 5. BUDGETS SECTION

###  Keys Currently Used & Found in translations.js
- `budgets.title`
- `budgets.subtitle`
- `budgets.totalBudgeted`
- `budgets.createBudget`
- `budgets.editBudget`
- `budgets.category`
- `budgets.limit`
- `budgets.spent`
- `budgets.remaining`
- `budgets.noBudgets`
- `budgets.createFirst` (as `budgets.createYourFirst` in file)

###  MISSING Keys Not Found in translations.js
6. **`budgets.categoryBudgets`** - Used in budgets.jsx line 309
   - Header for "Category Budgets" section
   
7. **`budgets.progressUpdates`** - Used in budgets.jsx line 310
   - Subtitle for progress tracking section
   
8. **`budgets.budgetActions`** - Used in budgets.jsx line 371
   - Header for budget actions/controls section
   
9. **`budgets.quickControls`** - Used in budgets.jsx line 372
   - Subtitle for quick budget controls
   
10. **`budgets.autoRollUnused`** - Used in budgets.jsx line 380
    - Toggle label: Auto-roll unused funds
    
11. **`budgets.moveExtraMoney`** - Used in budgets.jsx line 381
    - Description for auto-roll feature
    
12. **`budgets.overspendAlert`** - Used in budgets.jsx line 396
    - Toggle label for overspend alerts
    
13. **`budgets.warnWhenCategoryHits`** - Used in budgets.jsx line 397
    - Description template with threshold parameter: "Warn when category hits {threshold}%"
    
14. **`budgets.startFreshBudget`** - Used in budgets.jsx line 421
    - Description for starting a new budget
    
15. **`budgets.addBudget`** - Used in budgets.jsx line 428
    - Button text to add a new budget
    
16. **`budgets.spendingOutlook`** - Used in budgets.jsx line 438
    - Header for spending projection section
    
17. **`budgets.currentPace`** - Used in budgets.jsx line 439
    - Subtitle for current spending pace
    
18. **`budgets.averageDailySpend`** - Used in budgets.jsx line 448
    - Label for average daily spending calculation
    
19. **`budgets.projectedFinalSpend`** - Used in budgets.jsx line 454
    - Label for projected final spending of the month
    
20. **`budgets.outlookPending`** - Used in budgets.jsx line 468
    - Empty state title when no spending data yet
    
21. **`budgets.monthEndProjection`** - Used in budgets.jsx line 469
    - Empty state description for month-end projection

---

## 6. REPORTS SECTION

###  Keys Currently Used & Found in translations.js
- `reports.title`
- `reports.subtitle`
- `reports.monthlySpending`
- `reports.topCategory`
- `reports.budgetHealth`
- `reports.categoryBreakdown`
- `reports.export`

###  PARTIALLY FOUND (Different Key Name)
- **`reports.avgPerTransaction`** - Used in report.jsx line 225
  - **File has:** `reports.averageTransaction`
  - These appear to be the same conceptually but use different key names

###  MISSING Keys Not Found in translations.js
22. **`reports.monthlyTrend`** - Used in report.jsx line 240
    - Header for monthly spending trend chart
    
23. **`reports.monthlyTrendDescription`** - Used in report.jsx line 241
    - Subtitle describing monthly trend visualization
    
24. **`reports.trendDataPending`** - Used in report.jsx line 273
    - Empty state title when trend data is loading
    
25. **`reports.trendDataDescription`** - Used in report.jsx line 274
    - Empty state description for trend data
    
26. **`reports.insights`** - Used in report.jsx line 282
    - Header for spending insights section
    
27. **`reports.insightsDescription`** - Used in report.jsx line 283
    - Subtitle describing insights section
    
28. **`reports.insightsPending`** - Used in report.jsx line 300
    - Empty state title when insights are loading
    
29. **`reports.categoryBreakdownDescription`** - Used in report.jsx line 312
    - Description for category breakdown visualization
    
30. **`reports.categoryBreakdownPending`** - Used in report.jsx line 349
    - Empty state title when breakdown data is loading
    
31. **`reports.exportOptions`** - Used in report.jsx line 358
    - Header for export options section
    
32. **`reports.exportOptionsDescription`** - Used in report.jsx line 359
    - Subtitle for export options
    
33. **`reports.monthlySummary`** - Used in report.jsx line 367
    - Label for monthly summary export option
    
34. **`reports.monthlySummaryDescription`** - Used in report.jsx line 368
    - Description for monthly summary export
    
35. **`reports.csvTransactions`** - Used in report.jsx line 384
    - Label for CSV transactions export
    
36. **`reports.csvTransactionsDescription`** - Used in report.jsx line 385
    - Description for CSV export option

---

## 7. SETTINGS SECTION

###  Keys Currently Used & Found in translations.js
- `settings.title`
- `settings.subtitle`
- `settings.profile`
- `settings.profileSubtitle`
- `settings.account`
- `settings.accountSubtitle`
- `settings.preferences`
- `settings.preferencesSubtitle`
- `settings.name`
- `settings.nameDescription`
- `settings.email`
- `settings.emailDescription`
- `settings.currency`
- `settings.selectCurrency`
- `settings.language`
- `settings.selectLanguage`
- `settings.updateProfile`
- `settings.profileUpdated`
- `settings.profileError`
- `settings.changePassword`
- `settings.currentPassword`
- `settings.newPassword`
- `settings.confirmPassword`
- `settings.signOut`
- `settings.signOutDescription`
- `settings.logOut`
- `settings.deleteAccount`
- `settings.deleteAccountDescription`
- `settings.delete`
- `settings.deleting`
- `settings.cloudBackup`
- `settings.cloudBackupDescription`
- `settings.bankSync`
- `settings.bankSyncDescription`

###  MISSING Keys Not Found in translations.js
37. **`settings.connectedTools`** - Used in settings.jsx line 689
    - Header for connected tools/integrations section
    
38. **`settings.integrateServices`** - Used in settings.jsx line 690
    - Subtitle for integrating external services

---

## 8. AUTHENTICATION SECTION

###  Keys Currently Used & Found in translations.js
All authentication-related keys are properly defined in translations.js.

---

## SUMMARY BY LANGUAGE COVERAGE

The following keys need to be added to **ALL language sections** (en, es, fr, de, zh, ko, ja):

### Critical Missing Keys (39 total)

**By Section:**
- **Transactions:** 5 keys
- **Budgets:** 16 keys
- **Reports:** 15 keys
- **Settings:** 2 keys
- **Common/Nav:** 0 keys
- **Dashboard:** 0 keys

---

## RECOMMENDATIONS FOR KOREAN SUPPORT

To achieve full Korean/multi-language coverage:

1. **Add all 39 missing translation keys** to each language section in `translations.js`
2. **Fix the naming inconsistency:** Change `reports.averageTransaction` to `reports.avgPerTransaction` OR update the frontend to use the existing key name
3. **Verify mixed-language content:** Some sections in translations.js (French) contain Spanish text (e.g., "Cargando presupuestos" should be in French)

### Priority Implementation Order
1. **High Priority:** Transactions & Budgets sections (most used)
2. **Medium Priority:** Reports section (secondary features)
3. **Low Priority:** Settings section (less frequently accessed)

---

## FILES REQUIRING UPDATES

-  **[src/utils/translations.js](src/utils/translations.js)** - Add 39 missing keys across all 7 language sections (en, es, fr, de, zh, ko, ja)

---

## NEXT STEPS

1. Generate translations for all 39 missing keys in Korean (and all other languages)
2. Add keys to translations.js in each language section
3. Test UI with Korean language selection to verify complete coverage
4. Consider adding any dynamic parameter translations (like `{threshold}`, `{name}`)

