import { supabase } from './supabaseClient';

export class RefinanceAnalysisRequestError extends Error {
  constructor(message, { status = 0, cause } = {}) {
    super(message);
    this.name = 'RefinanceAnalysisRequestError';
    this.status = status;
    if (cause !== undefined) this.cause = cause;
  }
}

export async function analyzeRefinanceDocument(payload) {
  if (!supabase) throw new RefinanceAnalysisRequestError('Supabase is not configured');
  const { data, error } = await supabase.functions.invoke('analyze-refinance-document', { body: payload });
  if (error) throw new RefinanceAnalysisRequestError(error.message, { cause: error });
  return data;
}
