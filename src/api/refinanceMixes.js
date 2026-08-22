import { appClient } from './appClient';

export async function calculateRefinanceMixes(leadId) {
  const { data } = await appClient.functions.invoke('calculate-refinance-mixes', {
    lead_id: leadId,
  });
  return data;
}
