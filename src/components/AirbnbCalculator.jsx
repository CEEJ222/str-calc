import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Calculator, DollarSign, Home, TrendingUp, AlertCircle } from 'lucide-react';
import './AirbnbCalculator.css';

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const InputField = React.memo(({ label, name, value, onChange, step, type = "number" }) => {
  const handleChange = (e) => {
    onChange(name, e.target.value);
  };

  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleChange}
        className="input-field"
        step={step}
      />
    </div>
  );
});
InputField.displayName = 'InputField';

const AirbnbCalculator = () => {
  const [inputs, setInputs] = useState({
    propertyValue: '250000',
    downPaymentPercent: '25',
    interestRate: '7.12',
    loanTermYears: '30',
    avgNightlyRate: '200',
    occupancyRate: '51',
    insurance: '1000',
    hoaFees: '0',
    utilities: '2400',
    maintenancePercent: '1.0',
    capexPercent: '0.5',
    propertyMgmtPercent: '13',
    cleaningFeePerNight: '50',
    platformFeePercent: '3',
    transientOccupancyTaxPercent: '7',
    strLicenses: '1300',
    suppliesPerNight: '15',
    internetAnnual: '600',
    marginalTaxRate: '25'
  });

  const debouncedInputs = useDebounce(inputs, 500);

  // Save to localStorage when inputs change
  useEffect(() => {
    localStorage.setItem('airbnb-calculator-inputs', JSON.stringify(inputs));
  }, [inputs]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('airbnb-calculator-inputs');
    if (saved) {
      try {
        setInputs(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }
  }, []);

  const calculations = useMemo(() => {
    const getNum = (val) => parseFloat(val) || 0;

    const propertyValue = getNum(debouncedInputs.propertyValue);
    const downPaymentPercent = getNum(debouncedInputs.downPaymentPercent);
    const interestRate = getNum(debouncedInputs.interestRate);
    const loanTermYears = getNum(debouncedInputs.loanTermYears);
    const avgNightlyRate = getNum(debouncedInputs.avgNightlyRate);
    const occupancyRate = getNum(debouncedInputs.occupancyRate);
    const insurance = getNum(debouncedInputs.insurance);
    const hoaFees = getNum(debouncedInputs.hoaFees);
    const utilities = getNum(debouncedInputs.utilities);
    const maintenancePercent = getNum(debouncedInputs.maintenancePercent);
    const capexPercent = getNum(debouncedInputs.capexPercent);
    const propertyMgmtPercent = getNum(debouncedInputs.propertyMgmtPercent);
    const cleaningFeePerNight = getNum(debouncedInputs.cleaningFeePerNight);
    const platformFeePercent = getNum(debouncedInputs.platformFeePercent);
    const transientOccupancyTaxPercent = getNum(debouncedInputs.transientOccupancyTaxPercent);
    const strLicenses = getNum(debouncedInputs.strLicenses);
    const suppliesPerNight = getNum(debouncedInputs.suppliesPerNight);
    const internetAnnual = getNum(debouncedInputs.internetAnnual);
    const marginalTaxRate = getNum(debouncedInputs.marginalTaxRate);

    const propertyTaxes = propertyValue * 0.0125;

    const downPayment = propertyValue * (downPaymentPercent / 100);
    const loanAmount = propertyValue - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTermYears * 12;
    
    let monthlyPI = 0;
    if (loanAmount > 0 && monthlyRate > 0 && numPayments > 0) {
      monthlyPI = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                  (Math.pow(1 + monthlyRate, numPayments) - 1);
    }
    const annualPI = monthlyPI * 12;

    const occupiedNights = Math.round((occupancyRate / 100) * 365);
    const grossRevenue = avgNightlyRate * occupiedNights;

    const maintenance = propertyValue * (maintenancePercent / 100);
    const capex = propertyValue * (capexPercent / 100);
    const propertyMgmt = grossRevenue * (propertyMgmtPercent / 100);
    const cleaningFees = occupiedNights * cleaningFeePerNight;
    const platformFees = grossRevenue * (platformFeePercent / 100);
    const transientOccupancyTax = grossRevenue * (transientOccupancyTaxPercent / 100);
    const supplies = occupiedNights * suppliesPerNight;

    const totalExpenses = annualPI + propertyTaxes + insurance + hoaFees + utilities + 
                         maintenance + capex + propertyMgmt + cleaningFees + platformFees + 
                         transientOccupancyTax + strLicenses + supplies + internetAnnual;

    const noi = grossRevenue - (totalExpenses - annualPI);
    const cashFlow = grossRevenue - totalExpenses;
    const monthlyCashFlow = cashFlow / 12;
    const cashOnCashReturn = downPayment > 0 ? (cashFlow / downPayment) * 100 : 0;
    const capRate = propertyValue > 0 ? (noi / propertyValue) * 100 : 0;

    const annualInterest = loanAmount * (interestRate / 100);
    const buildingValue = propertyValue * 0.8; // Assume land is 20% of value
    const depreciation = buildingValue / 27.5; // Straight-line over 27.5 years

    const totalDeductions = 
        annualInterest + 
        propertyTaxes + 
        insurance + 
        hoaFees + 
        utilities + 
        maintenance + 
        capex + 
        propertyMgmt + 
        cleaningFees + 
        platformFees + 
        transientOccupancyTax + 
        strLicenses + 
        supplies + 
        internetAnnual + 
        depreciation;
    
    const annualTaxSavings = totalDeductions * (marginalTaxRate / 100);
    const propertyTaxSavings = propertyTaxes * (marginalTaxRate / 100);
    
    const otherOperatingExpenses = utilities + maintenance + capex + strLicenses + supplies + internetAnnual;

    const afterTaxAnnualCashFlow = cashFlow + annualTaxSavings;
    const afterTaxMonthlyCashFlow = afterTaxAnnualCashFlow / 12;
    const afterTaxCashOnCashReturn = downPayment > 0 ? (afterTaxAnnualCashFlow / downPayment) * 100 : 0;

    return {
      downPayment, loanAmount, monthlyPI, annualPI, occupiedNights, grossRevenue,
      maintenance, capex, propertyMgmt, cleaningFees, platformFees, supplies,
      totalExpenses, noi, cashFlow, monthlyCashFlow, cashOnCashReturn, capRate,
      propertyTaxes, insurance, otherOperatingExpenses, annualTaxSavings, propertyTaxSavings, annualInterest,
      transientOccupancyTax, afterTaxAnnualCashFlow, afterTaxMonthlyCashFlow, afterTaxCashOnCashReturn,
      totalDeductions, depreciation, hoaFees
    };
  }, [debouncedInputs]);

  const updateInput = useCallback((key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  }, []);

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatPercent = (percent) => {
    if (isNaN(percent) || percent === null || percent === undefined) return '0.0%';
    return `${percent.toFixed(1)}%`;
  };

  const getResultClass = (value, thresholds) => {
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.ok) return 'ok';
    return 'poor';
  };

  const resetToDefaults = () => {
    setInputs({
      propertyValue: '250000',
      downPaymentPercent: '20',
      interestRate: '7.0',
      loanTermYears: '30',
      avgNightlyRate: '200',
      occupancyRate: '65',
      insurance: '1800',
      hoaFees: '0',
      utilities: '2400',
      maintenancePercent: '1.0',
      capexPercent: '0.5',
      propertyMgmtPercent: '20',
      cleaningFeePerNight: '50',
      platformFeePercent: '3',
      transientOccupancyTaxPercent: '7',
      strLicenses: '300',
      suppliesPerNight: '15',
      internetAnnual: '960',
      marginalTaxRate: '25'
    });
  };

  return (
    <div className="calculator-container">
      <div className="calculator-wrapper">
        <div className="calculator-header">
          <div className="header-title-wrapper">
            <Calculator className="header-icon" />
            <h1 className="header-title">Airbnb Investment Calculator</h1>
          </div>
          <p className="header-subtitle">
            Adjust parameters to analyze your short-term rental investment potential
          </p>
          <button onClick={resetToDefaults} className="reset-button">
            Reset to Defaults
          </button>
        </div>

        <div className="calculator-grid">
          {/* Input Panel */}
          <div className="input-panel">
            {/* Property Details */}
            <div className="section">
              <div className="section-header">
                <Home className="section-icon blue" />
                Property Details
              </div>
              <div className="grid-2">
                <InputField
                  label="Property Value"
                  name="propertyValue"
                  value={inputs.propertyValue}
                  onChange={updateInput}
                />
                <InputField
                  label="Down Payment %"
                  name="downPaymentPercent"
                  value={inputs.downPaymentPercent}
                  onChange={updateInput}
                />
                <InputField
                  label="Interest Rate %"
                  name="interestRate"
                  value={inputs.interestRate}
                  onChange={updateInput}
                  step="0.1"
                />
                <InputField
                  label="Loan Term (Years)"
                  name="loanTermYears"
                  value={inputs.loanTermYears}
                  onChange={updateInput}
                />
              </div>
            </div>

            {/* Revenue */}
            <div className="section">
              <div className="section-header">
                <DollarSign className="section-icon green" />
                Revenue
              </div>
              <div className="grid-2">
                <InputField
                  label="Avg Nightly Rate"
                  name="avgNightlyRate"
                  value={inputs.avgNightlyRate}
                  onChange={updateInput}
                />
                <InputField
                  label="Occupancy Rate %"
                  name="occupancyRate"
                  value={inputs.occupancyRate}
                  onChange={updateInput}
                />
              </div>
            </div>

            {/* Traditional Expenses */}
            <div className="section">
              <h2 className="section-header">Traditional Expenses (Annual)</h2>
              <div className="grid-2">
                <InputField
                  label="Insurance"
                  name="insurance"
                  value={inputs.insurance}
                  onChange={updateInput}
                />
                <InputField
                  label="HOA/Condo Fees"
                  name="hoaFees"
                  value={inputs.hoaFees}
                  onChange={updateInput}
                />
                <InputField
                  label="Utilities"
                  name="utilities"
                  value={inputs.utilities}
                  onChange={updateInput}
                />
                <InputField
                  label="Maintenance % of Value"
                  name="maintenancePercent"
                  value={inputs.maintenancePercent}
                  onChange={updateInput}
                  step="0.1"
                />
                <InputField
                  label="CapEx % of Value"
                  name="capexPercent"
                  value={inputs.capexPercent}
                  onChange={updateInput}
                  step="0.1"
                />
              </div>
            </div>

            {/* STR Specific */}
            <div className="section">
              <h2 className="section-header">Short-Term Rental Expenses</h2>
              <div className="grid-2">
                <InputField
                  label="Property Mgmt % of Revenue"
                  name="propertyMgmtPercent"
                  value={inputs.propertyMgmtPercent}
                  onChange={updateInput}
                />
                <InputField
                  label="Cleaning Fee per Night"
                  name="cleaningFeePerNight"
                  value={inputs.cleaningFeePerNight}
                  onChange={updateInput}
                />
                <InputField
                  label="Platform Fee % of Revenue"
                  name="platformFeePercent"
                  value={inputs.platformFeePercent}
                  onChange={updateInput}
                  step="0.1"
                />
                <InputField
                  label="Transient Occupancy Tax %"
                  name="transientOccupancyTaxPercent"
                  value={inputs.transientOccupancyTaxPercent}
                  onChange={updateInput}
                  step="0.1"
                />
                <InputField
                  label="Licenses/Permits (Annual)"
                  name="strLicenses"
                  value={inputs.strLicenses}
                  onChange={updateInput}
                />
                <InputField
                  label="Supplies per Night"
                  name="suppliesPerNight"
                  value={inputs.suppliesPerNight}
                  onChange={updateInput}
                />
                <InputField
                  label="Internet (Annual)"
                  name="internetAnnual"
                  value={inputs.internetAnnual}
                  onChange={updateInput}
                />
              </div>
            </div>

            {/* Tax Assumptions */}
            <div className="section">
              <div className="section-header">
                <DollarSign className="section-icon purple" />
                Tax Assumptions
              </div>
              <div className="grid-2">
                <InputField
                  label="Marginal Tax Rate %"
                  name="marginalTaxRate"
                  value={inputs.marginalTaxRate}
                  onChange={updateInput}
                />
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="results-panel">
            {/* Key Metrics */}
            <div className="section">
              <div className="section-header">
                <TrendingUp className="section-icon blue" />
                Key Investment Metrics
              </div>
              
              <div className="metrics-grid">
                <div className="metric-card green">
                  <div className="metric-label green">Monthly Cash Flow</div>
                  <div className={`metric-value ${getResultClass(calculations.monthlyCashFlow, {good: 200, ok: 0})}`}>
                    {formatCurrency(calculations.monthlyCashFlow)}
                  </div>
                </div>
                <div className="metric-card blue">
                  <div className="metric-label blue">Cash-on-Cash Return</div>
                  <div className={`metric-value ${getResultClass(calculations.cashOnCashReturn, {good: 8, ok: 5})}`}>
                    {formatPercent(calculations.cashOnCashReturn)}
                  </div>
                </div>
                <div className="metric-card purple">
                  <div className="metric-label purple">Cap Rate</div>
                  <div className={`metric-value ${getResultClass(calculations.capRate, {good: 6, ok: 4})}`}>
                    {formatPercent(calculations.capRate)}
                  </div>
                </div>
                <div className="metric-card orange">
                  <div className="metric-label orange">Annual Cash Flow</div>
                  <div className={`metric-value ${getResultClass(calculations.cashFlow, {good: 2400, ok: 0})}`}>
                    {formatCurrency(calculations.cashFlow)}
                  </div>
                </div>
              </div>

              {/* Post-Tax Return Analysis */}
              <div className="section">
                <div className="section-header">
                  <TrendingUp className="section-icon teal" />
                  Post-Tax Return Analysis
                </div>
                <div className="metrics-grid">
                  <div className="metric-card green">
                    <div className="metric-label">After-Tax Monthly CF</div>
                    <div className={`metric-value ${getResultClass(calculations.afterTaxMonthlyCashFlow, {good: 200, ok: 0})}`}>
                      {formatCurrency(calculations.afterTaxMonthlyCashFlow)}
                    </div>
                  </div>
                  <div className="metric-card blue">
                    <div className="metric-label">After-Tax CoC Return</div>
                    <div className={`metric-value ${getResultClass(calculations.afterTaxCashOnCashReturn, {good: 8, ok: 5})}`}>
                      {formatPercent(calculations.afterTaxCashOnCashReturn)}
                    </div>
                  </div>
                  <div className="metric-card orange">
                    <div className="metric-label">After-Tax Annual CF</div>
                    <div className={`metric-value ${getResultClass(calculations.afterTaxAnnualCashFlow, {good: 2400, ok: 0})}`}>
                      {formatCurrency(calculations.afterTaxAnnualCashFlow)}
                    </div>
                  </div>
                </div>
                <p className="disclaimer">
                  These metrics show your returns after factoring in estimated annual tax savings.
                </p>
              </div>

              {/* Investment Quality Indicator */}
              <div className="assessment-section">
                <div className="assessment-header">
                  <AlertCircle className="icon" />
                  <span className="assessment-title">Investment Assessment</span>
                </div>
                <p className="assessment-text">
                  {calculations.cashOnCashReturn >= 8 && calculations.monthlyCashFlow >= 200 
                    ? "🟢 Excellent investment opportunity"
                    : calculations.cashOnCashReturn >= 5 && calculations.monthlyCashFlow >= 0
                    ? "🟡 Moderate investment potential"
                    : "🔴 Consider alternative investments"}
                </p>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="section">
              <h2 className="section-header">Revenue Analysis</h2>
              <ul className="breakdown-list">
                <li className="breakdown-item">
                  <span className="breakdown-label">Occupied Nights/Year:</span>
                  <span className="breakdown-value">{calculations.occupiedNights} nights</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Gross Annual Revenue:</span>
                  <span className="breakdown-value positive">{formatCurrency(calculations.grossRevenue)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Revenue per Occupied Night:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.grossRevenue / calculations.occupiedNights)}</span>
                </li>
              </ul>
            </div>

            {/* Expense Breakdown */}
            <div className="section">
              <h2 className="section-header">Expense Breakdown</h2>
              <ul className="breakdown-list">
                <li className="breakdown-item">
                  <span className="breakdown-label">Principal & Interest:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.annualPI)}</span>
                </li>
                <li className="breakdown-item sub-item">
                  <span className="breakdown-label">↳ Annual Interest (Year 1 Est.):</span>
                  <span className="breakdown-value">{formatCurrency(calculations.annualInterest)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Property Taxes:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.propertyTaxes)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Insurance:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.insurance)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Property Management:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.propertyMgmt)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Cleaning Fees:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.cleaningFees)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Platform Fees:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.platformFees)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Transient Occupancy Tax:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.transientOccupancyTax)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Other Expenses:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.otherOperatingExpenses)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Total Annual Expenses:</span>
                  <span className="breakdown-value total">{formatCurrency(calculations.totalExpenses)}</span>
                </li>
              </ul>
            </div>

            {/* Financing Details */}
            <div className="section">
              <h2 className="section-header">Financing Details</h2>
              <ul className="breakdown-list">
                <li className="breakdown-item">
                  <span className="breakdown-label">Down Payment Required:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.downPayment)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Loan Amount:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.loanAmount)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Monthly P&I Payment:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.monthlyPI)}</span>
                </li>
              </ul>
            </div>

            {/* Tax Analysis */}
            <div className="section">
              <h2 className="section-header">Tax Analysis (Estimates)</h2>
              <ul className="breakdown-list">
                <li className="breakdown-item">
                  <span className="breakdown-label">Annual Interest:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.annualInterest)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Property Taxes:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.propertyTaxes)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Insurance:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.insurance)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Property Management:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.propertyMgmt)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Cleaning & Platform Fees:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.cleaningFees + calculations.platformFees)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Transient Occupancy Tax:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.transientOccupancyTax)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Other Expenses:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.otherOperatingExpenses)}</span>
                </li>
                 <li className="breakdown-item">
                  <span className="breakdown-label">HOA Fees:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.hoaFees)}</span>
                </li>
                <li className="breakdown-item">
                  <span className="breakdown-label">Depreciation (Year 1):</span>
                  <span className="breakdown-value">{formatCurrency(calculations.depreciation)}</span>
                </li>
                <hr />
                <li className="breakdown-item total">
                  <span className="breakdown-label">Total Annual Deductions:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.totalDeductions)}</span>
                </li>
                <li className="breakdown-item total positive">
                  <span className="breakdown-label">Estimated Tax Savings:</span>
                  <span className="breakdown-value">{formatCurrency(calculations.annualTaxSavings)}</span>
                </li>
              </ul>
              <p className="disclaimer">
                Estimates assume 80% of property value is depreciable over 27.5 years and all expenses are deductible. Consult a tax professional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirbnbCalculator;