import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const prompt = `
מצא את הנתונים העדכניים ביותר מבנק ישראל ומהבנקים:
1. ריבית בנק ישראל (ריבית מדיניות מוניטרית) - החלטת המטה האחרונה
2. ריבית משכנתא קבועה לא צמודה (Fixed Unlinked)
3. ריבית משכנתא משתנה לא צמודה (Variable Unlinked)
4. ריבית משכנתא קבועה צמודה למדד (Fixed CPI Linked)
5. ריבית משכנתא משתנה צמודה למדד (Variable CPI Linked)

חשוב: ריבית בנק ישראל היא הריבית המרכזית, לא הפריים.
החזר JSON עם הריביות בפורמט עשרוני (לדוגמה 0.045 עבור 4.5%).
    `;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          bank_of_israel_rate: { type: "number" },
          fixed_unlinked: { type: "number" },
          variable_unlinked: { type: "number" },
          fixed_linked: { type: "number" },
          variable_linked: { type: "number" },
          last_updated: { type: "string" }
        }
      }
    });

    const rates = response?.output || response;
    
    // חישוב ריבית פריים: ריבית בנק ישראל + 1.5%
    const bankRate = rates.bank_of_israel_rate || 0.0425;
    const primeRate = bankRate + 0.015;
    const primeCalc = primeRate - 0.005; // P-0.5% לחישוב משכנתא

    return Response.json({
      success: true,
      rates: {
        PRIME: primeRate,
        PRIME_CALC: primeCalc,
        FIXED_UNLINKED: rates.fixed_unlinked || 0.0505,
        VAR_UNLINKED: rates.variable_unlinked || 0.0498,
        FIXED_LINKED: rates.fixed_linked || 0.0347,
        VAR_LINKED: rates.variable_linked || 0.0361
      },
      bank_of_israel_rate: bankRate,
      last_updated: rates.last_updated || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching rates:', error);
    
    // ערכי fallback: ריבית בנק ישראל 4.25% + 1.5% = 5.75% פריים
    const fallbackBankRate = 0.0425;
    const fallbackPrime = fallbackBankRate + 0.015;
    const fallbackPrimeCalc = fallbackPrime - 0.005;
    
    return Response.json({
      success: false,
      rates: {
        PRIME: fallbackPrime,
        PRIME_CALC: fallbackPrimeCalc,
        FIXED_UNLINKED: 0.0505,
        VAR_UNLINKED: 0.0498,
        FIXED_LINKED: 0.0347,
        VAR_LINKED: 0.0361
      },
      bank_of_israel_rate: fallbackBankRate,
      last_updated: new Date().toISOString(),
      error: 'Failed to fetch live rates, using fallback values'
    });
  }
});