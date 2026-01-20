import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const prompt = `
מצא את הריביות העדכניות ביותר למשכנתאות בישראל מאתר בנק ישראל ומהבנקים המובילים.
חפש את הנתונים הרשמיים האחרונים עבור:
1. ריבית פריים (Prime Rate)
2. ריבית משכנתא קבועה לא צמודה (Fixed Unlinked)
3. ריבית משכנתא משתנה לא צמודה (Variable Unlinked)
4. ריבית משכנתא קבועה צמודה למדד (Fixed CPI Linked)
5. ריבית משכנתא משתנה צמודה למדד (Variable CPI Linked)

החזר JSON עם הריביות בפורמט עשרוני (לדוגמה 0.0505 עבור 5.05%).
    `;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          prime: { type: "number" },
          fixed_unlinked: { type: "number" },
          variable_unlinked: { type: "number" },
          fixed_linked: { type: "number" },
          variable_linked: { type: "number" },
          last_updated: { type: "string" }
        }
      }
    });

    const rates = response?.output || response;

    return Response.json({
      success: true,
      rates: {
        PRIME: rates.prime || 0.055,
        PRIME_CALC: (rates.prime || 0.055) - 0.005,
        FIXED_UNLINKED: rates.fixed_unlinked || 0.0505,
        VAR_UNLINKED: rates.variable_unlinked || 0.0498,
        FIXED_LINKED: rates.fixed_linked || 0.0347,
        VAR_LINKED: rates.variable_linked || 0.0361
      },
      last_updated: rates.last_updated || new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching rates:', error);
    
    return Response.json({
      success: false,
      rates: {
        PRIME: 0.055,
        PRIME_CALC: 0.050,
        FIXED_UNLINKED: 0.0505,
        VAR_UNLINKED: 0.0498,
        FIXED_LINKED: 0.0347,
        VAR_LINKED: 0.0361
      },
      last_updated: new Date().toISOString(),
      error: 'Failed to fetch live rates, using fallback values'
    });
  }
});