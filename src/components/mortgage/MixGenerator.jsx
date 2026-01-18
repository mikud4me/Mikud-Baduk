// Utility functions to generate 3 mortgage mixes based on user input

export function generateMixes(formData) {
    const { loanAmount, loanPeriod, monthlyIncome } = formData;
    const monthlyPaymentLimit = monthlyIncome * 0.35; // 35% של ההכנסה

    // Current market rates (approximate)
    const rates = {
        prime: 6.0,
        fixed: 5.5,
        variable_5: 4.8,
        cpi_fixed: 3.5,
        eligibility: 3.0
    };

    // Helper: Calculate monthly payment (PMT formula)
    const calculateMonthlyPayment = (principal, annualRate, years) => {
        const monthlyRate = annualRate / 100 / 12;
        const numPayments = years * 12;
        if (monthlyRate === 0) return principal / numPayments;
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
               (Math.pow(1 + monthlyRate, numPayments) - 1);
    };

    // Helper: Calculate total payment and interest
    const calculateTotals = (tracks, years) => {
        let totalMonthly = 0;
        tracks.forEach(track => {
            totalMonthly += calculateMonthlyPayment(track.amount, track.interest_rate, track.period_years || years);
        });
        const totalPayment = totalMonthly * years * 12;
        const totalInterest = totalPayment - loanAmount;
        return { monthly_payment: Math.round(totalMonthly), total_payment: Math.round(totalPayment), total_interest: Math.round(totalInterest) };
    };

    // Mix 1: Conservative (שמרני) - Heavy on fixed rate
    const conservativeTracks = [
        { track_type: "fixed", amount: Math.round(loanAmount * 0.6), interest_rate: rates.fixed, period_years: loanPeriod },
        { track_type: "cpi_fixed", amount: Math.round(loanAmount * 0.25), interest_rate: rates.cpi_fixed, period_years: loanPeriod },
        { track_type: "prime", amount: Math.round(loanAmount * 0.15), interest_rate: rates.prime, period_years: loanPeriod }
    ];
    const conservativeTotals = calculateTotals(conservativeTracks, loanPeriod);

    const conservativeMix = {
        name: "תמהיל שמרני",
        total_amount: loanAmount,
        loan_period_years: loanPeriod,
        tracks: conservativeTracks,
        risk_level: "low",
        notes: "תמהיל יציב עם דגש על ריבית קבועה - מתאים למי שמעדיף וודאות בהחזר החודשי",
        ...conservativeTotals
    };

    // Mix 2: Balanced (מאוזן) - Mix of all types
    const balancedTracks = [
        { track_type: "fixed", amount: Math.round(loanAmount * 0.34), interest_rate: rates.fixed, period_years: loanPeriod },
        { track_type: "prime", amount: Math.round(loanAmount * 0.33), interest_rate: rates.prime, period_years: loanPeriod },
        { track_type: "variable_5", amount: Math.round(loanAmount * 0.33), interest_rate: rates.variable_5, period_years: loanPeriod }
    ];
    const balancedTotals = calculateTotals(balancedTracks, loanPeriod);

    const balancedMix = {
        name: "תמהיל מאוזן",
        total_amount: loanAmount,
        loan_period_years: loanPeriod,
        tracks: balancedTracks,
        risk_level: "medium",
        notes: "תמהיל מאוזן המשלב יציבות עם פוטנציאל לחיסכון - מתאים לרוב הלווים",
        ...balancedTotals
    };

    // Mix 3: Aggressive (אגרסיבי) - Heavy on variable rates
    const aggressiveTracks = [
        { track_type: "prime", amount: Math.round(loanAmount * 0.5), interest_rate: rates.prime, period_years: loanPeriod },
        { track_type: "variable_5", amount: Math.round(loanAmount * 0.35), interest_rate: rates.variable_5, period_years: loanPeriod },
        { track_type: "fixed", amount: Math.round(loanAmount * 0.15), interest_rate: rates.fixed, period_years: loanPeriod }
    ];
    const aggressiveTotals = calculateTotals(aggressiveTracks, loanPeriod);

    const aggressiveMix = {
        name: "תמהיל אגרסיבי",
        total_amount: loanAmount,
        loan_period_years: loanPeriod,
        tracks: aggressiveTracks,
        risk_level: "high",
        notes: "תמהיל עם פוטנציאל לחיסכון משמעותי אך חשיפה גבוהה יותר לשינויי ריבית",
        ...aggressiveTotals
    };

    return [conservativeMix, balancedMix, aggressiveMix];
}

export function validateMix(mix, monthlyIncome) {
    const maxPayment = monthlyIncome * 0.4; // Maximum 40% of income
    if (mix.monthly_payment > maxPayment) {
        return {
            valid: false,
            message: `ההחזר החודשי (${mix.monthly_payment.toLocaleString('he-IL')} ₪) גבוה מ-40% מההכנסה שלך`
        };
    }
    return { valid: true };
}