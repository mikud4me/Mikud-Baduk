import { appClient } from './appClient';

export const refinanceLeads = {
  get: (id) => appClient.functions.invoke('refinance-leads', { action: 'get', id }).then(({ data }) => data),
  create: (payload) => appClient.functions.invoke('refinance-leads', { action: 'create', payload }).then(({ data }) => data),
  update: (id, payload) => appClient.functions.invoke('refinance-leads', { action: 'update', id, payload }).then(({ data }) => data),
};
